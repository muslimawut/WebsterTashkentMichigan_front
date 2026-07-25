// Telegram error/support reporting — endi BACKEND orqali yuboriladi.
// Frontend to'g'ridan-to'g'ri Telegram'ga EMAS, POST /api/v1/telegram/notify ga
// JSON jo'natadi; backend Telegram'ga forward qiladi. Bot token frontendда saqlanmaydi.
// Body shakli: { name, email, phone, message }.
//
// Eslatma: bu fayl api.js ni import QILMAYDI (circular bo'lardi) — shu sabab
// to'g'ridan-to'g'ri fetch ishlatiladi (credentials: 'include' bilan).

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const NOTIFY_URL = API_BASE_URL ? `${API_BASE_URL}/telegram/notify` : '';

// Lokal (localhost / 127.0.0.1) xatolar backendga yuborilmaydi
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const isConfigured = Boolean(NOTIFY_URL && !isLocalhost);
const isSupportConfigured = isConfigured;

// Bir xil xatolik qayta-qayta yuborilmasligi uchun oddiy throttle (60s)
const recentlySent = new Map();
const THROTTLE_MS = 60 * 1000;

// HTTP status kodlarini odam tushunadigan tilga aylantiramiz
const STATUS_LABELS = {
  400: '⚠️ Noto‘g‘ri so‘rov (400)',
  401: '🔒 Avtorizatsiyadan o‘tilmagan (401)',
  403: '⛔ Ruxsat yo‘q (403)',
  404: '🔍 Topilmadi (404)',
  408: '⏱ Vaqt tugadi (408)',
  409: '♻️ Konflikt (409)',
  422: '📝 Ma‘lumot noto‘g‘ri (422)',
  429: '🚦 Juda ko‘p so‘rov (429)',
  500: '💥 Server xatosi (500)',
  502: '🌐 Bad Gateway (502)',
  503: '🛠 Server vaqtincha ishlamayapti (503)',
  504: '🐢 Server javob bermadi (504)',
};

const truncate = (str, max = 700) => {
  const s = String(str ?? '');
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

// So'rov payload'ini o'qiladigan matnga aylantiramiz (to'liq, hamma maydon bilan)
const formatPayload = (payload) => {
  if (payload == null) return null;
  let obj = payload;
  if (typeof payload === 'string') {
    try {
      obj = JSON.parse(payload);
    } catch {
      return payload; // JSON emas (masalan FormData yoki oddiy matn)
    }
  }
  if (obj instanceof FormData) {
    const entries = {};
    for (const [k, v] of obj.entries()) {
      entries[k] = v instanceof File ? `<file: ${v.name}>` : v;
    }
    obj = entries;
  }
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

// Joriy foydalanuvchi kontakti (name/email/phone) — payload uchun (agar mavjud bo'lsa)
const getUserContact = () => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('profile');
    if (!raw) return {};
    const u = JSON.parse(raw);
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || '';
    return { name, email: u.email || '', phone: u.phone || '' };
  } catch {
    return {};
  }
};

// Backend /telegram/notify ga JSON yuboramiz. Bu XOM fetch — axios interceptor'ga
// tushmaydi, shuning uchun (backend xatosini backendga qayta yuborish) cheksiz
// sikl hosil bo'lmaydi.
const postNotify = ({ name, email, phone, message }) => {
  if (!NOTIFY_URL) return Promise.resolve(null);
  return fetch(NOTIFY_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name || '',
      email: email || '',
      phone: phone || '',
      message: message || '',
    }),
  });
};

/**
 * Xatolik hisobotini backend orqali Telegramga yuboradi.
 * @param {Object} info
 * @param {string} info.message  - foydalanuvchiga ko'rsatilgan/sodda xabar
 * @param {number} [info.status] - HTTP status kodi
 * @param {string} [info.method] - HTTP metod (GET/POST...)
 * @param {string} [info.url]    - so'rov manzili
 * @param {string} [info.details] - qo'shimcha texnik tafsilot (raw)
 * @param {*}      [info.payload] - so'rov tanasi (request body)
 */
export const reportErrorToTelegram = async ({ message, status, method, url, details, payload } = {}) => {
  if (!isConfigured) return; // backend/URL sozlanmagan bo'lsa, jim turamiz

  // Throttle: bir xil (status + url + message) ni qayta yubormaymiz
  const key = `${status || ''}|${url || ''}|${message || ''}`;
  const now = Date.now();
  const last = recentlySent.get(key);
  if (last && now - last < THROTTLE_MS) return;
  recentlySent.set(key, now);

  const statusLabel = status ? STATUS_LABELS[status] || `❗️ Xatolik (${status})` : '❗️ Xatolik';
  const time = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    hour12: false,
  });
  const contact = getUserContact();

  const lines = [
    '🚨 Webster MEPT — Xatolik',
    '',
    statusLabel,
    `💬 Xabar: ${truncate(message, 300)}`,
  ];

  if (method || url) {
    lines.push(`🔗 So‘rov: ${`${method || ''} ${url || ''}`.trim()}`);
  }
  if (contact.name) lines.push(`👤 Foydalanuvchi: ${contact.name}`);
  lines.push(`🕒 Vaqt: ${time} (Toshkent)`);
  lines.push(`🌐 Sahifa: ${window.location.pathname}`);

  const formattedPayload = formatPayload(payload);
  if (formattedPayload) {
    lines.push('', '📦 Yuborilgan ma‘lumot (payload):', truncate(formattedPayload));
  }

  if (details) {
    // Stack trace bo'lsa, fayl:satr:ustun ma'lumoti kesilmasligi uchun ko'proq joy beramiz
    const detailsMax = /\n\s*at\s|@http|@\//.test(String(details)) ? 2500 : 700;
    lines.push('', '🧩 Server javobi / Stack:', truncate(details, detailsMax));
  }

  try {
    await postNotify({
      name: contact.name || 'Webster MEPT (system)',
      email: contact.email,
      phone: contact.phone,
      message: lines.join('\n'),
    });
  } catch (e) {
    // Yuborish o'zi xato bersa, ilovani buzmaymiz
    console.warn('Telegram notify (error report) failed:', e);
  }
};

/**
 * Student yuborgan texnik muammoni backend orqali developerlar guruhiga yetkazadi.
 * Natija UI'ga qaytariladi, shuning uchun student xabari borgan-bormaganini biladi.
 */
export const sendSupportReportToTelegram = async ({
  message,
  category,
  fullName,
  passportId,
  sessionId,
  phase,
  cameraOn,
  micOn,
  screenOn,
  permissionError,
  cameraCheckStatus,
} = {}) => {
  if (!isSupportConfigured) {
    throw new Error(isLocalhost
      ? 'Support reports are disabled on localhost.'
      : 'Support is not configured.');
  }

  const issue = String(message || '').trim();
  if (!issue) throw new Error('Please describe the problem.');

  const time = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    hour12: false,
  });
  const connection = navigator.onLine ? 'Online' : 'Offline';
  const lines = [
    '🆘 Webster MEPT — Student support request',
    '',
    `🏷 Category: ${category || 'Other'}`,
    '💬 Problem:',
    truncate(issue, 1200),
    '',
    `👤 Student: ${fullName || 'Not entered'}`,
    `🪪 Passport: ${passportId || 'Not entered'}`,
    `🧾 Session: ${sessionId || 'Not started'}`,
    `📍 Stage: ${phase || 'unknown'}`,
    `📷 Camera: ${cameraOn ? 'Connected' : 'Disconnected'}`,
    `🎤 Microphone: ${micOn ? 'Connected' : 'Disconnected'}`,
    `🖥 Screen share: ${screenOn ? 'Active' : 'Inactive'}`,
    `🌐 Connection: ${connection}`,
  ];

  if (cameraCheckStatus) {
    lines.push(`🔎 Camera check: ${truncate(cameraCheckStatus, 300)}`);
  }
  if (permissionError) {
    lines.push(`⚠️ Current error: ${truncate(permissionError, 600)}`);
  }

  lines.push(`🕒 Time: ${time} (Tashkent)`);
  lines.push(`🔗 Page: ${window.location.pathname}${window.location.search}`);
  lines.push(`🧭 Browser: ${truncate(navigator.userAgent, 350)}`);

  const response = await postNotify({
    name: fullName || 'MEPT Student',
    email: '',
    phone: '',
    message: lines.join('\n'),
  });

  const result = await response?.json?.().catch(() => null);
  if (!response || !response.ok || (result && result.ok === false)) {
    const desc = result?.detail || result?.message || result?.error;
    throw new Error(desc || `Notify request failed (${response?.status ?? 'network'}).`);
  }
  return true;
};

export default reportErrorToTelegram;
