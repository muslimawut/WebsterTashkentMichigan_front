import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { handoffProctorMedia } from '../utils/proctorMediaBridge';
import websterLogo from '../../logowhitewebster.png';
import { saveSession as saveLocalSession } from '../utils/proctorStore';

/*
  Proctoring sahifasi.
  Imtihon Cambridge Metrica portalida topshiriladi, ammo nazorat (proctoring)
  shu MEPT sahifasi orqali fon rejimida ishlaydi:
    - kamera holatini kuzatadi
    - tab almashtirilganini log qiladi
    - fullscreen'dan chiqib ketganini log qiladi
  Birinchi versiya: AI face detection yo'q, faqat kamera ruxsati + session
  tracking + tab/fullscreen monitoring. Dizayn — premium "command-center".
*/

// Metrica imtihon linki — env orqali sozlanadi, aks holda placeholder.
const METRICA_EXAM_URL =
  import.meta.env.VITE_METRICA_EXAM_URL || 'https://metrica.cambridgemichigan.org/metrica/';

// Backend session payloadidagi exam_url — proctoring frontend manzili.
// Metrica tabini ochadigan URL bilan aralashtirilmaydi.
const PROCTORING_APP_URL = 'https://protoring.netlify.app/';

const SNAPSHOT_INTERVAL_MS = 8000;  // davriy ekran snapshoti (boshqa sahifaga o'tishни tez tutish uchun)
const SNAPSHOT_MAX_W = 1920;        // snapshot eni (aniqroq — matn o'qiladi)
const SNAPSHOT_QUALITY = 0.85;      // JPEG sifati (0-1)

// Gaze / bosh yo'nalishi (ekrandan boshqa yoqqa qarash) — cheating aniqlash
const GAZE_YAW_LIMIT = 25;          // gradus: chapga/o'ngga burilish chegarasi
const GAZE_PITCH_LIMIT = 22;        // gradus: yuqoriga/pastga burilish chegarasi
const EYE_SIDE_LIMIT = 0.85;        // ko'z chapga/o'ngga (blendshape jami, 0-2) — kuchli signal
const EYE_DOWN_LIMIT = 0.9;         // ko'z pastga (telefon/qog'oz)
// Iris (qorachiq) asosidagi aniq gaze
const GAZE_SMOOTH = 0.35;           // EMA silliqlash koeffitsienti (0-1)
const GAZE_H_DEV = 0.11;            // markazdan gorizontal chetlanish chegarasi
const GAZE_V_DEV = 0.12;            // markazdan vertikal (past) chetlanish chegarasi
const EYE_OPEN_MIN = 0.15;          // ko'z ochiqligi (balandlik/kenglik) — pastda "yumuq"
const GAZE_BASELINE_SAMPLES = 28;   // kalibratsiya kadrlar soni (~2.3s @ 12fps)
const MULTI_FACE_HOLD_MS = 1200;    // 2-yuz shuncha davom etsa → cheating (yolg'onni kamaytirish)
const MULTI_FACE_COOLDOWN_MS = 10000; // 2-yuz klip cooldown (spam bo'lmasligi uchun)

// Ikki ko'z irisidan gorizontal/vertikal gaze nisbati (markaz ≈ 0) va ochiqlik
const irisGaze = (lm) => {
  const need = [468, 473, 33, 133, 159, 145, 362, 263, 386, 374];
  for (const i of need) if (!lm[i]) return null;
  // O'ng ko'z: 33 (tashqi), 133 (ichki), iris 468; qovoqlar 159/145
  const rW = Math.abs(lm[33].x - lm[133].x) || 1e-6;
  const rH = Math.abs(lm[159].y - lm[145].y) || 1e-6;
  const rh = (lm[468].x - (lm[33].x + lm[133].x) / 2) / rW;
  const rv = (lm[468].y - (lm[159].y + lm[145].y) / 2) / rH;
  // Chap ko'z: 362 (ichki), 263 (tashqi), iris 473; qovoqlar 386/374
  const lW = Math.abs(lm[362].x - lm[263].x) || 1e-6;
  const lH = Math.abs(lm[386].y - lm[374].y) || 1e-6;
  const lh = (lm[473].x - (lm[362].x + lm[263].x) / 2) / lW;
  const lv = (lm[473].y - (lm[386].y + lm[374].y) / 2) / lH;
  const open = (rH / rW + lH / lW) / 2; // ko'z ochiqligi
  return { h: (rh + lh) / 2, v: (rv + lv) / 2, open };
};
// Eye/gaze policy: qisqa tabiiy qarashlar false-positive bo'lmasligi uchun flag qilinmaydi.
const QUICK_GLANCE_IGNORE_MS = 3000;           // <3s: blink/thinking/adjusting — ignore
const SUSTAINED_LOOK_AWAY_MS = 10000;          // 10s uzluksiz: darhol flag
const FACE_MISSING_HOLD_MS = 30000;            // yuz yo'q/butunlay burilgan: 30s
const SAME_DIRECTION_WINDOW_MS = 120000;       // bir yo'nalish patterni uchun 2 min rolling window
const SAME_DIRECTION_MIN_SPAN_MS = 60000;      // pattern kamida 1 min davom etishi kerak
const SAME_DIRECTION_MIN_GLANCES = 4;
const SIDE_TO_SIDE_WINDOW_MS = 180000;         // chap-o'ng pattern uchun 3 min window
const SIDE_TO_SIDE_MIN_SPAN_MS = 120000;       // kamida 2 min pattern
const SIDE_TO_SIDE_MIN_SWITCHES = 5;

// Shubhali lahzada ekran video-klip
const SEGMENT_MS = 10000;           // har bir violation klipi taxminan 10 sekund
const MIN_CLIP_MS = 8000;           // finish paytida ham klip bundan kalta bo'lmaydi
const CLIP_POSTROLL_MS = 10000;      // tabiiy segment chegarasi ishlamasa ham 10s gacha yozish
const CLIP_BITRATE = 1500000;       // ~1.5 Mbps

// Yuz transformatsiya matritsasidan (4x4, column-major) yaw/pitch (gradus)
const eulerFromMatrix = (d) => {
  const r00 = d[0], r10 = d[1], r20 = d[2], r21 = d[6], r22 = d[10];
  const sy = Math.hypot(r00, r10);
  const pitch = (Math.atan2(r21, r22) * 180) / Math.PI;
  const yaw = (Math.atan2(-r20, sy) * 180) / Math.PI;
  return { yaw, pitch };
};

const fmtClock = (d) =>
  d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const getProctoringApiErrorMessage = (error) => {
  const data = error?.data;
  if (data && typeof data === 'object') {
    if (data.detail) return String(data.detail);
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
  }
  return error?.message || 'Proctoring API is unavailable.';
};

const makeEventId = (type) => {
  const safeType = String(type || 'event').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 28);
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8)
    || Math.random().toString(36).slice(2, 10);
  return `client_${safeType}_${Date.now()}_${random}`;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// `MediaStreamTrack.readyState === "live"` faqat permission/track ochilganini
// bildiradi; real kamera kadri kelayotganini bildirmaydi. Canvas orqali haqiqiy
// decoded frame va qora bo'lmagan tasvirni tekshiramiz.
const cameraFrameIsVisible = (video) => {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 54;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let luminanceTotal = 0;
    let visiblePixels = 0;
    const pixelCount = pixels.length / 4;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const luminance = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
      luminanceTotal += luminance;
      if (luminance > 12) visiblePixels += 1;
    }
    const averageLuminance = luminanceTotal / pixelCount;
    const visibleRatio = visiblePixels / pixelCount;
    return averageLuminance >= 8 || visibleRatio >= 0.02;
  } catch {
    return false;
  }
};

const verifyCameraFeed = async (video, timeoutMs = 9000) => {
  if (!video) return false;
  try { await video.play(); } catch { /* readiness loop below gives the real result */ }
  const deadline = Date.now() + timeoutMs;
  let visibleSamples = 0;
  while (Date.now() < deadline) {
    if (cameraFrameIsVisible(video)) {
      visibleSamples += 1;
      // Ikki alohida sample: startupdagi bitta eski/placeholder frame yetarli emas.
      if (visibleSamples >= 2) return true;
    } else {
      visibleSamples = 0;
    }
    await wait(300);
  }
  return false;
};

// phase: 'idle' | 'checking' | 'ready' | 'active' | 'finished'

const ProctoringExam = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState('idle');
  const [fullName, setFullName] = useState('');
  const [passportId, setPassportId] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [warnings, setWarnings] = useState(0);
  const [events, setEvents] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);   // 0-100, jonli ovoz darajasi
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [handStatus, setHandStatus] = useState('off'); // 'off' | 'loading' | 'ready' | 'error'
  const [handVisible, setHandVisible] = useState(false);
  const [gazeAway, setGazeAway] = useState(false);     // hozir boshqa yoqqa qarayaptimi
  const [awayCount, setAwayCount] = useState(0);       // boshqa yoqqa qarash soni (rolling)
  const [clipRecording, setClipRecording] = useState(false); // ekran zapisi ketyaptimi
  const [calibrating, setCalibrating] = useState(false);     // gaze kalibratsiya jarayoni
  const [calibProgress, setCalibProgress] = useState(0);     // kalibratsiya foizi
  const [faceCount, setFaceCount] = useState(0);             // kadrdagi yuzlar soni
  const [shotCount, setShotCount] = useState(0);
  const [screenOn, setScreenOn] = useState(false);
  const [examOpened, setExamOpened] = useState(false);
  const [examBlocked, setExamBlocked] = useState(false);
  const [frameTick, setFrameTick] = useState(0); // davriy kadr yig'ilganda saqlashni trigger qiladi
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIdRef = useRef(null);
  const warningsRef = useRef(0);
  const activeRef = useRef(false);
  const mediaHandedOffRef = useRef(false);
  const startedAtRef = useRef(0);
  const examTabRef = useRef(null);

  // Web Audio — mikrofon ovoz darajasini o'lchash uchun
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // MediaPipe hand detection — qo'l ko'tarilganda skrinshot olish uchun
  const handRaisedRef = useRef(false);   // edge-trigger (bir ko'tarishga bitta skrinshot)
  const lastCaptureRef = useRef(0);      // oxirgi skrinshot vaqti (cooldown)

  // Gaze (ekrandan boshqa yoqqa qarash) holati
  const awayActiveRef = useRef(false);   // hozir "boshqa yoqqa qarash" davom etyaptimi
  const awayStartRef = useRef(0);        // qarash boshlangan vaqt
  const awayCountRef = useRef(0);        // qarashlar soni (rolling)
  const awayFlaggedRef = useRef(false);  // shu qarash-epizodda klip olindimi
  const awayDirectionRef = useRef('unknown');
  const glanceHistoryRef = useRef([]);   // 1-3 minutlik yo'nalish patternlari
  const noFaceStartRef = useRef(0);
  const noFaceFlaggedRef = useRef(false);
  const gazeEmaRef = useRef({ h: 0, v: 0, init: false }); // silliqlangan gaze
  const baselineRef = useRef({ h: 0, v: 0, n: 0, ready: false }); // kalibratsiya markazi
  const multiFaceStartRef = useRef(0);   // 2-yuz boshlangan vaqt
  const multiFaceShotRef = useRef(0);    // 2-yuz klip cooldown

  // Ekran ulashish (getDisplayMedia) — davriy snapshot uchun
  const screenStreamRef = useRef(null);
  const screenVideoRef = useRef(null);   // yashirin video (snapshot manbai)

  // Uzluksiz segment-recorder (ekran video-klip) — fon-tabда ham ishonchli.
  // Ekran-share boshlanganda ishga tushadi va ~SEGMENT_MS'lik mustaqil segmentlar
  // yozadi; cheating bo'lganда o'sha segment klip sifatida chiqadi.
  const segRecorderRef = useRef(null);
  const segChunksRef = useRef([]);
  const segTimerRef = useRef(null);
  const segStartedAtRef = useRef(0);
  const segStoppingRef = useRef(false);
  const clipStopTimerRef = useRef(null);
  const segStopWaitersRef = useRef([]);
  const pendingApiRequestsRef = useRef(new Set());
  const eventMetaRef = useRef(new Map()); // event_id → request + yagona client_time
  // Bitta recorder segmenti ichida bir nechta violation bo'lishi mumkin. Har biri
  // o'z event_id'si bilan shu klipga bog'lanishi uchun queue saqlaymiz.
  const pendingClipsRef = useRef([]);
  const framesRef = useRef([]);        // davriy ekran kadrlari (vision tab-check uchun)

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const trackApiRequest = useCallback((request) => {
    const tracked = Promise.resolve(request).catch(() => null);
    pendingApiRequestsRef.current.add(tracked);
    tracked.finally(() => pendingApiRequestsRef.current.delete(tracked));
    return tracked;
  }, []);

  /* ── Hodisa log qilish ──────────────────────────────────── */
  const logEvent = useCallback((type, message, severity = 'info', extra = null) => {
    const time = new Date();
    const eventId = extra?.id || makeEventId(type);
    const entry = { type, message, severity, time, ...(extra || {}), id: eventId };
    // Activity log media arxivi: eski eventlarni kesmaymiz. Screenshot va kliplar
    // IndexedDB'da saqlanadi, monitor esa sessiyadagi hammasini ko'rsatadi.
    setEvents((prev) => [entry, ...prev]);

    if (severity === 'warning') {
      warningsRef.current += 1;
      setWarnings(warningsRef.current);
    }

    const sid = sessionIdRef.current;
    let request = Promise.resolve(null);
    if (sid) {
      // extra.id — cheating hodisasi id'si (skreenshot/klip shu id bilan bog'lanadi)
      request = trackApiRequest(api.proctorLogEvent(sid, {
        type,
        message,
        severity,
        eventId,
        clientTime: time.toISOString(),
      }));
      eventMetaRef.current.set(eventId, { request, clientTime: time.toISOString() });
    }
    return { entry, request };
  }, [trackApiRequest]);

  /* ── Snapshot olish (ekran + kamera PIP) ─────────────────── */
  const captureSnapshot = useCallback((reason, { silent = false, eventId = null } = {}) => {
    const screenVid = screenVideoRef.current;
    const camVid = videoRef.current;
    const useScreen = screenVid && screenVid.videoWidth > 0;
    const source = useScreen ? screenVid : (camVid && camVid.videoWidth > 0 ? camVid : null);
    if (!source) return null;

    const sw = source.videoWidth;
    const sh = source.videoHeight;
    const scale = Math.min(1, SNAPSHOT_MAX_W / sw);
    const w = Math.round(sw * scale);
    const h = Math.round(sh * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high'; // sifatli masshtablash

    if (useScreen) {
      // Asosiy kadr — ekran
      ctx.drawImage(screenVid, 0, 0, w, h);
      // Kamera — o'ng-past burchakda kichik PIP (ko'zgu)
      if (camVid && camVid.videoWidth > 0) {
        const pw = Math.round(w * 0.22);
        const ph = Math.round(pw * (camVid.videoHeight / camVid.videoWidth));
        const px = w - pw - 12;
        const py = h - ph - 12;
        ctx.save();
        ctx.translate(px + pw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(camVid, 0, 0, pw, ph);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);
      }
    } else {
      // Ekran yo'q — faqat kamera (ko'zgu)
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(camVid, 0, 0, w, h);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', SNAPSHOT_QUALITY);
    const snapshotId = eventId || `shot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setShotCount((c) => c + 1);

    // Cheating snapshoti parent warning eventiga biriktiriladi. Qolgan barcha
    // (periodic, session start, tab return) screenshotlar alohida info event bo'lib
    // Activity log'ga tushadi. Shu sabab hech bir olingan rasm yashirin qolmaydi.
    const logged = !eventId
      ? logEvent('snapshot', reason, silent ? 'info' : 'warning', { id: snapshotId, image: dataUrl })
      : null;

    const sid = sessionIdRef.current;
    if (sid) {
      const meta = eventMetaRef.current.get(snapshotId);
      const eventRequest = meta?.request || logged?.request || Promise.resolve();
      const clientTime = meta?.clientTime || logged?.entry?.time?.toISOString() || new Date().toISOString();
      // Guide talabi: event serverda yaratilgach aynan shu event_id bilan media yuboriladi.
      trackApiRequest(eventRequest.then(() => api.proctorUploadScreenshot(sid, {
        image: dataUrl,
        reason,
        eventId: snapshotId,
        clientTime,
      })));
    }
    return dataUrl;
  }, [logEvent, trackApiRequest]);

  /* ── Klip chiqarish (tayyor segment blob'idan) ───────────── */
  const emitClip = useCallback((blob, reason, eventId) => {
    if (!blob || !blob.size) return;
    const url = URL.createObjectURL(blob);
    const sizeKB = Math.round(blob.size / 1024);
    // Lokal monitorda video aynan tab_switch/window_blur eventining ichida ko'rinsin.
    // Oldingi oqim klipni alohida event qilib saqlagani sababli association yo'qolardi.
    setEvents((prev) => prev.map((event) => (
      event.id === eventId
        ? { ...event, clip: url, clipBlob: blob, clipSizeKB: sizeKB }
        : event
    )));
    const sid = sessionIdRef.current;
    if (sid) {
      const meta = eventMetaRef.current.get(eventId);
      const eventRequest = meta?.request || Promise.resolve();
      trackApiRequest(eventRequest.then(() => api.proctorUploadClip(sid, {
        blob,
        reason,
        eventId,
        clientTime: meta?.clientTime,
      })));
    }
  }, [trackApiRequest]);

  /* ── Uzluksiz segment-recorder ───────────────────────────── */
  const stopSegmentLoop = useCallback(() => {
    segStoppingRef.current = true;
    if (segTimerRef.current) { clearTimeout(segTimerRef.current); segTimerRef.current = null; }
    if (clipStopTimerRef.current) { clearTimeout(clipStopTimerRef.current); clipStopTimerRef.current = null; }
    const rec = segRecorderRef.current;
    let stopped = Promise.resolve();
    if (rec && rec.state !== 'inactive') {
      stopped = new Promise((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve();
        };
        const timeout = setTimeout(done, 2500); // buzilgan recorder finish'ni bloklamasin
        segStopWaitersRef.current.push(done);
      });
      try { rec.stop(); } catch {
        segStopWaitersRef.current.splice(0).forEach((resolve) => resolve());
      }
    }
    segRecorderRef.current = null;
    setClipRecording(false);
    return stopped;
  }, []);

  const startSegmentLoop = useCallback(() => {
    const stream = screenStreamRef.current;
    if (!stream || typeof window.MediaRecorder === 'undefined') return;
    segStoppingRef.current = false;

    const vTrack = stream.getVideoTracks()[0];
    const aTrack = streamRef.current?.getAudioTracks?.()[0]; // mikrofon (ovoz)
    const combined = new MediaStream(aTrack ? [vTrack, aTrack] : [vTrack]);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find((m) => MediaRecorder.isTypeSupported(m)) || '';

    const recordOne = () => {
      if (segStoppingRef.current || !screenStreamRef.current || !activeRef.current) return;
      let rec;
      try {
        rec = new MediaRecorder(combined, { mimeType: mime || undefined, videoBitsPerSecond: CLIP_BITRATE });
      } catch { return; }
      segChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) segChunksRef.current.push(e.data); };
      rec.onstop = () => {
        if (segTimerRef.current) { clearTimeout(segTimerRef.current); segTimerRef.current = null; }
        if (clipStopTimerRef.current) { clearTimeout(clipStopTimerRef.current); clipStopTimerRef.current = null; }
        const blob = new Blob(segChunksRef.current, { type: mime || 'video/webm' });
        segChunksRef.current = [];
        // Shu segmentdagi barcha cheating eventlariga bir xil klipni bog'laymiz.
        const pending = pendingClipsRef.current;
        pendingClipsRef.current = [];
        if (pending.length && blob.size) {
          setClipRecording(false);
          pending.forEach(({ reason, eventId }) => emitClip(blob, reason, eventId));
        }
        segStopWaitersRef.current.splice(0).forEach((resolve) => resolve());
        // Keyingi segmentni boshlaymiz
        recordOne();
      };
      segRecorderRef.current = rec;
      try {
        rec.start(1000);
        segStartedAtRef.current = Date.now();
      } catch { return; }
      segTimerRef.current = setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } }, SEGMENT_MS);
    };
    recordOne();
  }, [emitClip]);

  /* ── Shubhali lahzada klip so'raymiz (joriy segment chiqadi) ─ */
  const requestClip = useCallback((reason, eventId) => {
    if (!pendingClipsRef.current.some((item) => item.eventId === eventId)) {
      pendingClipsRef.current.push({ reason, eventId });
    }
    setClipRecording(true);

    // Asosiy recorder segmenti 10s. Ushbu timer tabiiy segment chegarasi biror
    // sabab bilan ishlamasa ham violation klipini 10s dan keyin finalizatsiya qiladi.
    if (clipStopTimerRef.current) clearTimeout(clipStopTimerRef.current);
    clipStopTimerRef.current = setTimeout(() => {
      const rec = segRecorderRef.current;
      if (rec?.state === 'recording') {
        try { rec.stop(); } catch { /* ignore */ }
      }
    }, CLIP_POSTROLL_MS);
  }, []);

  /* ── Shubhali/cheating hodisa: log + snapshot + video-klip ─
     Bir xil event_id: log, skreenshot va klip o'sha id bilan yuboriladi —
     backend qaysi cheating hodisasiga tegishli ekanini aniq bog'laydi. */
  const flagCheating = useCallback((type, message) => {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    // Eventni avval yaratamiz; screenshot/clip uploadlari shu event_id'ga ulanadi.
    logEvent(type, message, 'warning', { id: eventId });
    const img = captureSnapshot(message, { silent: true, eventId }); // skrinshot (o'sha id bilan)
    if (img) {
      setEvents((prev) => prev.map((event) => (
        event.id === eventId ? { ...event, image: img } : event
      )));
    }
    requestClip(message, eventId); // joriy segment klip bo'lib chiqadi (o'sha id)
  }, [captureSnapshot, logEvent, requestClip]);

  /* ── Qo'l natijalarini baholash (ko'tarilgan qo'lni aniqlash) ─ */
  const handleHandResults = useCallback((res) => {
    const hands = res?.landmarks || [];
    setHandVisible(hands.length > 0);

    // Ko'tarilgan qo'l = barmoq uchlari bilakdan sezilarli yuqorida (yuqoriga qaragan).
    // MediaPipe koordinatalari normallashgan; y=0 tepa, y=1 past.
    let raised = false;
    for (const lm of hands) {
      const wrist = lm[0];
      const middleTip = lm[12];
      const indexTip = lm[8];
      if (
        wrist && middleTip && indexTip &&
        middleTip.y < wrist.y - 0.15 &&
        indexTip.y < wrist.y - 0.1
      ) {
        raised = true;
        break;
      }
    }

    if (raised) {
      if (!handRaisedRef.current) {
        handRaisedRef.current = true;
        const nowT = Date.now();
        if (nowT - lastCaptureRef.current > 4000) { // 4s cooldown — spam bo'lmasligi uchun
          lastCaptureRef.current = nowT;
          flagCheating('hand_raised', 'Hand raised — suspicious');
        }
      }
    } else {
      handRaisedRef.current = false;
    }
  }, [flagCheating]);

  /* ── Gaze holatidan cheating epizodini baholash ─────────── */
  const evalGaze = useCallback((away, nowT, direction = 'unknown', faceTurnedAway = false) => {
    if (away) {
      if (!awayActiveRef.current) {
        awayActiveRef.current = true;
        awayStartRef.current = nowT;
        awayFlaggedRef.current = false;
        awayDirectionRef.current = faceTurnedAway ? 'face_turned' : direction;
      } else {
        if (faceTurnedAway) awayDirectionRef.current = 'face_turned';
        else if (awayDirectionRef.current === 'unknown' && direction !== 'unknown') awayDirectionRef.current = direction;
        const dur = nowT - awayStartRef.current;
        const threshold = awayDirectionRef.current === 'face_turned'
          ? FACE_MISSING_HOLD_MS
          : SUSTAINED_LOOK_AWAY_MS;
        if (!awayFlaggedRef.current && dur >= threshold) {
          awayFlaggedRef.current = true;
          if (awayDirectionRef.current === 'face_turned') {
            flagCheating('face_turned_away', 'Face turned away from the camera for 30 seconds — cheating');
          } else {
            flagCheating('gaze_away_long', `Sustained look away from screen for ${Math.round(dur / 1000)}s — cheating`);
          }
        }
      }
    } else if (awayActiveRef.current) {
      const dur = nowT - awayStartRef.current;
      const directionAtEnd = awayDirectionRef.current;
      const wasFlagged = awayFlaggedRef.current;
      awayActiveRef.current = false;
      awayDirectionRef.current = 'unknown';
      awayFlaggedRef.current = false;

      // Bitta <3s qarash normal holat; sustained episode allaqachon flag qilingan.
      if (dur < QUICK_GLANCE_IGNORE_MS || wasFlagged || directionAtEnd === 'face_turned') return;

      const cutoff = nowT - SIDE_TO_SIDE_WINDOW_MS;
      const history = [
        ...glanceHistoryRef.current.filter((item) => item.time >= cutoff),
        { time: nowT, duration: dur, direction: directionAtEnd },
      ];
      glanceHistoryRef.current = history;
      awayCountRef.current = history.length;
      setAwayCount(history.length);

      // Bir xil yo'nalishdagi takroriy qarash: kamida 4 glance va 1-2 min pattern.
      const sameDirection = history.filter((item) => (
        item.direction === directionAtEnd && item.time >= nowT - SAME_DIRECTION_WINDOW_MS
      ));
      const sameSpan = sameDirection.length > 1
        ? sameDirection[sameDirection.length - 1].time - sameDirection[0].time
        : 0;
      if (
        directionAtEnd !== 'unknown'
        && sameDirection.length >= SAME_DIRECTION_MIN_GLANCES
        && sameSpan >= SAME_DIRECTION_MIN_SPAN_MS
      ) {
        flagCheating(
          'gaze_away_pattern',
          `Repeated glances ${directionAtEnd} over ${Math.round(sameSpan / 1000)}s — cheating pattern`
        );
        glanceHistoryRef.current = history.filter((item) => item.direction !== directionAtEnd);
        awayCountRef.current = glanceHistoryRef.current.length;
        setAwayCount(awayCountRef.current);
        return;
      }

      // Chap-o'ng qayta-qayta qarash: normal o'qishdan ajratish uchun 2 min pattern.
      const lateral = history.filter((item) => (
        (item.direction === 'left' || item.direction === 'right')
        && item.time >= nowT - SIDE_TO_SIDE_WINDOW_MS
      ));
      let switches = 0;
      for (let i = 1; i < lateral.length; i += 1) {
        if (lateral[i].direction !== lateral[i - 1].direction) switches += 1;
      }
      const lateralSpan = lateral.length > 1 ? lateral[lateral.length - 1].time - lateral[0].time : 0;
      if (switches >= SIDE_TO_SIDE_MIN_SWITCHES && lateralSpan >= SIDE_TO_SIDE_MIN_SPAN_MS) {
        flagCheating('gaze_side_to_side', 'Repeated side-to-side eye movement for 2+ minutes — cheating pattern');
        glanceHistoryRef.current = [];
        awayCountRef.current = 0;
        setAwayCount(0);
      }
    }
  }, [flagCheating]);

  const evalNoFace = useCallback((missing, nowT) => {
    if (!missing) {
      noFaceStartRef.current = 0;
      noFaceFlaggedRef.current = false;
      return;
    }
    if (!noFaceStartRef.current) noFaceStartRef.current = nowT;
    const duration = nowT - noFaceStartRef.current;
    if (!noFaceFlaggedRef.current && duration >= FACE_MISSING_HOLD_MS) {
      noFaceFlaggedRef.current = true;
      flagCheating('no_face_long', 'Face not visible for 30 seconds — cheating');
    }
  }, [flagCheating]);

  /* ── Yuz natijalari — ko'z/gaze aniqlash (iris + blendshape + bosh) ─ */
  const handleFaceResults = useCallback((res) => {
    const faces = res?.faceLandmarks || [];
    setFaceCount(faces.length);
    const nowT0 = Date.now();

    // Ikkinchi inson yuzi kadrga kirsa → cheating (biroz davom etsa)
    if (faces.length >= 2) {
      if (!multiFaceStartRef.current) multiFaceStartRef.current = nowT0;
      const dur = nowT0 - multiFaceStartRef.current;
      if (dur >= MULTI_FACE_HOLD_MS && nowT0 - multiFaceShotRef.current > MULTI_FACE_COOLDOWN_MS) {
        multiFaceShotRef.current = nowT0;
        flagCheating('second_face', `Second person detected (${faces.length} faces) — cheating`);
      }
    } else {
      multiFaceStartRef.current = 0;
    }

    // Yuz yo'q — ekranga qaramayapti (kalibratsiyadan keyingina cheating sifatida)
    if (faces.length === 0) {
      if (baselineRef.current.ready) {
        setGazeAway(true);
        if (awayActiveRef.current) evalGaze(false, nowT0);
        evalNoFace(true, nowT0);
      }
      return;
    }
    evalNoFace(false, nowT0);

    const lm = faces[0];
    let away = false;
    let strongTurn = false; // bosh/ko'z keskin burilgan (kalibratsiyasiz ham aniq)
    let faceTurnedAway = false;
    let direction = 'unknown';

    // 1) BOSH yo'nalishi (yaw/pitch)
    const m = res.facialTransformationMatrixes?.[0]?.data;
    if (m) {
      const { yaw, pitch } = eulerFromMatrix(m);
      if (Math.abs(yaw) > GAZE_YAW_LIMIT || Math.abs(pitch) > GAZE_PITCH_LIMIT) {
        strongTurn = true;
        direction = Math.abs(yaw) >= Math.abs(pitch)
          ? (yaw > 0 ? 'right' : 'left')
          : (pitch > 0 ? 'down' : 'up');
      }
      faceTurnedAway = Math.abs(yaw) > 45 || Math.abs(pitch) > 35;
      if (faceTurnedAway) direction = 'face_turned';
    }

    // 2) KO'Z yo'nalishi (blendshapes) — keskin holat
    const cats = res.faceBlendshapes?.[0]?.categories;
    if (cats) {
      const bs = (name) => cats.find((c) => c.categoryName === name)?.score || 0;
      const lookRight = bs('eyeLookOutLeft') + bs('eyeLookInRight');
      const lookLeft = bs('eyeLookInLeft') + bs('eyeLookOutRight');
      const lookDown = bs('eyeLookDownLeft') + bs('eyeLookDownRight');
      if (lookRight > EYE_SIDE_LIMIT || lookLeft > EYE_SIDE_LIMIT || lookDown > EYE_DOWN_LIMIT) {
        strongTurn = true;
        if (lookDown >= lookRight && lookDown >= lookLeft) direction = 'down';
        else direction = lookRight > lookLeft ? 'right' : 'left';
      }
    }

    // 3) IRIS (qorachiq) — eng aniq: EMA silliqlash + shaxsiy kalibratsiya markazi
    const iris = irisGaze(lm);
    const eyesClosed = iris ? iris.open < EYE_OPEN_MIN : false;

    if (iris && !eyesClosed) {
      const ema = gazeEmaRef.current;
      if (!ema.init) { ema.h = iris.h; ema.v = iris.v; ema.init = true; }
      else {
        ema.h = ema.h * (1 - GAZE_SMOOTH) + iris.h * GAZE_SMOOTH;
        ema.v = ema.v * (1 - GAZE_SMOOTH) + iris.v * GAZE_SMOOTH;
      }

      const base = baselineRef.current;
      if (!base.ready) {
        // Kalibratsiya: bosh to'g'ri va ko'z ochiq bo'lganda markazni yig'amiz
        if (!strongTurn) {
          base.h += iris.h; base.v += iris.v; base.n += 1;
          setCalibProgress(Math.min(100, Math.round((base.n / GAZE_BASELINE_SAMPLES) * 100)));
          if (base.n >= GAZE_BASELINE_SAMPLES) {
            base.h /= base.n; base.v /= base.n; base.ready = true;
            setCalibrating(false);
            logEvent('gaze_calibrated', 'Eye calibration confirmed', 'info');
          }
        }
      } else {
        const hc = ema.h - base.h;
        const vc = ema.v - base.v;
        if (Math.abs(hc) > GAZE_H_DEV || vc > GAZE_V_DEV) {
          away = true;
          direction = Math.abs(hc) >= Math.abs(vc)
            ? (hc > 0 ? 'right' : 'left')
            : 'down';
        }
      }
    }

    // Cheating baholash faqat kalibratsiya tasdiqlangandan keyin
    if (baselineRef.current.ready) {
      if (strongTurn) away = true;
      setGazeAway(away);
      evalGaze(away, nowT0, direction, faceTurnedAway);
    }
  }, [evalGaze, evalNoFace, flagCheating, logEvent]);

  /* ── Stream / kamera holatini kuzatish ──────────────────── */
  const attachTrackWatchers = useCallback((stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const markDisconnected = (reason) => {
      if (!activeRef.current) return;
      setCameraOn(false);
      logEvent('camera_disconnected', `Camera disconnected (${reason})`, 'warning');
    };

    videoTrack.addEventListener('ended', () => markDisconnected('ended'));
    videoTrack.addEventListener('mute', () => markDisconnected('muted'));
    videoTrack.addEventListener('unmute', () => {
      if (!activeRef.current) return;
      setCameraOn(true);
      logEvent('camera_reconnected', 'Camera reconnected', 'info');
    });
  }, [logEvent]);

  /* ── Mikrofon ovoz darajasini o'lchash (voice detection) ── */
  const stopAudioMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
    setVoiceDetected(false);
  }, []);

  const startAudioMeter = useCallback((stream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const VOICE_THRESHOLD = 12; // shu darajadan yuqori bo'lsa "ovoz bor" deb hisoblaymiz

      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(data);
        // RMS asosida o'rtacha quvvat
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(100, Math.round((rms / 140) * 100));
        setAudioLevel(level);
        setVoiceDetected(level > VOICE_THRESHOLD);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* Web Audio qo'llab-quvvatlanmasa — meter'siz davom etamiz */
    }
  }, []);

  /* ── Kamera + mikrofon ruxsatini so'rash va tekshirish ──── */
  const checkDevices = useCallback(async () => {
    setPermissionError('');
    setPhase('checking');
    let stream = null;
    try {
      // Oldingi muvaffaqiyatsiz urinishdan qolgan tracklar LED'ni bekorga yoqib
      // turmasin va keyingi retry kamerani qayta ochsin.
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      stopAudioMeter();
      setCameraOn(false);
      setMicOn(false);

      stream = await navigator.mediaDevices.getUserMedia({
        // 720p — AI detection uchun yengil va yetarli (PIP kichik). 1080p thread'ni bo'g'adi.
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 },
        },
        audio: true,
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      const camActive = !!videoTrack && videoTrack.readyState === 'live';
      if (!camActive) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraOn(false);
        setPermissionError('Camera not found or not enabled. Check your device and try again.');
        setPhase('idle');
        return;
      }

      if (!videoRef.current) {
        const error = new Error('Camera preview is not ready.');
        error.code = 'CAMERA_NO_FRAMES';
        throw error;
      }
      videoRef.current.srcObject = stream;
      const feedVisible = await verifyCameraFeed(videoRef.current);
      if (!feedVisible) {
        const error = new Error('Camera is enabled but no visible image was received.');
        error.code = 'CAMERA_NO_FRAMES';
        throw error;
      }

      attachTrackWatchers(stream);

      setCameraOn(true);
      const micActive = !!audioTrack && audioTrack.readyState === 'live';
      setMicOn(micActive);
      if (micActive) startAudioMeter(stream);
      setPhase('ready');
    } catch (err) {
      let msg = 'Camera/microphone access denied.';
      if (err?.code === 'CAMERA_NO_FRAMES') {
        msg = 'Camera permission was granted, but no visible image was received. Close Zoom, Telegram, FaceTime or other camera apps; remove the camera cover; increase the room light; check the selected camera in browser settings; then try again.';
      } else if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        msg = 'Camera and microphone access was denied. Allow it in your browser settings.';
      } else if (err && err.name === 'NotFoundError') {
        msg = 'Camera or microphone not found. Check that your device is connected.';
      } else if (err && err.name === 'NotReadableError') {
        msg = 'Camera is in use by another app. Close other applications.';
      }
      stream?.getTracks?.().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (videoRef.current?.srcObject === stream) videoRef.current.srcObject = null;
      stopAudioMeter();
      setPermissionError(msg);
      setCameraOn(false);
      setMicOn(false);
      setPhase('idle');
    }
  }, [attachTrackWatchers, startAudioMeter, stopAudioMeter]);

  /* ── Ekran ulashish (faqat butun ekran) ─────────────────── */
  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    setScreenOn(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor', frameRate: { ideal: 12 } },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const surface = track.getSettings?.().displaySurface;

      // Faqat butun ekran — tab yoki bitta oyna bo'lsa rad etamiz.
      if (surface && surface !== 'monitor') {
        stream.getTracks().forEach((t) => t.stop());
        setPermissionError('Please select "Entire Screen" — not a single tab or window.');
        return false;
      }

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current.play?.().catch(() => {});
      }
      setScreenOn(true);

      // Student ulashishni to'xtatsa — warning.
      track.addEventListener('ended', () => {
        screenStreamRef.current = null;
        setScreenOn(false);
        if (activeRef.current) {
          logEvent('screen_share_stopped', 'Screen sharing stopped', 'warning');
          captureSnapshot('Screen sharing stopped', { silent: true });
        }
      });
      return true;
    } catch {
      setPermissionError('Screen sharing was denied. Sharing your entire screen is required for the exam.');
      return false;
    }
  }, [logEvent, captureSnapshot]);

  /* ── Metrica tabini ochish (to'g'ridan-to'g'ri user gesture'da) ─
     Muhim: window.open ni 'noopener'siz va SYNXRON (await'siz) chaqiramiz,
     aks holda brauzer popup-blocker uni bloklaydi. */
  const openExamTab = useCallback(() => {
    const win = window.open(METRICA_EXAM_URL, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setExamBlocked(true);
      logEvent('exam_open_blocked', 'Browser blocked the Metrica tab — needs manual opening', 'warning');
      return false;
    }
    examTabRef.current = win;
    setExamBlocked(false);
    setExamOpened(true);
    logEvent('exam_opened', 'Metrica exam page opened', 'info');
    return true;
  }, [logEvent]);

  /* ── Sessiyani boshlash ─────────────────────────────────── */
  const startExam = useCallback(async () => {
    if (!cameraOn) return;

    // Enable'dan keyin kamera qora/stalled bo'lib qolgan bo'lsa session va
    // screen-share'ni boshlamaymiz. Student kamerani qayta ulashi kerak.
    // Sinxron tekshiruv: getDisplayMedia uchun click user-gesture saqlanib qoladi.
    const feedStillVisible = cameraFrameIsVisible(videoRef.current);
    if (!feedStillVisible) {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      stopAudioMeter();
      setCameraOn(false);
      setMicOn(false);
      setPhase('idle');
      setPermissionError('The camera stopped producing a visible image. Close other camera apps, check the camera cover and room lighting, then enable the camera again.');
      return;
    }

    // Butun ekranni ulashtiramiz (bu getDisplayMedia — click gesture'ni talab qiladi).
    // window.open ni shu yerda chaqirmaymiz: bitta bosishda ikkala gesture ishlamaydi,
    // shuning uchun Metrica tabi active ekrandagi alohida tugma bilan ochiladi.
    const shared = await startScreenShare();
    if (!shared) return;

    let sid = null;
    try {
      const res = await api.proctorStartSession({
        fullName: fullName.trim(),
        passportId: passportId.trim(),
        examUrl: PROCTORING_APP_URL,
      });
      sid = res?.session_id || res?.id || res?.data?.session_id || null;
      if (!sid) throw new Error('Proctoring API did not return session_id.');
    } catch (error) {
      stopScreenShare();
      setPermissionError(`Could not start proctoring: ${getProctoringApiErrorMessage(error)}`);
      return;
    }
    sessionIdRef.current = sid;
    setSessionId(sid);
    try { sessionStorage.setItem('proctoring_session_id', sid); } catch { /* unavailable */ }

    activeRef.current = true;
    startedAtRef.current = Date.now();
    setPhase('active');
    logEvent('session_started', 'Session started', 'info');

    // Boshlanishida bitta snapshot (jim).
    setTimeout(() => captureSnapshot('Session start', { silent: true }), 1200);
  }, [cameraOn, fullName, passportId, logEvent, startScreenShare, stopScreenShare, captureSnapshot, stopAudioMeter]);

  /* ── Fon monitoring (tab / fullscreen / kamera) ─────────── */
  useEffect(() => {
    if (phase !== 'active') return;

    const GRACE_MS = 2500;
    let lastSwitchCapture = 0; // blur va visibility juft ishlaganda dublikat bo'lmasligi uchun

    // Shubhali o'tish — snapshot + qisqa ekran zapisi (cooldown bilan).
    const flagSwitch = (type, message) => {
      const t = Date.now();
      if (t - lastSwitchCapture < 1500) return; // cooldown
      lastSwitchCapture = t;
      flagCheating(type, message);
    };

    const onVisibility = () => {
      if (!activeRef.current) return;
      if (Date.now() - startedAtRef.current < GRACE_MS) return;
      if (document.hidden) {
        flagSwitch('tab_switch', 'Switched to another tab / window hidden');
      } else {
        logEvent('tab_return', 'Returned to MEPT page', 'info');
        captureSnapshot('Tab returned', { silent: true });
      }
    };

    // Butun brauzer fokusni yo'qotsa (boshqa ilova / ikkinchi monitor / alt-tab).
    const onBlur = () => {
      if (!activeRef.current) return;
      if (Date.now() - startedAtRef.current < GRACE_MS) return;
      flagSwitch('window_blur', 'Switched to another window / app / screen');
    };

    const onFullscreenChange = () => {
      if (!activeRef.current) return;
      if (Date.now() - startedAtRef.current < GRACE_MS) return;
      if (!document.fullscreenElement) {
        flagSwitch('fullscreen_exit', 'Exited fullscreen mode');
      } else {
        logEvent('fullscreen_enter', 'Returned to fullscreen mode', 'info');
      }
    };

    const camInterval = setInterval(() => {
      const track = streamRef.current?.getVideoTracks?.()[0];
      const live = !!track && track.readyState === 'live' && track.enabled;
      setCameraOn((prev) => {
        if (prev && !live) logEvent('camera_disconnected', 'Camera signal lost', 'warning');
        return live;
      });
    }, 3000);

    // Metrica imtihon tabi yopilganini kuzatamiz (boshqa sahifaga o'tish / yopish belgisi).
    let examTabWasOpen = false;
    const tabInterval = setInterval(() => {
      const win = examTabRef.current;
      if (win && !win.closed) examTabWasOpen = true;
      if (examTabWasOpen && win && win.closed) {
        examTabWasOpen = false;
        examTabRef.current = null;
        setExamOpened(false);
        flagCheating('exam_tab_closed', 'Metrica exam tab closed / left');
      }
    }, 2000);

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('blur', onBlur);
      clearInterval(camInterval);
      clearInterval(tabInterval);
    };
  }, [phase, logEvent, captureSnapshot, flagCheating]);

  /* ── Davriy snapshot — Web Worker timer bilan ────────────────
     Muhim: MEPT tabi background'da (student Metrica tabida) bo'lganда brauzer
     oddiy setInterval'ni ~1 daqiqagacha sekinlashtiradi. Worker timer esa
     throttle qilinmaydi — shuning uchun boshqa tabga o'tganda ham snapshot olinadi. */
  useEffect(() => {
    if (phase !== 'active') return;

    const workerCode = `let id; onmessage = (e) => {
      if (e.data && e.data.type === 'start') { clearInterval(id); id = setInterval(() => postMessage('tick'), e.data.interval); }
      else if (e.data && e.data.type === 'stop') { clearInterval(id); }
    };`;
    // Davriy kadr Activity log'ga ham tushadi; vision uchun oxirgi 30 tasi yetarli.
    const takePeriodic = () => {
      if (!activeRef.current) return;
      const img = captureSnapshot('Periodic snapshot', { silent: true });
      if (img) {
        framesRef.current = [...framesRef.current, { time: new Date().toISOString(), image: img }].slice(-30);
        setFrameTick((t) => t + 1); // IndexedDB'ga saqlashni trigger qiladi
      }
    };

    let worker = null;
    let fallback = null;
    try {
      const url = URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = takePeriodic;
      worker.postMessage({ type: 'start', interval: SNAPSHOT_INTERVAL_MS });
    } catch {
      // Worker bo'lmasa — oddiy interval (background'da sekin bo'lishi mumkin)
      fallback = setInterval(takePeriodic, SNAPSHOT_INTERVAL_MS);
    }

    return () => {
      if (worker) { try { worker.postMessage({ type: 'stop' }); worker.terminate(); } catch { /* ignore */ } }
      if (fallback) clearInterval(fallback);
    };
  }, [phase, captureSnapshot]);

  /* ── Uzluksiz segment-recorder — active + ekran ulashilganda ─
     Recorder fon rejimida BOSHLANMAYDI (ekran-share foreground'da yoqilgan
     paytda ishga tushadi), shuning uchun student boshqa tabga o'tsa ham
     yozib turadi va o'sha segment klip bo'lib chiqadi. */
  useEffect(() => {
    if (phase !== 'active' || !screenOn) return;
    startSegmentLoop();
    return () => stopSegmentLoop();
  }, [phase, screenOn, startSegmentLoop, stopSegmentLoop]);

  /* ── Yig'ilgan activity logni localStorage'ga saqlash ──────
     Backend bo'lmasa ham ProctorMonitor shu logni o'qib AI bilan tahlil qiladi.
     Faqat matn qismini saqlaymiz (rasm/klip emas — localStorage limiti uchun). */
  useEffect(() => {
    if (!sessionId) return;
    try {
      const compact = events.map((e) => ({
        id: e.id || null,
        type: e.type,
        message: e.message,
        severity: e.severity,
        time: e.time instanceof Date ? e.time.toISOString() : (e.time || ''),
      }));
      const record = {
        meta: {
          session_id: sessionId,
          full_name: fullName,
          passport_id: passportId,
          status: phase,
          warnings,
        },
        events: compact,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(`proctor_session_${sessionId}`, JSON.stringify(record));
      const idxRaw = localStorage.getItem('proctor_session_ids');
      const idx = idxRaw ? JSON.parse(idxRaw) : [];
      if (!idx.includes(sessionId)) {
        idx.push(sessionId);
        localStorage.setItem('proctor_session_ids', JSON.stringify(idx));
      }
    } catch { /* localStorage to'la yoki mavjud emas */ }
  }, [events, sessionId, phase, warnings, fullName, passportId]);

  /* ── Media (skreenshot + klip) IndexedDB'ga saqlash (debounce) ──
     localStorage'ga rasm/video sig'maydi; IndexedDB yuzlab MB ko'taradi.
     ProctorMonitor shu yerdan media bilan activity logni o'qiydi. */
  useEffect(() => {
    if (!sessionId) return;
    const t = setTimeout(() => {
      const fullEvents = events.map((e) => ({
        id: e.id || null,
        type: e.type,
        message: e.message,
        severity: e.severity,
        time: e.time instanceof Date ? e.time.toISOString() : (e.time || ''),
        image: e.image || null,       // skreenshot (base64 dataURL)
        clipBlob: e.clipBlob || null, // ekran video-klip (Blob)
      }));
      const meta = {
        session_id: sessionId,
        full_name: fullName,
        passport_id: passportId,
        status: phase,
        warnings,
      };
      // frames — davriy ekran kadrlari (vision tab-check uchun); boshqa tab shu yerda ko'rinadi
      saveLocalSession(sessionId, { meta, events: fullEvents, frames: framesRef.current });
    }, 1200); // yozishni birlashtiramiz (spam bo'lmasin)
    return () => clearTimeout(t);
  }, [events, sessionId, phase, warnings, fullName, passportId, frameTick]);

  /* ── MediaPipe AI (qo'l + yuz/gaze) — faqat active fazada ── */
  useEffect(() => {
    if (phase !== 'active') return;

    // Gaze kalibratsiyasini yangidan boshlaymiz (shaxsiy markaz)
    gazeEmaRef.current = { h: 0, v: 0, init: false };
    baselineRef.current = { h: 0, v: 0, n: 0, ready: false };
    glanceHistoryRef.current = [];
    awayCountRef.current = 0;
    noFaceStartRef.current = 0;
    noFaceFlaggedRef.current = false;
    setCalibrating(true);
    setCalibProgress(0);

    let cancelled = false;
    let landmarker = null;    // HandLandmarker
    let faceLandmarker = null;
    let raf = null;
    let lastVideoTime = -1;
    let lastDetect = 0;
    let tick = 0;
    const DETECT_INTERVAL = 80; // ms → ~12 fps (60fps o'rniga — thread bo'g'ilmaydi)
    const MP_VER = '0.10.12';

    const createHand = async (vision, resolver, delegate) =>
      vision.HandLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate,
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });

    const createFace = async (vision, resolver, delegate) =>
      vision.FaceLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate,
        },
        runningMode: 'VIDEO',
        numFaces: 2, // 2-inson yuzini ham aniqlash uchun
        outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: true, // ko'z yo'nalishi (eyeLookIn/Out/Down) uchun
      });

    const loop = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const t = performance.now();
      // ~12 fps'ga cheklaymiz — 60fps'da ikki modelni ishlatish thread'ni qotiradi
      if (video && video.readyState >= 2 && t - lastDetect >= DETECT_INTERVAL && video.currentTime !== lastVideoTime) {
        lastDetect = t;
        lastVideoTime = video.currentTime;
        tick++;
        // Yuz — har tick (gaze/kalibratsiya uchun muhim)
        try { if (faceLandmarker) handleFaceResults(faceLandmarker.detectForVideo(video, t)); } catch { /* skip frame */ }
        // Qo'l — har 2-tick (~6 fps yetarli, yuk yarmiga tushadi)
        if (tick % 2 === 0) {
          try { if (landmarker) handleHandResults(landmarker.detectForVideo(video, t + 1)); } catch { /* skip frame */ }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const setup = async () => {
      setHandStatus('loading');
      try {
        const vision = await import(/* @vite-ignore */ `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`);
        const resolver = await vision.FilesetResolver.forVisionTasks(
          `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`
        );
        // Ikkala modelni PARALLEL yuklaymiz (ketma-ket emas — 2 barobar tez)
        const [handRes, faceRes] = await Promise.allSettled([
          createHand(vision, resolver, 'GPU'),
          createFace(vision, resolver, 'GPU'),
        ]);
        landmarker = handRes.status === 'fulfilled'
          ? handRes.value
          : await createHand(vision, resolver, 'CPU').catch(() => null);
        faceLandmarker = faceRes.status === 'fulfilled'
          ? faceRes.value
          : await createFace(vision, resolver, 'CPU').catch(() => null);
        if (cancelled) { landmarker?.close?.(); faceLandmarker?.close?.(); return; }
        // Yuz modeli yuklanmasa — kalibratsiyasiz davom etamiz (imtihon bloklanmasin)
        if (!faceLandmarker) { setCalibrating(false); }
        setHandStatus('ready');
        logEvent('monitoring_ready', 'Monitoring checks enabled', 'info');
        loop();
      } catch {
        if (!cancelled) { setHandStatus('error'); setCalibrating(false); }
      }
    };

    setup();
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      landmarker?.close?.();
      faceLandmarker?.close?.();
      setHandStatus('off');
      setHandVisible(false);
      setGazeAway(false);
      setCalibrating(false);
      setFaceCount(0);
      handRaisedRef.current = false;
      awayActiveRef.current = false;
      awayDirectionRef.current = 'unknown';
      glanceHistoryRef.current = [];
      noFaceStartRef.current = 0;
      noFaceFlaggedRef.current = false;
      multiFaceStartRef.current = 0;
    };
  }, [phase, handleHandResults, handleFaceResults, logEvent]);

  /* ── Cleanup ────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      stopAudioMeter();
      stopSegmentLoop();
      if (!mediaHandedOffRef.current) {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
        screenStreamRef.current?.getTracks?.().forEach((t) => t.stop());
      }
    };
  }, [stopAudioMeter, stopSegmentLoop]);

  /* ── Imtihonni tugatish ─────────────────────────────────── */
  const finishExam = useCallback(async () => {
    // Finish violationdan darhol keyin bosilsa ham oxirgi video kamida 8s bo'lsin.
    // Oddiy finishda pending klip bo'lmagani uchun kutish bo'lmaydi.
    if (pendingClipsRef.current.length && segRecorderRef.current?.state === 'recording') {
      const elapsed = Date.now() - segStartedAtRef.current;
      const remaining = Math.max(0, MIN_CLIP_MS - elapsed);
      if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    activeRef.current = false;
    // Pending violation segmentini avval final Blob'ga aylantiramiz va uploadini
    // kutamiz. Aks holda session /finish klipdan oldin borib, oxirgi video yo'qolardi.
    await stopSegmentLoop();
    // Event va media requestlari tugamasdan /finish yuborilmaydi.
    while (pendingApiRequestsRef.current.size) {
      await Promise.allSettled([...pendingApiRequestsRef.current]);
    }
    const sid = sessionIdRef.current;
    if (sid) {
      try { await api.proctorFinishSession(sid, { warnings: warningsRef.current }); }
      catch { /* backend bo'lmasa jim o'tkazamiz */ }
    }
    try { sessionStorage.removeItem('proctoring_session_id'); } catch { /* unavailable */ }
    eventMetaRef.current.clear();
    stopAudioMeter();
    // Kamera va Entire Screen streamlarini to'xtatmaymiz: Writing shu tracklarni
    // qayta permission so'ramasdan qabul qiladi.
    handoffProctorMedia({
      cameraStream: streamRef.current,
      screenStream: screenStreamRef.current,
    });
    mediaHandedOffRef.current = true;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    screenStreamRef.current = null;
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setCameraOn(false);
    setMicOn(false);
    setPhase('finished');
    const writingCandidate = { fullName: fullName.trim(), passportId: passportId.trim() };
    try { sessionStorage.setItem('writing_candidate', JSON.stringify(writingCandidate)); } catch { /* unavailable */ }
    navigate('/writing-test', { replace: true, state: writingCandidate });
  }, [fullName, navigate, passportId, stopAudioMeter, stopSegmentLoop]);

  const examLabel =
    phase === 'active' ? 'In progress' :
    phase === 'finished' ? 'Completed' :
    phase === 'ready' ? 'Ready' : 'Not started';

  // Kamera/mikrofon permissioni faqat student qoidalarni o'qib tasdiqlagandan
  // keyin so'raladi. Refresh yoki yangi kirishda qoidalar yana ko'rsatiladi.
  if (!rulesAccepted) {
    return (
      <div className="px-root px-rules-root">
        <style>{CSS}</style>
        <div className="px-bg" aria-hidden>
          <span className="px-blob px-blob-1" />
          <span className="px-blob px-blob-2" />
          <span className="px-grid" />
        </div>

        <header className="px-header px-rules-header">
          <button className="px-back" onClick={() => navigate('/')}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          <div className="px-brand">
            <img className="px-brand-logo" src={websterLogo} alt="Webster" />
            <div className="px-brand-text">
              <span className="px-brand-name">Webster · MEPT</span>
              <span className="px-brand-sub">Exam rules and monitoring consent</span>
            </div>
          </div>
          <span className="px-rules-step">Step 1 of 3</span>
        </header>

        <main className="px-rules-page">
          <section className="px-rules-card" aria-labelledby="exam-rules-title">
            <div className="px-rules-intro">
              <span className="px-rules-lock" aria-hidden>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 10.5h10.5A2.25 2.25 0 0019.5 18.75v-6A2.25 2.25 0 0017.25 10.5H6.75A2.25 2.25 0 004.5 12.75v6A2.25 2.25 0 006.75 21z" />
                </svg>
              </span>
              <div>
                <p className="px-rules-kicker">Read before enabling your camera</p>
                <h1 id="exam-rules-title">Important exam rules</h1>
                <p>Your camera, microphone and screen sharing will start only after you accept these rules.</p>
              </div>
            </div>

            <div className="px-rules-list">
              <article className="px-rule-item is-danger">
                <span className="px-rule-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <rect x="8" y="8" width="11" height="11" rx="2" />
                    <path d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
                    <path className="px-rule-icon-slash" d="M4 4l16 16" />
                  </svg>
                </span>
                <div>
                  <h2>Do not copy or use outside help</h2>
                  <p>Copying, pasting, taking photos, using notes, a phone, another device, search engines, AI tools, messengers or help from another person is prohibited.</p>
                </div>
              </article>

              <article className="px-rule-item">
                <span className="px-rule-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <rect x="3" y="4" width="18" height="13" rx="2" />
                    <path d="M8 21h8M12 17v4M6 8V7h2M16 7h2v1M6 13v1h2M16 14h2v-1" />
                  </svg>
                </span>
                <div>
                  <h2>Keep your entire screen shared</h2>
                  <p>Select <b>Entire Screen</b>, not a tab or window. Do not stop, hide, pause or change screen sharing until the test is completed.</p>
                </div>
              </article>

              <article className="px-rule-item">
                <span className="px-rule-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 8h18M7 6h.01M10 6h.01M9 12l6 6M15 12l-6 6" />
                  </svg>
                </span>
                <div>
                  <h2>Stay on the authorized exam page</h2>
                  <p>Do not open or switch to another tab, application, window, website or desktop. Use only the Metrica exam page provided by the test.</p>
                </div>
              </article>

              <article className="px-rule-item">
                <span className="px-rule-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                    <circle cx="12" cy="12" r="2.75" />
                    <path className="px-rule-icon-pupil" d="M12 10.6v2.8" />
                  </svg>
                </span>
                <div>
                  <h2>Face the screen and remain visible</h2>
                  <p>Keep your face clearly visible and look at the screen. Repeated or sustained looking away, hiding your face, leaving the camera, or another person appearing may be flagged.</p>
                </div>
              </article>

              <article className="px-rule-item">
                <span className="px-rule-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <path d="M12 2.75l7 2.7v5.4c0 4.45-2.8 8.48-7 10.4-4.2-1.92-7-5.95-7-10.4v-5.4l7-2.7z" />
                    <path className="px-rule-icon-check" d="M8.7 12l2.15 2.15 4.55-4.55" />
                  </svg>
                </span>
                <div>
                  <h2>Do not disable monitoring</h2>
                  <p>Your camera and microphone must remain on. Disconnecting the camera, microphone or screen sharing is recorded as a violation.</p>
                </div>
              </article>
            </div>

            <div className="px-rules-warning" role="note">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.949 3.374H4.646c-1.732 0-2.815-1.874-1.949-3.374L10.05 3.374c.866-1.5 3.034-1.5 3.9 0l7.353 12.752zM12 15.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <strong>Important consequence</strong>
                <p>The system records screenshots, video evidence, tab changes and monitoring interruptions. If copying or unauthorized assistance is detected or reasonably suspected, your session may be marked as <b>cheating</b>, sent for review, and your test results may be <b>invalidated</b>.</p>
              </div>
            </div>

            <label className={`px-rules-consent ${rulesConfirmed ? 'is-checked' : ''}`}>
              <input
                type="checkbox"
                checked={rulesConfirmed}
                onChange={(event) => setRulesConfirmed(event.target.checked)}
              />
              <span className="px-rules-checkbox" aria-hidden>
                {rulesConfirmed && (
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span>I have read and understood all rules. I agree to follow them and consent to proctoring during the exam.</span>
            </label>

            <button
              type="button"
              className="px-btn px-btn-primary px-rules-continue"
              disabled={!rulesConfirmed}
              onClick={() => setRulesAccepted(true)}
            >
              <span className="px-btn-glow" />
              I understand — Continue to camera setup
            </button>
            <p className="px-rules-footnote">Next: enter your details, enable camera and microphone, then share your entire screen.</p>
          </section>
        </main>
      </div>
    );
  }

  /* ── UI ─────────────────────────────────────────────────── */
  return (
    <div className="px-root">
      <style>{CSS}</style>

      {/* Ekran snapshot manbai — display:none EMAS (background tabda kadr berishi uchun off-screen) */}
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'fixed', left: -20, top: -20, width: 2, height: 2, opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}
      />


      {/* ambient background */}
      <div className="px-bg" aria-hidden>
        <span className="px-blob px-blob-1" />
        <span className="px-blob px-blob-2" />
        <span className="px-grid" />
      </div>

      {/* Header */}
      <header className="px-header">
        <button className="px-back" onClick={() => navigate('/')}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        <div className="px-brand">
          <img className="px-brand-logo" src={websterLogo} alt="Webster" />
          <div className="px-brand-text">
            <span className="px-brand-name">Webster · MEPT</span>
            <span className="px-brand-sub">Cambridge Metrica · Proctoring</span>
          </div>
        </div>

        <div className="px-clock">
          <span className="px-clock-dot" />
          <span>{fmtClock(now)}</span>
        </div>
      </header>

      <main className="px-main">
        <div className="px-grid-layout">
          {/* ── Left column ── */}
          <div className="px-col">
            {/* Camera panel */}
            <section className={`px-card px-camera ${phase === 'active' && cameraOn ? 'is-live' : ''}`}>
              <div className="px-card-head">
                <span className="px-eyebrow">Live camera</span>
                <StatusPill on={cameraOn} labelOn="Connected" labelOff="Disconnected" />
              </div>

              <div className="px-video-wrap">
                <video ref={videoRef} autoPlay playsInline muted className="px-video" />

                {/* scanner brackets */}
                <span className="px-bracket tl" /><span className="px-bracket tr" />
                <span className="px-bracket bl" /><span className="px-bracket br" />

                {phase === 'active' && cameraOn && <span className="px-scanline" />}

                {phase === 'active' && cameraOn && (
                  <div className="px-rec">
                    <span className="px-rec-dot" /> MONITORING
                  </div>
                )}

                {/* Detektsiya natijalari (gaze/qo'l/2-yuz/REC) student'ga ko'rsatilmaydi —
                    ular /proctoring/monitor sahifasida ko'rinadi. Faqat kalibratsiya
                    yo'riqnomasi (setup uchun) qoladi. */}
                {phase === 'active' && handStatus === 'ready' && calibrating && (
                  <div className="px-gaze is-cal">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Calibrating — look at the screen
                  </div>
                )}

                {!cameraOn && (
                  <div className="px-video-empty">
                    <svg width="46" height="46" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <p>{phase === 'finished' ? 'Camera stopped' : 'Camera off'}</p>
                  </div>
                )}
              </div>

              {/* Mikrofon — jonli ovoz darajasi (voice detection) */}
              <div className="px-mic">
                <div className={`px-mic-icon ${voiceDetected ? 'is-active' : ''}`}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="px-mic-body">
                  <div className="px-mic-meta">
                    <span className="px-mic-label">Microphone</span>
                    <span className={`px-mic-state ${!micOn ? 'is-off' : voiceDetected ? 'is-voice' : ''}`}>
                      {!micOn ? 'Off' : voiceDetected ? 'Voice detected' : 'Listening…'}
                    </span>
                  </div>
                  <div className="px-meter">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const filled = micOn && audioLevel >= (i + 1) * 5;
                      return <span key={i} className={`px-meter-seg ${filled ? 'is-on' : ''}`} style={{ '--i': i }} />;
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Permission error */}
            {permissionError && (
              <div className="px-alert">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{permissionError}</span>
              </div>
            )}

            {/* Pre-exam */}
            {phase !== 'active' && phase !== 'finished' && (
              <section className="px-card px-form">
                <span className="px-eyebrow">Candidate details</span>
                <div className="px-fields">
                  <div className="px-field">
                    <label>Full name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div className="px-field">
                    <label>Passport serial &amp; number</label>
                    <input value={passportId} onChange={(e) => setPassportId(e.target.value)} placeholder="e.g. AD7113185" />
                  </div>
                </div>

                {phase === 'ready' ? (
                  <>
                    <div className="px-ready">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Camera and microphone are ready. When you press Start, you'll be asked to <b>share your entire screen</b> (required), then open the exam with the <b>Open Metrica Exam</b> button on the next screen.</span>
                    </div>
                    <button className="px-btn px-btn-primary" onClick={startExam}>
                      <span className="px-btn-glow" />
                      Start Exam
                    </button>
                  </>
                ) : (
                  <button
                    className={`px-btn px-btn-primary ${phase === 'checking' ? 'is-loading' : ''}`}
                    onClick={checkDevices}
                    disabled={phase === 'checking'}
                  >
                    <span className="px-btn-glow" />
                    {phase === 'checking' ? 'Checking camera…' : 'Enable camera & microphone'}
                  </button>
                )}
                <p className="px-hint">Camera and microphone must stay on during the exam.</p>
              </section>
            )}

            {/* Active controls */}
            {phase === 'active' && (
              <section className="px-card px-active">
                {!examOpened ? (
                  <div className="px-open-prompt">
                    <p className="px-open-title">Click the button to open the exam</p>
                    <p className="px-open-sub">
                      Monitoring is active. Now open the Metrica exam page in a new tab.
                    </p>
                  </div>
                ) : (
                  <div className="px-active-note">
                    <span className="px-live-dot" />
                    <span>Monitoring is in progress. Take the exam in the Metrica tab, then come back here and press <b>Finish Exam</b>.</span>
                  </div>
                )}

                {examBlocked && (
                  <div className="px-alert" style={{ marginBottom: 14 }}>
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>The browser blocked the new tab. Please click the button below (or allow popups in your browser).</span>
                  </div>
                )}

                <div className="px-active-actions">
                  <button
                    className={examOpened ? 'px-btn px-btn-ghost' : 'px-btn px-btn-primary'}
                    onClick={openExamTab}
                  >
                    {!examOpened && <span className="px-btn-glow" />}
                    {examOpened ? 'Reopen Exam Tab' : 'Open Metrica Exam'}
                  </button>
                  <button className="px-btn px-btn-danger" onClick={() => setConfirmFinish(true)}>
                    Finish Exam
                  </button>
                </div>
              </section>
            )}

            {/* Finished */}
            {phase === 'finished' && (
              <section className="px-card px-finished">
                <div className="px-finished-icon">
                  <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3>Session closed</h3>
                <p>All logs have been saved. Total warnings: <b>{warnings}</b></p>
                <p className="px-sid">Session ID: {sessionId}</p>
                <button className="px-btn px-btn-primary" onClick={() => navigate('/')}>
                  <span className="px-btn-glow" />
                  Back to Home
                </button>
              </section>
            )}
          </div>

          {/* ── Right column: student uchun faqat qisqa yo'riqnoma ──
               Session status va Activity log student'ga KO'RSATILMAYDI —
               ular /proctoring/monitor (proctor) sahifasida ko'rinadi. */}
          <aside className="px-col px-side">
            <section className="px-card">
              <span className="px-eyebrow">Instructions</span>
              <ul className="px-info-list">
                <li>Camera and microphone must stay on during the exam.</li>
                <li>Your entire screen must be shared.</li>
                <li>Work only on the Metrica exam page — do not open other tabs/apps.</li>
                <li>Sit facing the screen; no one else should be next to you.</li>
                <li>When finished, return to this page and press <b>Finish Exam</b>.</li>
              </ul>
            </section>

            <section className="px-card px-privnote">
              <div className="px-shield">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <p>This session is monitored. All monitoring data is stored securely.</p>
            </section>
          </aside>
        </div>
      </main>

      {/* Ekran ulashish to'xtaganda — bloklovchi oyna (majburiy) */}
      {phase === 'active' && !screenOn && (
        <div className="px-modal-overlay">
          <div className="px-modal" style={{ maxWidth: 460 }}>
            <div className="px-modal-icon">
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3>Screen sharing stopped</h3>
            <p>
              You must share <b>your entire screen</b> for exam monitoring.
              Re-share your screen to continue.
            </p>
            <div className="px-modal-actions">
              <button className="px-btn px-btn-primary" onClick={startScreenShare}>
                <span className="px-btn-glow" />
                Re-share screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ko'z kalibratsiyasi — markazda, tasdiqlanmaguncha bloklaydi */}
      {phase === 'active' && screenOn && calibrating && handStatus !== 'error' && (
        <div className="px-cal-overlay">
          <div className="px-cal-target">
            <span className="px-cal-ring" />
            <span className="px-cal-dot" />
          </div>
          <div className="px-cal-card">
            {handStatus !== 'ready' ? (
              <>
                <div className="px-cal-spinner" />
                <h3>Preparing monitoring…</h3>
                <p>Preparing the security check, please wait a moment.</p>
              </>
            ) : (
              <>
                <h3>Eye check</h3>
                <p>Please look straight at the <b>dot in the center</b>.</p>
                {faceCount === 0 && (
                  <p className="px-cal-warn">Your face is not visible — look straight at the camera</p>
                )}
                <div className="px-cal-bar"><span style={{ width: `${calibProgress}%` }} /></div>
                <p className="px-cal-pct">{calibProgress}%</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Finish confirm modal */}
      {confirmFinish && (
        <div className="px-modal-overlay" onClick={() => setConfirmFinish(false)}>
          <div className="px-modal" onClick={(e) => e.stopPropagation()}>
            <div className="px-modal-icon">
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Finish Exam?</h3>
            <p>Make sure you have fully submitted the Metrica exam. Once you press Finish, monitoring stops and the session closes.</p>
            <div className="px-modal-actions">
              <button className="px-btn px-btn-ghost" onClick={() => setConfirmFinish(false)}>Keep Monitoring</button>
              <button className="px-btn px-btn-danger" onClick={() => { setConfirmFinish(false); finishExam(); }}>Finish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── UI helpers ───────────────────────────────────────────── */
const StatusPill = ({ on, labelOn, labelOff }) => (
  <span className={`px-pill ${on ? 'is-on' : ''}`}>
    <span className="px-pill-dot" />
    {on ? labelOn : labelOff}
  </span>
);

const ICONS = {
  cam: 'M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25zM15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72',
  mic: 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z',
  exam: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  warn: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  shot: 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z',
  screen: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z',
};

const StatTile = ({ label, value, state, icon, big }) => (
  <div className={`px-tile is-${state} ${big ? 'is-big' : ''}`}>
    <div className="px-tile-icon">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[icon]} />
      </svg>
    </div>
    <div className="px-tile-text">
      <span className="px-tile-label">{label}</span>
      <span className="px-tile-value">{value}</span>
    </div>
  </div>
);

/* ── Styles ───────────────────────────────────────────────── */
const CSS = `
.px-root{position:relative;min-height:100vh;overflow-x:hidden;color:#e8eef7;
  background:radial-gradient(1200px 600px at 15% -10%,#12305c 0%,transparent 55%),
             radial-gradient(1000px 700px at 110% 10%,#0a2547 0%,transparent 50%),
             linear-gradient(160deg,#060d1a 0%,#081428 45%,#060e1d 100%);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
.px-rules-root{position:relative;overflow-x:hidden;}
.px-rules-header{position:relative;z-index:2;}
.px-rules-step{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7dd3fc;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.25);border-radius:999px;padding:6px 10px;white-space:nowrap;}
.px-rules-page{position:relative;z-index:1;width:min(920px,calc(100% - 32px));margin:0 auto;padding:38px 0 70px;}
.px-rules-card{background:linear-gradient(180deg,rgba(16,31,55,.96),rgba(7,18,36,.96));border:1px solid rgba(148,180,221,.18);border-radius:24px;padding:30px;box-shadow:0 34px 90px -45px rgba(0,0,0,.9),0 0 50px -35px rgba(56,189,248,.45);}
.px-rules-intro{display:flex;align-items:flex-start;gap:17px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.09);}
.px-rules-lock{width:54px;height:54px;display:grid;place-items:center;flex-shrink:0;border-radius:16px;color:#7dd3fc;background:linear-gradient(135deg,rgba(14,165,233,.2),rgba(37,99,235,.12));border:1px solid rgba(125,211,252,.3);}
.px-rules-kicker{margin:0 0 5px;color:#7dd3fc;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;}
.px-rules-intro h1{margin:0;color:#fff;font-size:clamp(24px,4vw,34px);line-height:1.12;letter-spacing:-.025em;}
.px-rules-intro p:last-child{margin:8px 0 0;color:#9fb3cf;font-size:14px;line-height:1.5;}
.px-rules-list{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0;}
.px-rule-item{display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.035);}
.px-rule-item:last-child{grid-column:1/-1;}
.px-rule-item.is-danger{border-color:rgba(248,113,113,.25);background:rgba(239,68,68,.065);}
.px-rule-icon{width:36px;height:36px;display:grid;place-items:center;flex-shrink:0;border-radius:11px;color:#93c5fd;background:linear-gradient(145deg,rgba(59,130,246,.18),rgba(14,165,233,.08));border:1px solid rgba(96,165,250,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 18px -12px rgba(56,189,248,.8);transition:transform .28s cubic-bezier(.16,1,.3,1),filter .28s ease;}
.px-rule-icon svg{display:block;width:21px;height:21px;overflow:visible;}
.px-rule-item:hover .px-rule-icon{transform:translateY(-2px) scale(1.06);filter:brightness(1.16);}
.px-rule-item.is-danger .px-rule-icon{color:#fca5a5;background:linear-gradient(145deg,rgba(239,68,68,.2),rgba(244,63,94,.08));border-color:rgba(248,113,113,.32);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 8px 18px -12px rgba(248,113,113,.85);}
.px-rule-icon-slash,.px-rule-icon-check{transition:transform .32s cubic-bezier(.16,1,.3,1);transform-origin:center;}
.px-rule-item:hover .px-rule-icon-slash,.px-rule-item:hover .px-rule-icon-check{transform:scale(1.12);}
.px-rule-icon-pupil{transition:transform .3s cubic-bezier(.16,1,.3,1);transform-origin:center;}
.px-rule-item:hover .px-rule-icon-pupil{transform:translateX(2px);}
.px-rule-item h2{margin:0 0 5px;color:#edf5ff;font-size:14px;line-height:1.3;}
.px-rule-item p{margin:0;color:#9fb3cf;font-size:12.5px;line-height:1.55;}
.px-rule-item b{color:#dbeafe;}
.px-rules-warning{display:flex;align-items:flex-start;gap:13px;margin:0 0 18px;padding:16px 17px;border:1px solid rgba(251,191,36,.32);border-radius:15px;color:#fde68a;background:rgba(245,158,11,.09);}
.px-rules-warning svg{flex-shrink:0;margin-top:1px;}
.px-rules-warning strong{display:block;margin-bottom:4px;color:#fef3c7;font-size:13px;text-transform:uppercase;letter-spacing:.06em;}
.px-rules-warning p{margin:0;color:#e7d8ae;font-size:13px;line-height:1.55;}
.px-rules-warning b{color:#fff3c4;}
.px-rules-consent{display:flex;align-items:flex-start;gap:12px;padding:15px 16px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.035);color:#c6d5e9;font-size:13px;font-weight:650;line-height:1.5;cursor:pointer;transition:.18s ease;}
.px-rules-consent:hover,.px-rules-consent.is-checked{border-color:rgba(52,211,153,.35);background:rgba(16,185,129,.07);}
.px-rules-consent input{position:absolute;opacity:0;pointer-events:none;}
.px-rules-checkbox{width:22px;height:22px;display:grid;place-items:center;flex-shrink:0;margin-top:1px;border:1.5px solid rgba(255,255,255,.25);border-radius:7px;color:#03141e;background:rgba(255,255,255,.04);}
.px-rules-consent.is-checked .px-rules-checkbox{border-color:#34d399;background:#34d399;}
.px-rules-continue{width:100%;margin-top:16px;}
.px-rules-continue:disabled{opacity:.42;cursor:not-allowed;box-shadow:none;filter:saturate(.5);}
.px-rules-footnote{margin:10px 0 0;text-align:center;color:#7187a6;font-size:11.5px;line-height:1.45;}
@media(max-width:700px){.px-rules-header{padding:13px 14px}.px-rules-header .px-brand-sub{display:none}.px-rules-step{font-size:9px;padding:5px 8px}.px-rules-page{width:min(100% - 20px,920px);padding:18px 0 36px}.px-rules-card{padding:19px;border-radius:18px}.px-rules-intro{gap:12px}.px-rules-lock{width:44px;height:44px;border-radius:13px}.px-rules-list{grid-template-columns:1fr}.px-rule-item:last-child{grid-column:auto}.px-rule-item{padding:14px}.px-rules-warning{padding:14px}.px-rules-consent{padding:13px}.px-rules-header .px-back span{display:none}}
@media(prefers-reduced-motion:reduce){.px-rule-icon,.px-rule-icon-slash,.px-rule-icon-check,.px-rule-icon-pupil{transition:none!important}.px-rule-item:hover .px-rule-icon,.px-rule-item:hover .px-rule-icon-slash,.px-rule-item:hover .px-rule-icon-check,.px-rule-item:hover .px-rule-icon-pupil{transform:none}}
.px-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.px-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5;animation:pxFloat 14s ease-in-out infinite;}
.px-blob-1{width:420px;height:420px;top:-120px;left:-80px;background:radial-gradient(circle,#1e5aa8,transparent 70%);}
.px-blob-2{width:520px;height:520px;bottom:-200px;right:-140px;background:radial-gradient(circle,#0e3f7a,transparent 70%);animation-delay:-6s;}
.px-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(120,170,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,255,.05) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(circle at 50% 30%,#000 0%,transparent 75%);}
@keyframes pxFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.08)}}

.px-header{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:16px 22px;background:rgba(8,16,30,.55);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.07);}
.px-back{display:inline-flex;align-items:center;gap:7px;color:#9fb6d6;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);padding:8px 14px;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;transition:.2s;}
.px-back:hover{color:#fff;background:rgba(255,255,255,.09);transform:translateX(-2px);}
.px-brand{display:flex;align-items:center;gap:11px;}
.px-brand-logo{height:40px;width:auto;object-fit:contain;display:block;}
.px-brand-text{display:flex;flex-direction:column;line-height:1.25;}
.px-brand-name{font-weight:800;font-size:15px;color:#fff;}
.px-brand-sub{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7d95b8;}
.px-clock{display:inline-flex;align-items:center;gap:8px;font-variant-numeric:tabular-nums;font-weight:700;color:#cfe0f7;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:8px 14px;border-radius:11px;font-size:14px;}
.px-clock-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 10px #34d399;animation:pxPulse 2s infinite;}

.px-main{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:30px 22px 60px;}
.px-grid-layout{display:grid;grid-template-columns:1fr;gap:22px;}
@media(min-width:1000px){.px-grid-layout{grid-template-columns:1.75fr 1fr;}}
.px-col{display:flex;flex-direction:column;gap:22px;min-width:0;}

.px-card{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:20px;
  box-shadow:0 24px 60px -30px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter:blur(14px);animation:pxRise .5s ease both;}
@keyframes pxRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.px-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.px-eyebrow{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#7d95b8;}

/* pill */
.px-pill{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#8aa0c2;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);padding:5px 12px;border-radius:999px;}
.px-pill-dot{width:8px;height:8px;border-radius:50%;background:#64748b;}
.px-pill.is-on{color:#5ff0b6;background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);}
.px-pill.is-on .px-pill-dot{background:#34d399;box-shadow:0 0 10px #34d399;animation:pxPulse 2s infinite;}

/* camera */
.px-camera.is-live{border-color:rgba(47,122,214,.45);box-shadow:0 0 0 1px rgba(47,122,214,.3),0 0 40px -8px rgba(47,122,214,.5),0 24px 60px -30px rgba(0,0,0,.8);}
.px-video-wrap{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#05080f;border:1px solid rgba(255,255,255,.06);}
.px-video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);}
.px-video-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#4b6180;}
.px-video-empty p{font-size:14px;font-weight:600;}
.px-bracket{position:absolute;width:30px;height:30px;border:2.5px solid rgba(120,180,255,.55);}
.px-bracket.tl{top:12px;left:12px;border-right:0;border-bottom:0;border-top-left-radius:8px;}
.px-bracket.tr{top:12px;right:12px;border-left:0;border-bottom:0;border-top-right-radius:8px;}
.px-bracket.bl{bottom:12px;left:12px;border-right:0;border-top:0;border-bottom-left-radius:8px;}
.px-bracket.br{bottom:12px;right:12px;border-left:0;border-top:0;border-bottom-right-radius:8px;}
.px-scanline{position:absolute;left:0;right:0;height:2px;top:0;background:linear-gradient(90deg,transparent,rgba(120,190,255,.85),transparent);box-shadow:0 0 16px rgba(120,190,255,.8);animation:pxScan 3.2s ease-in-out infinite;}
@keyframes pxScan{0%{top:2%}50%{top:97%}100%{top:2%}}
.px-rec{position:absolute;top:14px;left:14px;display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.1em;color:#fff;background:rgba(185,28,28,.85);padding:6px 12px;border-radius:999px;backdrop-filter:blur(4px);}
.px-recclip{position:absolute;top:14px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.12em;color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c);padding:6px 14px;border-radius:999px;box-shadow:0 0 20px -2px rgba(239,68,68,.9);}
.px-rec-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:pxPulse 1.4s infinite;}
@keyframes pxPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}

/* hand detection badge */
.px-hand{position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#cfe0f7;background:rgba(8,16,30,.6);border:1px solid rgba(255,255,255,.14);padding:6px 11px;border-radius:999px;backdrop-filter:blur(6px);transition:.25s;}
.px-hand.is-visible{color:#0a1830;background:linear-gradient(135deg,#7dd3fc,#38bdf8);border-color:transparent;box-shadow:0 0 18px -2px rgba(56,189,248,.8);}
.px-hand.is-error{color:#fca5a5;border-color:rgba(248,113,113,.3);}

/* gaze badge */
.px-gaze{position:absolute;bottom:14px;left:14px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#a7f3d0;background:rgba(8,16,30,.6);border:1px solid rgba(52,211,153,.35);padding:6px 11px;border-radius:999px;backdrop-filter:blur(6px);transition:.25s;}
.px-gaze.is-away{color:#fff;background:linear-gradient(135deg,#fb7185,#e11d48);border-color:transparent;box-shadow:0 0 18px -2px rgba(225,29,72,.85);}
.px-gaze.is-cal{color:#0a1830;background:linear-gradient(135deg,#fcd34d,#f59e0b);border-color:transparent;}
.px-multiface{position:absolute;bottom:14px;right:14px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.04em;color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c);padding:6px 11px;border-radius:999px;box-shadow:0 0 18px -2px rgba(239,68,68,.9);}
.px-gaze-n{margin-left:2px;padding:1px 6px;border-radius:999px;background:rgba(255,255,255,.2);font-size:10px;}

/* mic meter */
.px-mic{display:flex;align-items:center;gap:13px;margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);}
.px-mic-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:#8aa0c2;background:rgba(255,255,255,.05);transition:.25s;}
.px-mic-icon.is-active{color:#34d399;background:rgba(52,211,153,.16);box-shadow:0 0 16px -2px rgba(52,211,153,.6);}
.px-mic-body{flex:1;min-width:0;}
.px-mic-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.px-mic-label{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7d95b8;}
.px-mic-state{font-size:12.5px;font-weight:700;color:#8aa0c2;}
.px-mic-state.is-voice{color:#5ff0b6;}
.px-mic-state.is-off{color:#f87171;}
.px-meter{display:flex;align-items:center;gap:3px;height:18px;}
.px-meter-seg{flex:1;height:100%;border-radius:2px;background:rgba(255,255,255,.08);transition:background .1s,transform .1s;transform:scaleY(.55);}
.px-meter-seg.is-on{transform:scaleY(1);background:linear-gradient(180deg,#4ade80,#22c55e);}
.px-meter-seg.is-on:nth-child(n+15){background:linear-gradient(180deg,#fbbf24,#f59e0b);}
.px-meter-seg.is-on:nth-child(n+18){background:linear-gradient(180deg,#f87171,#ef4444);}

/* alert */
.px-alert{display:flex;align-items:flex-start;gap:11px;color:#ffc9c9;font-size:13.5px;line-height:1.5;
  background:rgba(220,38,38,.12);border:1px solid rgba(248,113,113,.35);border-radius:14px;padding:13px 15px;}
.px-alert svg{flex-shrink:0;color:#f87171;margin-top:1px;}

/* form */
.px-fields{display:grid;gap:14px;margin:16px 0;}
@media(min-width:560px){.px-fields{grid-template-columns:1fr 1fr;}}
.px-field label{display:block;font-size:13px;font-weight:600;color:#a8bcd8;margin-bottom:7px;}
.px-field input{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);border-radius:13px;
  padding:12px 14px;color:#eef4ff;font-size:14.5px;outline:none;transition:.2s;}
.px-field input::placeholder{color:#5c7397;}
.px-field input:focus{border-color:#2f7ad6;background:rgba(47,122,214,.08);box-shadow:0 0 0 4px rgba(47,122,214,.15);}
.px-ready{display:flex;align-items:flex-start;gap:11px;color:#9df0c8;font-size:13.5px;line-height:1.5;
  background:rgba(16,185,129,.1);border:1px solid rgba(52,211,153,.3);border-radius:14px;padding:13px 15px;margin-bottom:14px;}
.px-ready svg{flex-shrink:0;color:#34d399;margin-top:1px;}
.px-hint{text-align:center;font-size:12px;color:#6f88ac;margin-top:12px;}

/* student info panel */
.px-info-list{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:10px;}
.px-info-list li{position:relative;padding-left:22px;font-size:13.5px;line-height:1.5;color:#c3d4ee;}
.px-info-list li::before{content:"";position:absolute;left:2px;top:7px;width:7px;height:7px;border-radius:50%;background:#2f7ad6;box-shadow:0 0 8px rgba(47,122,214,.8);}
.px-info-list b{color:#fff;}
.px-privnote{display:flex;align-items:center;gap:12px;}
.px-shield{width:40px;height:40px;border-radius:11px;flex-shrink:0;display:grid;place-items:center;color:#34d399;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.28);}
.px-privnote p{font-size:13px;color:#a8bcd8;line-height:1.5;}

/* buttons */
.px-btn{position:relative;overflow:hidden;width:100%;border:0;border-radius:14px;padding:14px 20px;font-size:15px;font-weight:800;
  cursor:pointer;transition:transform .18s,box-shadow .25s,background .2s;letter-spacing:.01em;}
.px-btn:active{transform:scale(.98);}
.px-btn-primary{color:#fff;background:linear-gradient(135deg,#2f7ad6,#024890);box-shadow:0 12px 30px -10px rgba(47,122,214,.7);}
.px-btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 40px -12px rgba(47,122,214,.85);}
.px-btn-primary.is-loading{opacity:.6;cursor:not-allowed;}
.px-btn-glow{position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:pxShine 3.5s ease-in-out infinite;}
@keyframes pxShine{0%{left:-60%}55%,100%{left:130%}}
.px-btn-ghost{color:#bcd0ee;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.14);}
.px-btn-ghost:hover{background:rgba(255,255,255,.1);color:#fff;}
.px-btn-danger{color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 12px 30px -12px rgba(239,68,68,.6);}
.px-btn-danger:hover{transform:translateY(-2px);box-shadow:0 18px 40px -14px rgba(239,68,68,.8);}

/* active */
.px-open-prompt{margin-bottom:16px;}
.px-open-title{font-size:16px;font-weight:800;color:#fff;margin-bottom:5px;}
.px-open-sub{font-size:13.5px;line-height:1.55;color:#a8bcd8;}
.px-active-note{display:flex;align-items:flex-start;gap:11px;font-size:13.5px;line-height:1.55;color:#c3d4ee;margin-bottom:16px;}
.px-active-note b{color:#fff;}
.px-live-dot{width:10px;height:10px;border-radius:50%;background:#34d399;box-shadow:0 0 12px #34d399;margin-top:3px;flex-shrink:0;animation:pxPulse 1.6s infinite;}
.px-active-actions{display:flex;flex-direction:column;gap:11px;}
@media(min-width:560px){.px-active-actions{flex-direction:row;}}

/* finished */
.px-finished{text-align:center;padding:34px 24px;}
.px-finished-icon,.px-modal-icon{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;}
.px-finished-icon{color:#34d399;background:rgba(52,211,153,.14);border:1px solid rgba(52,211,153,.3);}
.px-finished h3{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;}
.px-finished p{font-size:14px;color:#a8bcd8;margin-bottom:4px;}
.px-finished b{color:#fff;}
.px-sid{font-size:12px!important;color:#67809f!important;margin-bottom:22px!important;}
.px-finished .px-btn{max-width:260px;margin:6px auto 0;}

/* status tiles */
.px-status{display:flex;flex-direction:column;gap:14px;}
.px-stat-tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.px-tile{display:flex;align-items:center;gap:12px;padding:14px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);transition:.25s;}
.px-tile.is-big{grid-column:1 / -1;}
.px-tile-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;color:#8aa0c2;background:rgba(255,255,255,.05);}
.px-tile-text{display:flex;flex-direction:column;min-width:0;line-height:1.3;}
.px-tile-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7d95b8;}
.px-tile-value{font-size:15px;font-weight:800;color:#eef4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.px-tile.is-ok{background:rgba(52,211,153,.09);border-color:rgba(52,211,153,.28);}
.px-tile.is-ok .px-tile-icon{color:#34d399;background:rgba(52,211,153,.14);}
.px-tile.is-bad{background:rgba(239,68,68,.09);border-color:rgba(239,68,68,.28);}
.px-tile.is-bad .px-tile-icon{color:#f87171;background:rgba(239,68,68,.14);}
.px-tile.is-bad .px-tile-value{color:#fecaca;}
.px-tile.is-big.is-bad .px-tile-value{font-size:22px;}

/* log */
.px-log-empty{font-size:13.5px;color:#6f88ac;margin-top:12px;}
.px-timeline{list-style:none;margin:14px 0 0;padding:0;max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;}
.px-timeline li{position:relative;display:flex;gap:12px;padding:9px 0 9px 4px;}
.px-tl-dot{width:9px;height:9px;border-radius:50%;background:#3b4c66;margin-top:4px;flex-shrink:0;box-shadow:0 0 0 4px rgba(59,76,102,.15);}
.px-timeline li.is-warn .px-tl-dot{background:#f87171;box-shadow:0 0 0 4px rgba(248,113,113,.18),0 0 10px rgba(248,113,113,.6);}
.px-tl-body{min-width:0;flex:1;}
.px-tl-msg{font-size:13.5px;color:#c3d4ee;line-height:1.4;}
.px-timeline li.is-warn .px-tl-msg{color:#fecaca;font-weight:600;}
.px-tl-shot{display:block;margin-top:7px;width:120px;max-width:100%;border-radius:9px;overflow:hidden;border:1px solid rgba(255,255,255,.14);transition:.2s;}
.px-tl-shot:hover{border-color:rgba(120,190,255,.6);transform:scale(1.03);}
.px-tl-shot img{display:block;width:100%;height:auto;}
.px-tl-clip{display:block;margin-top:7px;width:160px;max-width:100%;border-radius:9px;border:1px solid rgba(120,190,255,.3);background:#000;}
.px-tl-time{font-size:11.5px;color:#67809f;margin-top:4px;font-variant-numeric:tabular-nums;}
.px-timeline::-webkit-scrollbar{width:6px;}
.px-timeline::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:99px;}

/* calibration overlay */
.px-cal-overlay{position:fixed;inset:0;z-index:65;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;padding:24px;background:radial-gradient(circle at 50% 45%,rgba(10,26,52,.92),rgba(4,9,18,.97));backdrop-filter:blur(10px);animation:pxFade .25s ease;}
.px-cal-target{position:relative;width:120px;height:120px;display:grid;place-items:center;}
.px-cal-ring{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(120,190,255,.35);animation:pxCalRing 1.8s ease-out infinite;}
@keyframes pxCalRing{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.15);opacity:0}}
.px-cal-dot{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle,#7dd3fc,#2f7ad6);box-shadow:0 0 26px 4px rgba(56,189,248,.8);animation:pxPulse 1.6s infinite;}
.px-cal-card{text-align:center;max-width:400px;}
.px-cal-card h3{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;}
.px-cal-card p{font-size:14.5px;color:#a8bcd8;line-height:1.55;}
.px-cal-warn{color:#fcd34d!important;font-weight:600;margin-top:8px;}
.px-cal-bar{margin:18px auto 8px;width:260px;max-width:100%;height:8px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;}
.px-cal-bar span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#2f7ad6,#7dd3fc);transition:width .2s ease;}
.px-cal-pct{font-size:13px;font-weight:800;color:#7dd3fc!important;font-variant-numeric:tabular-nums;}
.px-cal-spinner{width:44px;height:44px;margin:0 auto 16px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#3b82f6;animation:pxSpin .8s linear infinite;}
@keyframes pxSpin{to{transform:rotate(360deg)}}

/* modal */
.px-modal-overlay{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:18px;background:rgba(4,9,18,.7);backdrop-filter:blur(6px);animation:pxFade .2s ease;}
@keyframes pxFade{from{opacity:0}to{opacity:1}}
.px-modal{width:100%;max-width:430px;text-align:center;padding:34px 28px;border-radius:22px;
  background:linear-gradient(180deg,#0f1f38,#0a1830);border:1px solid rgba(255,255,255,.1);
  box-shadow:0 40px 90px -30px rgba(0,0,0,.9);animation:pxRise .3s ease both;}
.px-modal-icon{color:#f87171;background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.3);}
.px-modal h3{font-size:22px;font-weight:800;color:#fff;margin-bottom:10px;}
.px-modal p{font-size:14px;color:#a8bcd8;line-height:1.55;margin-bottom:24px;}
.px-modal-actions{display:flex;gap:12px;}
.px-modal-actions .px-btn{flex:1;}
`;

export default ProctoringExam;
