import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { analyzeProctoringSession, analyzeScreens, isAiProctorAvailable } from '../utils/tabProctor';
import { getSession as getLocalSession } from '../utils/proctorStore';

/*
  Proctor (nazoratchi) monitoring sahifasi — /proctoring/monitor
  Session status + Activity log shu yerda ko'rinadi (student UI'sida EMAS).
  Backend'dan (proctorGetSession / proctorListSessions) o'qiydi va davriy yangilaydi.
*/

const fmtTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const fmtSessionDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Backend turli shakl qaytarishi mumkin — himoyalangan o'qish
const pick = (o, keys, def) => {
  for (const k of keys) if (o && o[k] != null) return o[k];
  return def;
};

const normEvent = (e) => ({
  // Backend row `id`si bilan client media `event_id`sini aralashtirmaymiz.
  // Lokal record esa client id'ni `id` maydonida saqlaydi.
  id: e?.event_id != null
    ? e.event_id
    : (typeof e?.id === 'string' && /^(client_|evt_|shot_)/.test(e.id) ? e.id : null),
  // Remote detail response'da `id` server event ID, `event_id` esa frontend link ID.
  // Cheating review API `source_event_id` uchun server ID'ni alohida saqlaymiz.
  serverId: e?.event_id != null
    ? pick(e, ['id'], null)
    : pick(e, ['server_id', 'source_event_id'], null),
  type: pick(e, ['type'], 'event'),
  message: pick(e, ['message', 'msg', 'text'], ''),
  severity: pick(e, ['severity', 'level'], 'info'),
  time: pick(e, ['client_time', 'created_at', 'time', 'timestamp'], null),
  // Browser <img>/<video> original media URL'ni CORSsiz ko'rsata oladi. Canvas
  // tahlili uchun alohida serverless proxy tabProctor ichida qo'llanadi.
  image: pick(e, ['image', 'screenshot', 'screenshot_url', 'image_url'], null),
  clip: pick(e, ['clip', 'clip_url', 'video', 'video_url'], null),
});

const eventKey = (event) => event.id
  ? `id:${event.id}`
  : `fallback:${event.type}|${event.time || ''}|${event.message || ''}`;

const newestFirst = (a, b) => {
  const at = new Date(a.time || 0).getTime();
  const bt = new Date(b.time || 0).getTime();
  return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
};

const screenReviewKey = (sessionId) => `proctor_screen_review_${sessionId}`;

const persistentMediaUrl = (value) => (
  typeof value === 'string' && /^https:\/\//i.test(value) ? value : null
);

const normalizeSavedScreenReview = (response) => {
  const data = response?.data || response || {};
  if (!data || (!data.risk_level && !data.riskLevel)) return null;
  const backendEvents = Array.isArray(data.events) ? data.events : [];
  return {
    riskLevel: pick(data, ['risk_level', 'riskLevel'], 'low'),
    verdict: pick(data, ['verdict'], ''),
    summary: pick(data, ['summary'], ''),
    analyzedCount: Number(pick(data, ['analyzed_count', 'analyzedCount'], 0)) || 0,
    at: pick(data, ['reviewed_at', 'updated_at', 'created_at'], null),
    flagged: backendEvents.map((event) => ({
      index: Number.isInteger(event?.index) ? event.index : null,
      type: pick(event, ['type'], 'off_page'),
      time: pick(event, ['client_time', 'time', 'created_at'], null),
      page: pick(event, ['page'], 'Off-page'),
      reason: pick(event, ['reason', 'message'], ''),
      image: persistentMediaUrl(pick(event, ['image', 'screenshot_url'], null)),
      clip: persistentMediaUrl(pick(event, ['clip', 'video_url'], null)),
      sourceEventId: pick(event, ['source_event_id'], null),
    })),
  };
};

const cheatingEventId = (sessionId, item, index) => {
  const seed = String(item?.sourceEventId || item?.time || index)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(-38);
  return `cheat_${String(sessionId).slice(-12)}_${seed}`.slice(0, 64);
};

const cheatingReviewPayload = (sessionId, review) => ({
  review_id: `tab_check_${sessionId}`,
  source: 'tab_vision',
  risk_level: review.riskLevel || 'low',
  verdict: review.verdict || '',
  summary: review.summary || '',
  analyzed_count: Number(review.analyzedCount) || 0,
  reviewed_at: review.at instanceof Date
    ? review.at.toISOString()
    : (review.at || new Date().toISOString()),
  events: (review.flagged || []).map((item, index) => ({
    event_id: cheatingEventId(sessionId, item, index),
    type: item.type || 'off_page',
    page: item.page || 'unknown',
    reason: item.reason || 'Unauthorized page or application detected.',
    client_time: item.time || null,
    severity: 'warning',
    image: persistentMediaUrl(item.image),
    clip: persistentMediaUrl(item.clip),
    source_event_id: item.sourceEventId || null,
  })),
});

const GAZE_CHEATING_TYPES = new Set([
  'gaze_away',
  'gaze_away_long',
  'gaze_away_count',
  'gaze_away_pattern',
  'gaze_side_to_side',
  'face_turned_away',
  'no_face_long',
  'second_face',
]);

const gazeCheatingFlags = (events) => {
  const seen = new Set();
  return (events || [])
    .filter((event) => GAZE_CHEATING_TYPES.has(String(event?.type || '').toLowerCase()))
    .filter((event) => {
      const key = event.id || `${event.type}|${event.time || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((event) => ({
      index: null,
      type: String(event.type).toLowerCase(),
      time: event.time || null,
      page: event.type === 'second_face'
        ? 'Multiple faces detected'
        : (event.type === 'no_face_long' || event.type === 'face_turned_away'
          ? 'Face visibility violation'
          : 'Eye gaze violation'),
      reason: event.message || 'Student looked away from the screen.',
      image: persistentMediaUrl(event.image),
      clip: persistentMediaUrl(event.clip),
      sourceEventId: event.serverId || null,
    }));
};

const mergeGazeReview = (review, gazeFlags) => {
  if (!gazeFlags.length) return review;
  const visualFlags = Array.isArray(review?.flagged) ? review.flagged : [];
  const severeGaze = gazeFlags.some((item) => (
    item.type !== 'gaze_away'
  )) || gazeFlags.length >= 2;
  const rank = { low: 0, medium: 1, high: 2 };
  const gazeRisk = severeGaze ? 'high' : 'medium';
  const currentRisk = review?.riskLevel || 'low';
  const riskLevel = rank[gazeRisk] > rank[currentRisk] ? gazeRisk : currentRisk;
  const gazeText = severeGaze
    ? 'Repeated or prolonged eye-gaze violations were detected.'
    : 'The student looked away from the screen.';

  return {
    ...(review || {}),
    riskLevel,
    verdict: visualFlags.length
      ? `${review?.verdict || 'Unauthorized page activity was detected.'} ${gazeText}`
      : gazeText,
    summary: visualFlags.length
      ? `${review?.summary || ''} Eye-gaze monitoring also recorded ${gazeFlags.length} cheating event${gazeFlags.length === 1 ? '' : 's'}.`.trim()
      : `Eye-gaze monitoring recorded ${gazeFlags.length} cheating event${gazeFlags.length === 1 ? '' : 's'} during the exam.`,
    flagged: [...visualFlags, ...gazeFlags],
    at: review?.at || new Date(),
  };
};

const getSessionKind = (value) => {
  if (!value) return null;
  const explicit = String(pick(value, ['session_type', 'exam_type', 'test_type', 'section'], '')).toLowerCase();
  const examUrl = String(pick(value, ['exam_url', 'examUrl'], '')).toLowerCase();
  const rawEvents = value.events || value.logs || value.activity || [];
  const hasWritingEvent = rawEvents.some((event) => (
    String(event?.type || '').toLowerCase().startsWith('writing_')
    || String(event?.message || '').toLowerCase().includes('writing monitoring')
  ));

  if (explicit.includes('writ') || examUrl.includes('/writing-test') || hasWritingEvent) return 'writing';
  if (explicit.includes('metrica') || explicit.includes('cambridge') || examUrl.includes('metrica.cambridgemichigan.org')) return 'metrica';
  return null;
};

const sessionKindMeta = {
  writing: { label: 'Writing Test', className: 'is-writing' },
  metrica: { label: 'Metrica Cambridge', className: 'is-metrica' },
};

// Backend bo'lmasa — student sessiyasi localStorage'ga yozgan yig'ilgan logdan o'qiymiz
const readLocalSession = (id) => {
  try {
    const raw = localStorage.getItem(`proctor_session_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const readLocalSessions = () => {
  try {
    const ids = JSON.parse(localStorage.getItem('proctor_session_ids') || '[]');
    return ids
      .map((id) => {
        const rec = readLocalSession(id);
        return rec ? {
          id,
          full_name: rec.meta?.full_name || id,
          passport_id: rec.meta?.passport_id || '',
          created_at: rec.meta?.created_at || rec.updated_at || '',
          _sessionKind: getSessionKind(rec) || getSessionKind(rec.meta) || 'metrica',
        } : null;
      })
      .filter(Boolean);
  } catch { return []; }
};

// Loyihaga oldindan joylashtirilgan ruxsat etilgan-tab namuna rasmlari.
// src/assets/proctor-refs/ ga rasm tashlansa — avtomatik yuklanadi (proctor yuklamaydi).
const bundledRefModules = import.meta.glob('../assets/proctor-refs/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const BUNDLED_REF_URLS = Object.values(bundledRefModules);

// Rasm URL'ini base64 dataURL'ga aylantiramiz (Claude vision uchun)
const urlToDataUrl = async (url) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
};

const ProctorMonitor = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session') || '';

  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [idInput, setIdInput] = useState(sessionId);
  const [mediaPreview, setMediaPreview] = useState(null);

  useEffect(() => {
    if (!mediaPreview) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMediaPreview(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mediaPreview]);

  // AI Proctor
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiInFlightRef = useRef(false);
  const aiAvailable = isAiProctorAvailable();

  // Vision: ruxsat etilgan tab namuna rasmlari + tab-check natijasi
  // Bundled (loyihaga joylashtirilgan) + ixtiyoriy qo'lda qo'shilgan (localStorage)
  const [bundledRefs, setBundledRefs] = useState([]);
  const [refImages, setRefImages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('proctor_allowed_refs') || '[]'); } catch { return []; }
  });
  const allRefs = [...bundledRefs, ...refImages];

  // Bundled namuna rasmlarni bir marta dataURL'ga yuklaymiz
  useEffect(() => {
    let cancelled = false;
    Promise.all(BUNDLED_REF_URLS.map(urlToDataUrl)).then((arr) => {
      if (!cancelled) setBundledRefs(arr.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, []);
  const [screenReview, setScreenReview] = useState(null);
  const [screenLoading, setScreenLoading] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [screenSaveStatus, setScreenSaveStatus] = useState('');
  const [frames, setFrames] = useState([]);       // davriy ekran kadrlari (lokal)
  const [screenShots, setScreenShots] = useState([]); // vision'ga yuborilgan kadrlar (index → rasm)

  // Klip Blob'laridan yaratilgan objectURL'lar (memory leak bo'lmasligi uchun revoke qilamiz)
  const objectUrlsRef = useRef([]);

  // IndexedDB rec'idan event'lar (skreenshot dataURL + klip objectURL) quramiz
  const buildLocalEvents = useCallback((rec) => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    return (rec.events || []).map((e) => {
      let clip = e.clip || null;
      if (e.clipBlob) {
        clip = URL.createObjectURL(e.clipBlob);
        objectUrlsRef.current.push(clip);
      }
      return { ...normEvent({ ...e, clip }), analysisImage: e.image || null };
    });
  }, []);

  // Lokal yig'ilgan log: avval IndexedDB (media bilan), keyin localStorage (matn)
  const loadLocal = useCallback(async () => {
    const rec = await getLocalSession(sessionId);
    if (rec && rec.events && rec.events.length) {
      setFrames(Array.isArray(rec.frames) ? rec.frames : []);
      return { meta: rec.meta || {}, events: buildLocalEvents(rec) };
    }
    const ls = readLocalSession(sessionId);
    if (ls) { setFrames([]); return { meta: ls.meta || {}, events: (ls.events || []).map(normEvent) }; }
    return null;
  }, [sessionId, buildLocalEvents]);

  /* Sessiyalar ro'yxati (session tanlanmaganda) */
  useEffect(() => {
    if (sessionId) return;
    let cancelled = false;
    api.proctorListSessions()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.results || res?.sessions || []);
        if (!list.length) {
          setSessions(readLocalSessions());
          return;
        }

        // List sahifasida har bir session uchun yana /sessions/{id} yubormaymiz.
        // Badge list response'dagi exam_url/session_type yoki shu browserdagi lokal
        // metadata'dan aniqlanadi. Backend listga bu maydonlarni qo'shsa, boshqa
        // browserlarda ham Writing/Metrica badge darhol aniq chiqadi.
        const enriched = list.map((item) => {
          const id = pick(item, ['id', 'session_id'], '');
          const local = id ? readLocalSession(String(id)) : null;
          return {
            ...item,
            _sessionKind: getSessionKind(item)
              || getSessionKind(local)
              || getSessionKind(local?.meta)
              || 'metrica',
          };
        });
        if (!cancelled) setSessions(enriched);
      })
      .catch(() => { if (!cancelled) setSessions(readLocalSessions()); });
    return () => { cancelled = true; };
  }, [sessionId]);

  /* Tanlangan sessiyani davriy yuklab turamiz */
  const load = useCallback(async () => {
    if (!sessionId) return;

    // "local-..." sessiya = backend ochilmagan (fallback id). To'g'ridan-to'g'ri
    // lokal yig'ilgan logni (media bilan) o'qiymiz — backend'ga bormaymiz.
    if (sessionId.startsWith('local-')) {
      const local = await loadLocal();
      if (local) {
        setSession(local.meta);
        setEvents(local.events);
        setError('');
        return local.meta?.status || null;
      }
      setError('No local log found for this session.');
      return null;
    }

    setLoading(true);
    try {
      const res = await api.proctorGetSession(sessionId);
      const data = res?.data || res || {};
      const rawEvents = data.events || data.logs || data.activity || [];
      if (rawEvents.length) {
        const remoteEvents = rawEvents.map(normEvent);
        // Backend klipni eventga hali biriktirmagan/yetkazmagan bo'lsa, shu
        // brauzerdagi IndexedDB nusxasidan event_id bo'yicha media bilan boyitamiz.
        const local = await loadLocal();
        const localById = new Map(
          (local?.events || []).filter((event) => event.id).map((event) => [event.id, event])
        );
        const enrichedEvents = remoteEvents.map((event) => {
          const localEvent = event.id ? localById.get(event.id) : null;
          return localEvent
            ? {
              ...event,
              image: event.image || localEvent.image,
              clip: event.clip || localEvent.clip,
              analysisImage: localEvent.analysisImage || localEvent.image || event.image,
            }
            : { ...event, analysisImage: event.image };
        });
        // Backend response hali periodic screenshot yoki media eventni qaytarmagan
        // bo'lsa ham lokal IndexedDB nusxasini tashlab yubormaymiz. ID/fallback key
        // bilan dedupe qilib, Activity log'da barcha screenshot va videoni saqlaymiz.
        const remoteKeys = new Set(enrichedEvents.map(eventKey));
        const localOnly = (local?.events || []).filter((event) => (
          (event.image || event.clip) && !remoteKeys.has(eventKey(event))
        ));
        const completeEvents = [...enrichedEvents, ...localOnly].sort(newestFirst);
        setSession(data);
        setEvents(completeEvents);
        setError('');
        return pick(data, ['status', 'exam_status', 'state'], null);
      }
      // Session mavjud, lekin event hali yo'q bo'lishi mumkin. Statusni tashlab
      // yubormaymiz: ayniqsa completed session shu yerda tan olinsa polling to'xtaydi.
      const remoteStatus = pick(data, ['status', 'exam_status', 'state'], null);
      const remoteId = pick(data, ['id', 'session_id'], null);
      if (remoteStatus || remoteId) {
        const local = await loadLocal();
        setSession(data);
        setEvents(local?.events || []);
        setError('');
        return remoteStatus;
      }
      throw new Error('empty'); // backend bo'sh — lokal logga tushamiz
    } catch {
      // Backend yo'q/bo'sh — student yig'gan activity logdan (media bilan) o'qiymiz
      const local = await loadLocal();
      if (local) {
        setSession(local.meta);
        setEvents(local.events);
        setError('');
        return local.meta?.status || null;
      }
      setError('No data found for this session (backend not ready and no local log).');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, loadLocal]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer = null;

    const poll = async () => {
      const nextStatus = await load();
      if (cancelled) return;
      const normalized = String(nextStatus || '').toLowerCase();
      // Tugagan sessiya o'zgarmaydi — ortiqcha network request yubormaymiz.
      if (normalized === 'completed' || normalized === 'finished') return;
      timer = setTimeout(poll, 5000);
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, load]);

  // Unmount'da klip objectURL'larini tozalaymiz
  useEffect(() => () => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
  }, []);

  const warnings = session ? pick(session, ['warnings', 'warning_count'], events.filter((e) => e.severity === 'warning').length) : 0;
  const status = session ? pick(session, ['status', 'exam_status', 'state'], '—') : '—';
  const pollingStopped = ['completed', 'finished'].includes(String(status).toLowerCase());
  const student = session ? pick(session, ['full_name', 'student', 'name'], '') : '';
  const passport = session ? pick(session, ['passport_id', 'passport'], '') : '';

  /* AI Proctor — loglarni tahlil qiladi */
  const runAi = useCallback(async () => {
    if (!aiAvailable || !events.length || aiInFlightRef.current) return;
    aiInFlightRef.current = true;
    setAiLoading(true);
    try {
      const review = await analyzeProctoringSession({
        events,
        // PII va keraksiz matn promptga yuborilmaydi.
        meta: { sessionId, status, warnings, totalEvents: events.length },
      });
      if (review) setAiReview(review);
    } finally {
      aiInFlightRef.current = false;
      setAiLoading(false);
    }
  }, [aiAvailable, events, sessionId, status, warnings]);

  // Session almashganda eski AI xulosasini ko'rsatmaymiz. Tahlil faqat admin
  // tugmani bosganda ishlaydi — polling yoki finish hech qachon auto-call qilmaydi.
  useEffect(() => {
    setAiReview(null);
    setScreenError('');
    setScreenSaveStatus('');
    setScreenShots([]);
    if (!sessionId) {
      setScreenReview(null);
      return undefined;
    }
    let cancelled = false;
    let localReview = null;
    try {
      const saved = JSON.parse(localStorage.getItem(screenReviewKey(sessionId)) || 'null');
      localReview = saved?.review || null;
      setScreenReview(localReview);
    } catch {
      setScreenReview(null);
    }

    // Backenddagi natija localStorage'dan ustun: boshqa admin/browserda ham ko'rinadi.
    api.proctorGetCheatingEvents(sessionId)
      .then((response) => {
        if (cancelled) return;
        const backendReview = normalizeSavedScreenReview(response);
        if (!backendReview) return;
        setScreenReview(backendReview);
        setScreenSaveStatus('saved');
        try {
          localStorage.setItem(screenReviewKey(sessionId), JSON.stringify({ review: backendReview }));
        } catch { /* browser storage unavailable/full */ }
      })
      .catch(() => {
        // 404 = hali analiz saqlanmagan; mavjud lokal natijani ko'rsatishda davom etamiz.
        if (!cancelled && !localReview) setScreenReview(null);
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  /* Namuna (ruxsat etilgan tab) rasmlarini qo'shish */
  const addRefImages = useCallback((fileList) => {
    const files = Array.from(fileList || []).slice(0, 4);
    Promise.all(
      files.map((f) => new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => res(null);
        r.readAsDataURL(f);
      }))
    ).then((urls) => {
      setRefImages((prev) => {
        const next = [...prev, ...urls.filter(Boolean)].slice(0, 4);
        try { localStorage.setItem('proctor_allowed_refs', JSON.stringify(next)); } catch { /* full */ }
        return next;
      });
    });
  }, []);

  const removeRef = useCallback((i) => {
    setRefImages((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      try { localStorage.setItem('proctor_allowed_refs', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Clipboard'dan rasm paste qilish (⌘V) — namuna sifatida qo'shamiz
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const it of items) {
        if (it.type && it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) files.push(f); }
      }
      if (files.length) { e.preventDefault(); addRefImages(files); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addRefImages]);

  /* Vision: davriy kadrlar + hodisa skreenshotlarini namuna tablar bilan solishtirish */
  const runScreenCheck = useCallback(async () => {
    if (!aiAvailable || !allRefs.length) return;
    setScreenError('');
    // Remote URL o'rniga mavjud bo'lsa IndexedDB'dagi CORSsiz dataURL ishlatiladi.
    const periodic = frames
      .filter((f) => f.image)
      .map((f) => ({
        time: f.time,
        image: f.image,
        previewImage: persistentMediaUrl(f.image),
        clip: persistentMediaUrl(f.clip),
        sourceEventId: f.serverId || f.source_event_id || null,
      }));
    const eventShots = events
      .filter((e) => e.analysisImage || e.image)
      .map((e) => ({
        time: e.time,
        image: e.analysisImage || e.image,
        previewImage: persistentMediaUrl(e.image),
        clip: persistentMediaUrl(e.clip),
        sourceEventId: e.serverId || null,
      }));
    const shots = [...periodic, ...eventShots]
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .filter((shot, index, list) => list.findIndex((item) => item.image === shot.image) === index)
      // TabProctor shu kadrlar ichidan vizual takrorlarni chiqarib, 16 ta turli
      // sahifani tahlil qiladi. 4 ta bilan cheklash YouTube kabi eskiroq kadrni yo'qotardi.
      .slice(0, 60);
    if (!shots.length) return;
    setScreenShots(shots);
    setScreenLoading(true);
    try {
      const gazeFlags = gazeCheatingFlags(events);
      const sessionKind = getSessionKind(session) || getSessionKind({ events }) || 'metrica';
      const visionReview = await analyzeScreens({
        references: allRefs,
        snapshots: shots,
        meta: { sessionId, student },
        kind: sessionKind,
      });
      if (visionReview?.error && !gazeFlags.length) {
        setScreenError(visionReview.error);
      } else if (visionReview || gazeFlags.length) {
        if (visionReview?.error) setScreenError(`${visionReview.error} Eye-gaze events were still included.`);
        const review = mergeGazeReview(visionReview?.error ? {
          riskLevel: 'low',
          verdict: '',
          summary: '',
          flagged: [],
          analyzedCount: 0,
          at: new Date(),
        } : visionReview, gazeFlags);
        const savedReview = {
          ...review,
          flagged: (review.flagged || []).map((item) => {
            // Gaze evidence allaqachon activity eventidagi media bilan bog'langan.
            if (GAZE_CHEATING_TYPES.has(item.type)) return item;
            const shot = shots[item.index];
            const shotTime = new Date(shot?.time || item.time || 0).getTime();
            const linkedEvent = eventShots
              .filter((candidate) => candidate.previewImage || candidate.clip || candidate.sourceEventId)
              .map((candidate) => ({
                candidate,
                distance: Math.abs(new Date(candidate.time || 0).getTime() - shotTime),
              }))
              .sort((a, b) => a.distance - b.distance)
              .find(({ distance }) => Number.isFinite(distance) && distance <= 15000)?.candidate;
            return {
              ...item,
              image: shot?.previewImage || linkedEvent?.previewImage || persistentMediaUrl(shot?.image),
              clip: shot?.clip || linkedEvent?.clip || null,
              sourceEventId: shot?.sourceEventId || linkedEvent?.sourceEventId || null,
            };
          }),
        };
        setScreenReview(savedReview);
        try {
          localStorage.setItem(screenReviewKey(sessionId), JSON.stringify({ review: savedReview }));
        } catch { /* browser storage unavailable/full */ }
        setScreenSaveStatus('saving');
        try {
          await api.proctorSaveCheatingEvents(sessionId, cheatingReviewPayload(sessionId, savedReview));
          setScreenSaveStatus('saved');
        } catch (saveError) {
          console.error('Could not save cheating review:', saveError);
          setScreenSaveStatus('error');
          setScreenError('Analysis completed, but the result could not be saved to the backend. Try Check tabs again.');
        }
      }
    } finally {
      setScreenLoading(false);
    }
  }, [aiAvailable, allRefs, frames, events, session, sessionId, student]);

  const riskColor = { low: '#34d399', medium: '#fbbf24', high: '#f87171' };

  return (
    <div className="pm-root">
      <style>{CSS}</style>

      <header className="pm-header">
        {sessionId
          ? <button className="pm-back" onClick={() => navigate('/proctoring/monitor')}>← Back</button>
          : <button className="pm-back" onClick={() => navigate('/')}>← Home</button>}
        <h1>Proctor Monitor</h1>
        <span className="pm-live">
          {!sessionId
            ? 'Session list · no polling'
            : (loading ? 'Refreshing…' : (pollingStopped ? 'Completed · polling stopped' : 'Live · every 5s'))}
        </span>
      </header>

      <main className="pm-main">
        {/* Session tanlash */}
        <div className="pm-picker">
          <input
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="Enter Session ID…"
            onKeyDown={(e) => e.key === 'Enter' && setParams({ session: idInput.trim() })}
          />
          <button onClick={() => setParams({ session: idInput.trim() })}>Open</button>
        </div>

        {!sessionId && (
          <div className="pm-list">
            <p className="pm-eyebrow">Sessions</p>
            {sessions.length === 0 ? (
              <p className="pm-empty">No sessions, or backend not connected.</p>
            ) : (
              sessions.map((s) => {
                const id = pick(s, ['id', 'session_id'], '');
                const passportId = pick(s, ['passport_id', 'passport'], '');
                const createdAt = fmtSessionDate(pick(s, ['created_at', 'started_at'], ''));
                const kind = s._sessionKind || getSessionKind(s) || 'metrica';
                const kindMeta = sessionKindMeta[kind] || sessionKindMeta.metrica;
                return (
                  <button key={id} className="pm-list-item" onClick={() => setParams({ session: String(id) })}>
                    <span className="pm-list-person">
                      <span className="pm-list-heading">
                        <span className="pm-list-name">{pick(s, ['full_name', 'name'], id)}</span>
                        <span className={`pm-session-badge ${kindMeta.className}`}>{kindMeta.label}</span>
                      </span>
                      <span className="pm-list-meta">
                        {passportId && <span>Passport: {passportId}</span>}
                        {passportId && createdAt && <span className="pm-list-separator">•</span>}
                        {createdAt && <span>Created: {createdAt}</span>}
                      </span>
                    </span>
                    <span className="pm-list-id">{id}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {sessionId && (
          <div className="pm-grid">
           <div className="pm-col">
            {/* Status */}
            <section className="pm-card">
              <p className="pm-eyebrow">Session status</p>
              {student && <p className="pm-student">{student}{passport ? ` · ${passport}` : ''}</p>}
              <p className="pm-sid">ID: {sessionId}</p>
              <div className="pm-tiles">
                <div className="pm-tile"><span>Status</span><b>{status}</b></div>
                <div className={`pm-tile ${warnings > 0 ? 'is-bad' : ''}`}><span>Warnings</span><b>{warnings}</b></div>
                <div className="pm-tile"><span>Events</span><b>{events.length}</b></div>
              </div>
              {error && <p className="pm-err">{error}</p>}
            </section>

            {/* AI Proctor */}
            <section className="pm-card pm-ai">
              <div className="pm-ai-head">
                <p className="pm-eyebrow">AI Proctor</p>
                <button className="pm-ai-btn" onClick={runAi} disabled={aiLoading || !aiAvailable}>
                  {aiLoading ? 'Analyzing…' : (aiReview ? 'Re-analyze' : 'Analyze')}
                </button>
              </div>

              {!aiAvailable ? (
                <p className="pm-empty">AI unavailable — set VITE_TAB_PROCTOR_API_KEY.</p>
              ) : !aiReview ? (
                <p className="pm-empty">{aiLoading ? 'Analyzing the activity log…' : 'No AI review yet.'}</p>
              ) : (
                <>
                  <div className="pm-risk" style={{ '--rc': riskColor[aiReview.riskLevel] || '#94a3b8' }}>
                    <div className="pm-risk-ring">
                      <span className="pm-risk-score">{aiReview.riskScore}</span>
                      <span className="pm-risk-max">/100</span>
                    </div>
                    <div>
                      <span className="pm-risk-level">{(aiReview.riskLevel || '').toUpperCase()} RISK</span>
                      <p className="pm-verdict">{aiReview.verdict}</p>
                    </div>
                  </div>

                  {aiReview.summary && <p className="pm-summary">{aiReview.summary}</p>}

                  {aiReview.incidents?.length > 0 && (
                    <div className="pm-incidents">
                      <p className="pm-eyebrow">Flagged as cheating</p>
                      {aiReview.incidents.map((it, i) => (
                        <div key={i} className={`pm-inc sev-${it.severity || 'low'}`}>
                          <div className="pm-inc-top">
                            <span className="pm-inc-type">{it.type}</span>
                            {it.count > 1 && <span className="pm-inc-count">×{it.count}</span>}
                          </div>
                          <p className="pm-inc-reason">{it.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {aiReview.recommendation && (
                    <div className="pm-reco">
                      <b>Recommendation:</b> {aiReview.recommendation}
                    </div>
                  )}
                  <p className="pm-ai-time">Updated {aiReview.at ? aiReview.at.toLocaleTimeString('en-GB') : ''} · manual analysis</p>
                </>
              )}
            </section>

            {/* Tab check (AI vision) — ruxsat etilgan tab rasmlari bilan solishtirish */}
            <section className="pm-card pm-tabcheck">
              <div className="pm-tabcheck-head">
                <p className="pm-eyebrow">Tab check (AI vision)</p>
                {screenReview?.usage?.total > 0 && (
                  <span
                    className="pm-token-badge"
                    title={`Prompt: ${screenReview.usage.prompt.toLocaleString()} · Output: ${screenReview.usage.output.toLocaleString()} tokens`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2 L4 14 H11 L11 22 L20 10 H13 Z" />
                    </svg>
                    {screenReview.usage.total.toLocaleString()} tokens
                  </span>
                )}
              </div>
              <p className="pm-hint">
                Allowed pages are loaded from <b>src/assets/proctor-refs/</b> ({bundledRefs.length} built-in). AI flags any student snapshot that shows a different tab/site.
              </p>

              <div className="pm-refs">
                {bundledRefs.map((src, i) => (
                  <div key={`b${i}`} className="pm-ref pm-ref-locked">
                    <img src={src} alt={`allowed ${i + 1}`} />
                  </div>
                ))}
                {refImages.map((src, i) => (
                  <div key={i} className="pm-ref">
                    <img src={src} alt={`ref ${i + 1}`} />
                    <button onClick={() => removeRef(i)} title="Remove">×</button>
                  </div>
                ))}
                {allRefs.length < 5 && (
                  <label className="pm-ref-add" title="Add another (optional)">
                    +
                    <input type="file" accept="image/*" multiple hidden onChange={(e) => addRefImages(e.target.files)} />
                  </label>
                )}
              </div>

              {(() => {
                const shotCount = frames.length + events.filter((e) => e.image).length;
                return (
                  <>
                    <button
                      className="pm-ai-btn pm-tabcheck-btn"
                      onClick={runScreenCheck}
                      disabled={screenLoading || !aiAvailable || !allRefs.length || !shotCount}
                    >
                      {screenLoading ? 'Checking distinct snapshots…' : `Check tabs (${Math.min(shotCount, 60)})`}
                    </button>
                    {!allRefs.length && <p className="pm-empty">No reference pages — drop screenshots into src/assets/proctor-refs/.</p>}
                    {allRefs.length > 0 && !shotCount && (
                      <p className="pm-empty">No screen snapshots in this session yet.</p>
                    )}
                    {screenError && <p className="pm-screen-error">{screenError}</p>}
                  </>
                );
              })()}

              {screenReview && (
                <div className="pm-screenres">
                  {screenReview.analyzedCount > 0 && (
                    <p className="pm-analyzed-count">Analyzed {screenReview.analyzedCount} visually distinct screenshots.</p>
                  )}
                  <div className="pm-risk" style={{ '--rc': riskColor[screenReview.riskLevel] || '#94a3b8' }}>
                    <span className="pm-risk-level">{(screenReview.riskLevel || '').toUpperCase()} RISK</span>
                    <p className="pm-verdict">{screenReview.verdict}</p>
                  </div>
                  {screenReview.summary && <p className="pm-summary">{screenReview.summary}</p>}
                  {screenSaveStatus === 'saving' && <p className="pm-review-save is-saving">Saving result…</p>}
                  {screenSaveStatus === 'saved' && <p className="pm-review-save is-saved">Saved to session</p>}
                  {screenSaveStatus === 'error' && <p className="pm-review-save is-error">Backend save failed</p>}
                  {screenReview.flagged?.length > 0 ? (
                    <div className="pm-incidents">
                      <p className="pm-eyebrow">Detected cheating evidence</p>
                      {screenReview.flagged.map((f, i) => {
                        const shot = screenShots[f.index];
                        const shotImage = f.image || shot?.previewImage || shot?.image;
                        return (
                          <div key={i} className="pm-inc sev-high">
                            <div className="pm-inc-top">
                              <span className="pm-inc-type">{f.page || 'Unknown page'}</span>
                              {f.time && <span className="pm-inc-count">{fmtTime(f.time)}</span>}
                            </div>
                            <p className="pm-inc-reason">{f.reason}</p>
                            {shotImage && (
                              <button
                                type="button"
                                className="pm-shot"
                                style={{ marginTop: 8 }}
                                onClick={() => setMediaPreview({ type: 'image', src: shotImage, title: f.page || 'Off-page screenshot' })}
                              >
                                <img src={shotImage} alt="off-page snapshot" />
                              </button>
                            )}
                            {f.clip && (
                              <button
                                type="button"
                                className="pm-clip-button"
                                onClick={() => setMediaPreview({ type: 'video', src: f.clip, title: `${f.page || 'Off-page'} recording` })}
                              >
                                <video src={f.clip} muted playsInline preload="metadata" className="pm-clip" />
                                <span className="pm-play"><span>▶</span> View video</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pm-empty">No off-page snapshots — all on allowed pages.</p>
                  )}
                </div>
              )}
            </section>
           </div>

            {/* Activity log */}
            <section className="pm-card">
              <p className="pm-eyebrow">Activity log</p>
              {events.length === 0 ? (
                <p className="pm-empty">No events.</p>
              ) : (
                <ul className="pm-timeline">
                  {events.map((ev, i) => (
                    <li key={i} className={ev.severity === 'warning' ? 'is-warn' : ''}>
                      <span className="pm-dot" />
                      <div>
                        <p className="pm-msg">{ev.message || ev.type}</p>
                        {ev.image && (
                          <button
                            type="button"
                            className="pm-shot"
                            onClick={() => setMediaPreview({ type: 'image', src: ev.image, title: ev.message || 'Screenshot' })}
                          >
                            <img src={ev.image} alt="screenshot" />
                          </button>
                        )}
                        {ev.clip && (
                          <button
                            type="button"
                            className="pm-clip-button"
                            onClick={() => setMediaPreview({ type: 'video', src: ev.clip, title: ev.message || 'Screen recording' })}
                          >
                            <video src={ev.clip} muted playsInline preload="metadata" className="pm-clip" />
                            <span className="pm-play"><span>▶</span> View video</span>
                          </button>
                        )}
                        <p className="pm-time">{fmtTime(ev.time)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      {mediaPreview && (
        <div className="pm-modal-backdrop" role="presentation" onClick={() => setMediaPreview(null)}>
          <div
            className="pm-media-modal"
            role="dialog"
            aria-modal="true"
            aria-label={mediaPreview.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pm-modal-head">
              <div>
                <p className="pm-modal-kind">{mediaPreview.type === 'video' ? 'Screen recording' : 'Screenshot'}</p>
                <p className="pm-modal-title">{mediaPreview.title}</p>
              </div>
              <button type="button" className="pm-modal-close" onClick={() => setMediaPreview(null)} aria-label="Close preview">×</button>
            </div>
            <div className="pm-modal-body">
              {mediaPreview.type === 'video' ? (
                <video src={mediaPreview.src} controls autoPlay playsInline className="pm-modal-video" />
              ) : (
                <img src={mediaPreview.src} alt={mediaPreview.title} className="pm-modal-image" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CSS = `
.pm-root{min-height:100vh;color:#e8eef7;background:linear-gradient(160deg,#060d1a,#081428 45%,#060e1d);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
.pm-header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 22px;background:rgba(8,16,30,.6);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08);}
.pm-header h1{font-size:17px;font-weight:800;color:#fff;}
.pm-back{color:#9fb6d6;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:8px 14px;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;}
.pm-back:hover{color:#fff;background:rgba(255,255,255,.1);}
.pm-live{font-size:12px;font-weight:700;color:#5ff0b6;}
.pm-main{max-width:1100px;margin:0 auto;padding:24px 22px 60px;}
.pm-picker{display:flex;gap:10px;margin-bottom:22px;}
.pm-picker input{flex:1;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);border-radius:12px;padding:11px 14px;color:#eef4ff;font-size:14px;outline:none;}
.pm-picker input:focus{border-color:#2f7ad6;}
.pm-picker button{background:linear-gradient(135deg,#2f7ad6,#024890);color:#fff;border:0;border-radius:12px;padding:11px 22px;font-weight:800;cursor:pointer;}
.pm-eyebrow{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#7d95b8;margin-bottom:12px;}
.pm-tabcheck-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.pm-tabcheck-head .pm-eyebrow{margin-bottom:12px;}
.pm-token-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.04em;color:#a7f3d0;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);border-radius:999px;padding:4px 10px;margin-bottom:12px;white-space:nowrap;cursor:default;}
.pm-token-badge svg{width:13px;height:13px;color:#34d399;}
.pm-list-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;margin-bottom:8px;color:#e8eef7;font-size:14px;font-weight:600;cursor:pointer;}
.pm-list-item:hover{background:rgba(255,255,255,.08);}
.pm-list-person{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;}
.pm-list-heading{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}
.pm-list-name{font-size:14px;font-weight:750;color:#e8eef7;}
.pm-session-badge{display:inline-flex;align-items:center;min-height:20px;padding:2px 8px;border:1px solid;border-radius:999px;font-size:9.5px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.pm-session-badge.is-writing{color:#d8b4fe;background:rgba(168,85,247,.13);border-color:rgba(192,132,252,.38);}
.pm-session-badge.is-metrica{color:#7dd3fc;background:rgba(14,165,233,.12);border-color:rgba(56,189,248,.35);}
.pm-list-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:11.5px;font-weight:500;color:#8299bb;}
.pm-list-separator{color:#415574;}
.pm-list-id{flex-shrink:0;font-size:12px;color:#67809f;font-weight:500;}
@media(max-width:640px){.pm-list-item{align-items:flex-start;flex-direction:column}.pm-list-id{font-size:11px}.pm-list-meta{gap:4px}.pm-list-separator{display:none}.pm-list-meta span:not(.pm-list-separator){width:100%}}
.pm-empty{font-size:14px;color:#6f88ac;}
.pm-grid{display:grid;grid-template-columns:1fr;gap:20px;}
@media(min-width:900px){.pm-grid{grid-template-columns:380px 1fr;align-items:start;}}
.pm-col{display:flex;flex-direction:column;gap:20px;min-width:0;}

/* AI Proctor */
.pm-ai-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.pm-ai-head .pm-eyebrow{margin-bottom:0;}
.pm-ai-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#cfe0f7;border-radius:9px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;}
.pm-ai-btn:hover:not(:disabled){background:rgba(255,255,255,.12);color:#fff;}
.pm-ai-btn:disabled{opacity:.5;cursor:not-allowed;}
.pm-risk{display:flex;align-items:center;gap:16px;margin-bottom:14px;}
.pm-risk-ring{width:78px;height:78px;border-radius:50%;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.04),transparent);border:3px solid var(--rc);box-shadow:0 0 22px -4px var(--rc);}
.pm-risk-score{font-size:26px;font-weight:900;color:#fff;line-height:1;}
.pm-risk-max{font-size:11px;color:#7d95b8;}
.pm-risk-level{font-size:13px;font-weight:900;letter-spacing:.08em;color:var(--rc);}
.pm-verdict{font-size:14px;color:#e8eef7;line-height:1.4;margin-top:4px;}
.pm-summary{font-size:13.5px;color:#a8bcd8;line-height:1.55;margin-bottom:14px;}
.pm-incidents{margin-bottom:14px;}
.pm-inc{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-left-width:3px;border-radius:10px;padding:10px 12px;margin-top:8px;}
.pm-inc.sev-high{border-left-color:#f87171;background:rgba(239,68,68,.08);}
.pm-inc.sev-medium{border-left-color:#fbbf24;background:rgba(251,191,36,.07);}
.pm-inc.sev-low{border-left-color:#60a5fa;}
.pm-inc-top{display:flex;align-items:center;gap:8px;}
.pm-inc-type{font-size:13px;font-weight:800;color:#eef4ff;}
.pm-inc-count{font-size:11px;font-weight:800;color:#fca5a5;background:rgba(239,68,68,.15);padding:1px 7px;border-radius:99px;}
.pm-inc-reason{font-size:12.5px;color:#a8bcd8;line-height:1.45;margin-top:3px;}
.pm-reco{font-size:13px;color:#c3d4ee;line-height:1.5;background:rgba(47,122,214,.1);border:1px solid rgba(47,122,214,.28);border-radius:10px;padding:11px 13px;}
.pm-reco b{color:#7dd3fc;}
.pm-ai-time{font-size:11px;color:#67809f;margin-top:10px;}

/* tab check (vision) */
.pm-hint{font-size:12.5px;color:#8aa0c2;line-height:1.5;margin:6px 0 12px;}
.pm-refs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.pm-ref{position:relative;width:72px;height:48px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.14);}
.pm-ref img{width:100%;height:100%;object-fit:cover;}
.pm-ref-locked{border-color:rgba(52,211,153,.4);}
.pm-ref button{position:absolute;top:2px;right:2px;width:18px;height:18px;border:0;border-radius:50%;background:rgba(0,0,0,.7);color:#fff;font-size:13px;line-height:1;cursor:pointer;display:grid;place-items:center;}
.pm-ref-add{width:72px;height:48px;border-radius:8px;border:1.5px dashed rgba(255,255,255,.25);display:grid;place-items:center;color:#7d95b8;font-size:22px;cursor:pointer;}
.pm-ref-add:hover{border-color:#2f7ad6;color:#7dd3fc;}
.pm-tabcheck-btn{width:100%;padding:10px;margin-top:2px;}
.pm-screen-error{margin-top:10px;padding:9px 11px;border:1px solid rgba(248,113,113,.35);border-radius:9px;background:rgba(239,68,68,.09);color:#fca5a5;font-size:12px;line-height:1.45;}
.pm-screenres{margin-top:14px;}
.pm-analyzed-count{margin-bottom:12px;color:#7dd3fc;font-size:11.5px;font-weight:700;}
.pm-review-save{display:inline-flex;align-items:center;margin:-4px 0 12px;padding:4px 9px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.04em;}
.pm-review-save.is-saving{color:#fde68a;background:rgba(245,158,11,.12);}
.pm-review-save.is-saved{color:#6ee7b7;background:rgba(16,185,129,.12);}
.pm-review-save.is-error{color:#fca5a5;background:rgba(239,68,68,.12);}
.pm-card{background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:20px;box-shadow:0 24px 60px -30px rgba(0,0,0,.8);}
.pm-student{font-size:16px;font-weight:800;color:#fff;}
.pm-sid{font-size:12px;color:#67809f;margin:2px 0 16px;}
.pm-tiles{display:flex;flex-direction:column;gap:10px;}
.pm-tile{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);}
.pm-tile span{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7d95b8;}
.pm-tile b{font-size:16px;color:#eef4ff;}
.pm-tile.is-bad{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3);}
.pm-tile.is-bad b{color:#fecaca;}
.pm-err{margin-top:12px;font-size:13px;color:#fca5a5;}
.pm-timeline{list-style:none;margin:0;padding:0;max-height:70vh;overflow-y:auto;display:flex;flex-direction:column;gap:4px;}
.pm-timeline li{display:flex;gap:12px;padding:10px 4px;}
.pm-dot{width:9px;height:9px;border-radius:50%;background:#3b4c66;margin-top:5px;flex-shrink:0;}
.pm-timeline li.is-warn .pm-dot{background:#f87171;box-shadow:0 0 10px rgba(248,113,113,.7);}
.pm-msg{font-size:14px;color:#c3d4ee;line-height:1.4;}
.pm-timeline li.is-warn .pm-msg{color:#fecaca;font-weight:600;}
.pm-time{font-size:11.5px;color:#67809f;margin-top:3px;}
.pm-shot{display:block;margin-top:8px;width:260px;max-width:100%;padding:0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:#020711;cursor:zoom-in;text-align:left;}
.pm-shot:hover{border-color:rgba(125,211,252,.7);box-shadow:0 10px 28px -15px rgba(56,189,248,.7);}
.pm-shot img{display:block;width:100%;height:auto;}
.pm-clip{display:block;margin-top:8px;width:280px;max-width:100%;border-radius:10px;border:1px solid rgba(120,190,255,.3);background:#000;}
.pm-clip-button{position:relative;display:block;width:280px;max-width:100%;padding:0;border:0;background:transparent;color:#fff;cursor:pointer;text-align:left;}
.pm-clip-button .pm-clip{width:100%;pointer-events:none;}
.pm-play{position:absolute;inset:8px 0 0;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;background:rgba(2,8,20,.38);font-size:12px;font-weight:800;opacity:0;transition:opacity .18s ease;}
.pm-play span{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;padding-left:2px;background:rgba(2,72,144,.92);box-shadow:0 8px 24px rgba(0,0,0,.4);}
.pm-clip-button:hover .pm-play,.pm-clip-button:focus-visible .pm-play{opacity:1;}
.pm-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(1,5,13,.86);backdrop-filter:blur(10px);}
.pm-media-modal{width:min(1100px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:20px;background:#071224;box-shadow:0 32px 100px rgba(0,0,0,.65);}
.pm-modal-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.09);}
.pm-modal-kind{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#60a5fa;}
.pm-modal-title{margin-top:3px;font-size:14px;font-weight:700;color:#e8eef7;}
.pm-modal-close{width:36px;height:36px;display:grid;place-items:center;flex-shrink:0;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(255,255,255,.06);color:#dbeafe;font-size:25px;line-height:1;cursor:pointer;}
.pm-modal-close:hover{background:rgba(255,255,255,.13);color:#fff;}
.pm-modal-body{min-height:0;display:flex;align-items:center;justify-content:center;padding:14px;background:#020711;overflow:auto;}
.pm-modal-image{display:block;max-width:100%;max-height:78vh;object-fit:contain;border-radius:10px;}
.pm-modal-video{display:block;width:100%;max-height:78vh;background:#000;border-radius:10px;}
@media(max-width:600px){.pm-modal-backdrop{padding:10px}.pm-media-modal{width:100%;max-height:95vh}.pm-modal-head{padding:12px}.pm-modal-body{padding:8px}.pm-play{opacity:1}}
.pm-timeline::-webkit-scrollbar{width:6px;}
.pm-timeline::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:99px;}
`;

export default ProctorMonitor;
