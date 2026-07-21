import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/api';
import { saveSession as saveLocalSession } from '../utils/proctorStore';
import {
  cancelProctorMediaRelease,
  scheduleProctorMediaRelease,
  takeProctorMedia,
} from '../utils/proctorMediaBridge';

// Writing sessiyasini monitoring ro'yxatida Metrica sessiyasidan ajratish uchun
// exam_url sifatida Writing route'ining o'zi yuboriladi.
const WRITING_APP_URL = 'https://protoring.netlify.app/writing-test';
// Davriy (background) snapshot — kamdan-kam. Qoida buzilganda (tab almashish,
// blur, fullscreen chiqish, sichqoncha chetga) darhol alohida screenshot olinadi,
// shuning uchun davriy intervalni katta qilsak ham dalil yo'qolmaydi.
const SNAPSHOT_INTERVAL_MS = 45000;
const SEGMENT_MS = 10000;
const MIN_CLIP_MS = 8000;
const CLIP_BITRATE = 1500000;
const MAX_SNAPSHOT_WIDTH = 1280;

const makeEventId = (type) => {
  const safeType = String(type || 'event').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 28);
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8)
    || Math.random().toString(36).slice(2, 10);
  return `writing_${safeType}_${Date.now()}_${random}`;
};

const createHiddenVideo = (stream) => {
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  Object.assign(video.style, {
    position: 'fixed',
    left: '-10px',
    top: '-10px',
    width: '2px',
    height: '2px',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  document.body.appendChild(video);
  video.play().catch(() => {});
  return video;
};

export const useWritingProctoring = () => {
  const [monitoringStatus, setMonitoringStatus] = useState('idle');
  const [monitoringError, setMonitoringError] = useState('');

  const activeRef = useRef(false);
  const sessionIdRef = useRef(null);
  const warningsRef = useRef(0);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const workerRef = useRef(null);
  const delayedCaptureTimersRef = useRef(new Set());

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const segmentTimerRef = useRef(null);
  const segmentStartedAtRef = useRef(0);
  const clipTimerRef = useRef(null);
  const recorderStoppingRef = useRef(false);
  const stopWaitersRef = useRef([]);
  const pendingClipsRef = useRef([]);

  const pendingRequestsRef = useRef(new Set());
  const eventMetaRef = useRef(new Map());

  // ── Lokal (IndexedDB) nusxa — ProctorMonitor media'ni shu yerdan o'qiydi.
  //    Backend eventga skreenshot/klipni biriktirmagan bo'lsa ham, monitor
  //    lokal nusxadan event_id bo'yicha boyitib ko'rsatadi (Metrica singari).
  const localEventsRef = useRef(new Map()); // eventId -> { event_id, id, type, message, severity, time, image, clipBlob }
  const localMetaRef = useRef({ fullName: '', passportId: '' });
  const persistTimerRef = useRef(null);

  const persistLocal = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const events = [...localEventsRef.current.values()]
        .sort((a, b) => new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime());
      const meta = {
        session_id: sid,
        full_name: localMetaRef.current.fullName || '',
        passport_id: localMetaRef.current.passportId || '',
        status: activeRef.current ? 'active' : 'finished',
        warnings: warningsRef.current,
        exam_url: WRITING_APP_URL,
        session_type: 'writing',
      };
      // Media (rasm/klip) IndexedDB'da — localStorage'ga sig'maydi.
      saveLocalSession(sid, { meta, events, frames: [] });
      // Session ro'yxati + badge uchun localStorage'ga faqat matnli nusxa (mediasiz).
      try {
        const textEvents = events.map(({ clipBlob, image, ...rest }) => rest);
        localStorage.setItem(`proctor_session_${sid}`, JSON.stringify({ meta, events: textEvents, updated_at: Date.now() }));
        const idx = JSON.parse(localStorage.getItem('proctor_session_ids') || '[]');
        if (!idx.includes(sid)) {
          idx.push(sid);
          localStorage.setItem('proctor_session_ids', JSON.stringify(idx));
        }
      } catch { /* localStorage to'la/mavjud emas */ }
    }, 1000);
  }, []);

  // Lokal event yozuvini yaratamiz/yangilaymiz (event_id bo'yicha).
  const upsertLocalEvent = useCallback((eventId, patch) => {
    if (!eventId) return;
    const prev = localEventsRef.current.get(eventId) || { event_id: eventId, id: eventId };
    localEventsRef.current.set(eventId, { ...prev, event_id: eventId, id: eventId, ...patch });
    persistLocal();
  }, [persistLocal]);

  const trackRequest = useCallback((request) => {
    const tracked = Promise.resolve(request).catch(() => null);
    pendingRequestsRef.current.add(tracked);
    tracked.finally(() => pendingRequestsRef.current.delete(tracked));
    return tracked;
  }, []);

  const logEvent = useCallback((type, message, severity = 'info', suppliedId = null) => {
    const sid = sessionIdRef.current;
    const eventId = suppliedId || makeEventId(type);
    const clientTime = new Date().toISOString();
    let request = Promise.resolve(null);

    if (severity === 'warning') warningsRef.current += 1;
    if (sid) {
      request = trackRequest(api.proctorLogEvent(sid, {
        type,
        message,
        severity,
        eventId,
        clientTime,
      }));
      eventMetaRef.current.set(eventId, { request, clientTime });
      upsertLocalEvent(eventId, { type, message, severity, time: clientTime });
    }
    return { eventId, request, clientTime };
  }, [trackRequest, upsertLocalEvent]);

  const captureSnapshot = useCallback((reason, linkedEventId = null) => {
    const screenVideo = screenVideoRef.current;
    const cameraVideo = cameraVideoRef.current;
    const source = screenVideo?.videoWidth ? screenVideo : cameraVideo;
    if (!source?.videoWidth) return null;

    const scale = Math.min(1, MAX_SNAPSHOT_WIDTH / source.videoWidth);
    const width = Math.max(1, Math.round(source.videoWidth * scale));
    const height = Math.max(1, Math.round(source.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(source, 0, 0, width, height);
    if (source === screenVideo && cameraVideo?.videoWidth) {
      const pipWidth = Math.round(width * 0.22);
      const pipHeight = Math.round(pipWidth * (cameraVideo.videoHeight / cameraVideo.videoWidth));
      const x = width - pipWidth - 12;
      const y = height - pipHeight - 12;
      ctx.save();
      ctx.translate(x + pipWidth, y);
      ctx.scale(-1, 1);
      ctx.drawImage(cameraVideo, 0, 0, pipWidth, pipHeight);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, pipWidth, pipHeight);
    }

    const image = canvas.toDataURL('image/jpeg', 0.75);
    const eventMeta = linkedEventId
      ? eventMetaRef.current.get(linkedEventId)
      : logEvent('snapshot', reason, 'info');
    const eventId = linkedEventId || eventMeta?.eventId;
    const sid = sessionIdRef.current;
    if (sid && eventId) {
      const meta = eventMetaRef.current.get(eventId) || eventMeta;
      upsertLocalEvent(eventId, { image, time: meta?.clientTime });
      trackRequest(Promise.resolve(meta?.request).then(() => api.proctorUploadScreenshot(sid, {
        image,
        reason,
        eventId,
        clientTime: meta?.clientTime,
      })));
    }
    return image;
  }, [logEvent, trackRequest, upsertLocalEvent]);

  const emitClip = useCallback((blob, reason, eventId) => {
    if (!blob?.size || blob.size > 10 * 1024 * 1024) return;
    const sid = sessionIdRef.current;
    const meta = eventMetaRef.current.get(eventId);
    if (!sid) return;
    upsertLocalEvent(eventId, { clipBlob: blob });
    trackRequest(Promise.resolve(meta?.request).then(() => api.proctorUploadClip(sid, {
      blob,
      reason,
      eventId,
      clientTime: meta?.clientTime,
    })));
  }, [trackRequest, upsertLocalEvent]);

  const stopRecorder = useCallback(() => {
    recorderStoppingRef.current = true;
    if (segmentTimerRef.current) clearTimeout(segmentTimerRef.current);
    if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
    segmentTimerRef.current = null;
    clipTimerRef.current = null;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return Promise.resolve();

    const stopped = new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(done, 2500);
      stopWaitersRef.current.push(done);
    });
    try { recorder.stop(); } catch {
      stopWaitersRef.current.splice(0).forEach((done) => done());
    }
    return stopped;
  }, []);

  const startRecorder = useCallback(() => {
    const screenTrack = screenStreamRef.current?.getVideoTracks?.()[0];
    if (!screenTrack || typeof MediaRecorder === 'undefined') return;
    const audioTrack = cameraStreamRef.current?.getAudioTracks?.()[0];
    const combined = new MediaStream(audioTrack ? [screenTrack, audioTrack] : [screenTrack]);
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported(type)) || '';
    recorderStoppingRef.current = false;

    const recordSegment = () => {
      if (!activeRef.current || recorderStoppingRef.current || screenTrack.readyState !== 'live') return;
      let recorder;
      try {
        recorder = new MediaRecorder(combined, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: CLIP_BITRATE,
        });
      } catch { return; }

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (segmentTimerRef.current) clearTimeout(segmentTimerRef.current);
        if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
        segmentTimerRef.current = null;
        clipTimerRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        chunksRef.current = [];
        const pending = pendingClipsRef.current;
        pendingClipsRef.current = [];
        pending.forEach(({ reason, eventId }) => emitClip(blob, reason, eventId));
        stopWaitersRef.current.splice(0).forEach((done) => done());
        recordSegment();
      };
      recorderRef.current = recorder;
      try {
        recorder.start(1000);
        segmentStartedAtRef.current = Date.now();
      } catch { return; }
      segmentTimerRef.current = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, SEGMENT_MS);
    };

    recordSegment();
  }, [emitClip]);

  const requestClip = useCallback((reason, eventId) => {
    if (!pendingClipsRef.current.some((item) => item.eventId === eventId)) {
      pendingClipsRef.current.push({ reason, eventId });
    }
    if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
    clipTimerRef.current = setTimeout(() => {
      const recorder = recorderRef.current;
      if (recorder?.state === 'recording') recorder.stop();
    }, SEGMENT_MS);
  }, []);

  const reportViolation = useCallback((type, message) => {
    if (!activeRef.current) return;
    const { eventId } = logEvent(type, message, 'warning');
    captureSnapshot(message, eventId);
    requestClip(message, eventId);

    // visibilitychange ekranning almashishidan bir lahza oldin ishlashi mumkin.
    // Shu sabab boshqa tab ekranga chiqqach yana alohida evidence screenshot olamiz.
    if (type === 'tab_switch' || type === 'window_blur') {
      const timer = setTimeout(() => {
        delayedCaptureTimersRef.current.delete(timer);
        if (!activeRef.current) return;
        const reason = 'Writing left-tab evidence';
        const evidence = logEvent(`${type}_evidence`, reason, 'info');
        captureSnapshot(reason, evidence.eventId);
      }, 1200);
      delayedCaptureTimersRef.current.add(timer);
    }
  }, [captureSnapshot, logEvent, requestClip]);

  const stopPeriodicSnapshots = useCallback(() => {
    if (!workerRef.current) return;
    try { workerRef.current.terminate(); } catch { /* ignore */ }
    workerRef.current = null;
  }, []);

  const startPeriodicSnapshots = useCallback(() => {
    const workerCode = `let timer; onmessage = (event) => {
      if (event.data === 'start') timer = setInterval(() => postMessage('tick'), ${SNAPSHOT_INTERVAL_MS});
      if (event.data === 'stop') clearInterval(timer);
    };`;
    try {
      const workerUrl = URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
      const worker = new Worker(workerUrl);
      URL.revokeObjectURL(workerUrl);
      worker.onmessage = () => {
        if (activeRef.current) captureSnapshot('Writing periodic snapshot');
      };
      worker.postMessage('start');
      workerRef.current = worker;
    } catch {
      // Worker mavjud bo'lmasa violation screenshotlari baribir ishlaydi.
    }
  }, [captureSnapshot]);

  const cleanupMedia = useCallback(() => {
    stopPeriodicSnapshots();
    delayedCaptureTimersRef.current.forEach((timer) => clearTimeout(timer));
    delayedCaptureTimersRef.current.clear();
    cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    [cameraVideoRef, screenVideoRef].forEach((ref) => {
      if (ref.current) {
        ref.current.srcObject = null;
        ref.current.remove();
        ref.current = null;
      }
    });
  }, [stopPeriodicSnapshots]);

  const startMonitoring = useCallback(async ({ fullName, passportId }) => {
    if (activeRef.current) return sessionIdRef.current;
    setMonitoringError('');
    setMonitoringStatus('starting');

    // Kamera, mikrofon VA ekran ulashish Writing'da butunlay o'chirilgan — hech
    // qanday media so'ralmaydi (permission prompt chiqmaydi). Faqat xatti-harakat
    // hodisalari (tab almashish, blur, fullscreen chiqish) backendga event bo'lib
    // yoziladi; screenshot va video-klip olinmaydi.
    const inheritedMedia = takeProctorMedia();
    inheritedMedia?.cameraStream?.getTracks?.().forEach((track) => track.stop());
    inheritedMedia?.screenStream?.getTracks?.().forEach((track) => track.stop());

    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    cameraVideoRef.current = null;
    screenVideoRef.current = null;

    try {
      const response = await api.proctorStartSession({
        fullName,
        passportId,
        examUrl: WRITING_APP_URL,
      });
      const sessionId = response?.session_id || response?.id;
      if (!sessionId) throw new Error('Monitoring API did not return session_id.');
      sessionIdRef.current = sessionId;
      activeRef.current = true;
      warningsRef.current = 0;
      localMetaRef.current = { fullName, passportId };
      localEventsRef.current.clear();
      logEvent('writing_monitoring_started', 'Writing monitoring started', 'info');
      setMonitoringStatus('active');
      try { sessionStorage.setItem('writing_proctor_session_id', sessionId); } catch { /* ignore */ }
      return sessionId;
    } catch (error) {
      cleanupMedia();
      setMonitoringError(error?.message || 'Could not start Writing monitoring.');
      setMonitoringStatus('error');
      throw error;
    }
  }, [cleanupMedia, logEvent]);

  useEffect(() => {
    cancelProctorMediaRelease();
    return () => scheduleProctorMediaRelease();
  }, []);

  const finishMonitoring = useCallback(async () => {
    if (!sessionIdRef.current) {
      cleanupMedia();
      return;
    }
    // Oxirgi violation finishdan sal oldin bo'lsa ham klip 8 sekunddan kalta
    // bo'lmasin. Pending klip bo'lmasa hech qanday kutish yo'q.
    if (pendingClipsRef.current.length && recorderRef.current?.state === 'recording') {
      const elapsed = Date.now() - segmentStartedAtRef.current;
      const remaining = Math.max(0, MIN_CLIP_MS - elapsed);
      if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    activeRef.current = false;
    persistLocal(); // yakuniy holatni (status: finished) lokal nusxaga yozamiz
    stopPeriodicSnapshots();
    await stopRecorder();
    while (pendingRequestsRef.current.size) {
      await Promise.allSettled([...pendingRequestsRef.current]);
    }
    try {
      await api.proctorFinishSession(sessionIdRef.current, { warnings: warningsRef.current });
    } catch { /* essay submission must still finish locally */ }
    try { sessionStorage.removeItem('writing_proctor_session_id'); } catch { /* ignore */ }
    sessionIdRef.current = null;
    eventMetaRef.current.clear();
    cleanupMedia();
    setMonitoringStatus('finished');
  }, [cleanupMedia, persistLocal, stopPeriodicSnapshots, stopRecorder]);

  useEffect(() => () => {
    activeRef.current = false;
    recorderStoppingRef.current = true;
    stopPeriodicSnapshots();
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      try { recorder.stop(); } catch { /* ignore */ }
    }
    cleanupMedia();
  }, [cleanupMedia, stopPeriodicSnapshots]);

  return {
    monitoringStatus,
    monitoringError,
    startMonitoring,
    finishMonitoring,
    reportViolation,
  };
};
