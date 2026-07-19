// Telegram error reporting — adminlar monitoring qilishi uchun
// Frontend'dan to'g'ridan-to'g'ri Telegram Bot API'ga yuboradi.

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
// Support xabarlari ham umumiy Telegram guruhiga yuboriladi.
const SUPPORT_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

// Lokal (localhost / 127.0.0.1) xatolar Telegramga ketmaydi
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const isConfigured = Boolean(BOT_TOKEN && CHAT_ID && !isLocalhost);
const isSupportConfigured = Boolean(
  import.meta.env.VITE_TELEGRAM_BOT_TOKEN && SUPPORT_CHAT_ID && !isLocalhost
);

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

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const truncate = (str, max = 700) => {
  const s = String(str ?? '');
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

// So'rov payload'ini chiroyli matnga aylantiramiz (to'liq, hamma maydon bilan)
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

// Joriy foydalanuvchi haqida qisqa ma'lumot (agar mavjud bo'lsa)
const getUserInfo = () => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('profile');
    if (!raw) return null;
    const u = JSON.parse(raw);
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return name || u.email || u.phone || null;
  } catch {
    return null;
  }
};

/**
 * Telegramga user-friendly error hisobotini yuboradi.
 * @param {Object} info
 * @param {string} info.message  - foydalanuvchiga ko'rsatilgan/sodda xabar
 * @param {number} [info.status] - HTTP status kodi
 * @param {string} [info.method] - HTTP metod (GET/POST...)
 * @param {string} [info.url]    - so'rov manzili
 * @param {string} [info.details] - qo'shimcha texnik tafsilot (raw)
 * @param {*}      [info.payload] - so'rov tanasi (request body)
 */
export const reportErrorToTelegram = async ({ message, status, method, url, details, payload } = {}) => {
  if (!isConfigured) return; // token sozlanmagan bo'lsa, jim turamiz

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
  const user = getUserInfo();

  const lines = [
    `🚨 <b>Webster MEPT — Xatolik</b>`,
    ``,
    `${statusLabel}`,
    `💬 <b>Xabar:</b> ${escapeHtml(truncate(message, 300))}`,
  ];

  if (method || url) {
    lines.push(`🔗 <b>So‘rov:</b> <code>${escapeHtml(`${method || ''} ${url || ''}`.trim())}</code>`);
  }
  if (user) lines.push(`👤 <b>Foydalanuvchi:</b> ${escapeHtml(user)}`);
  lines.push(`🕒 <b>Vaqt:</b> ${escapeHtml(time)} (Toshkent)`);
  lines.push(`🌐 <b>Sahifa:</b> <code>${escapeHtml(window.location.pathname)}</code>`);

  const formattedPayload = formatPayload(payload);
  if (formattedPayload) {
    lines.push(``, `📦 <b>Yuborilgan ma‘lumot (payload):</b>`, `<pre>${escapeHtml(truncate(formattedPayload))}</pre>`);
  }

  if (details) {
    // Stack trace bo'lsa, fayl:satr:ustun ma'lumoti kesilmasligi uchun ko'proq joy beramiz
    const detailsMax = /\n\s*at\s|@http|@\//.test(String(details)) ? 2500 : 700;
    lines.push(``, `🧩 <b>Server javobi / Stack:</b>`, `<pre>${escapeHtml(truncate(details, detailsMax))}</pre>`);
  }

  const text = lines.join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    // Telegramga yuborish o'zi xato bersa, ilovani buzmaymiz
    console.warn('Telegram error report failed:', e);
  }
};

/**
 * Student yuborgan texnik muammoni developerlar Telegram guruhiga yetkazadi.
 * Bu funksiya xatolik reporteridan alohida: throttle yo'q va natija UI'ga
 * qaytariladi, shuning uchun student xabari borgan-bormaganini biladi.
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
      : 'Telegram support is not configured.');
  }

  const issue = String(message || '').trim();
  if (!issue) throw new Error('Please describe the problem.');

  const time = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    hour12: false,
  });
  const connection = navigator.onLine ? 'Online' : 'Offline';
  const lines = [
    '🆘 <b>Webster MEPT — Student support request</b>',
    '',
    `🏷 <b>Category:</b> ${escapeHtml(category || 'Other')}`,
    '💬 <b>Problem:</b>',
    `<pre>${escapeHtml(truncate(issue, 1200))}</pre>`,
    '',
    `👤 <b>Student:</b> ${escapeHtml(fullName || 'Not entered')}`,
    `🪪 <b>Passport:</b> <code>${escapeHtml(passportId || 'Not entered')}</code>`,
    `🧾 <b>Session:</b> <code>${escapeHtml(sessionId || 'Not started')}</code>`,
    `📍 <b>Stage:</b> ${escapeHtml(phase || 'unknown')}`,
    `📷 <b>Camera:</b> ${cameraOn ? 'Connected' : 'Disconnected'}`,
    `🎤 <b>Microphone:</b> ${micOn ? 'Connected' : 'Disconnected'}`,
    `🖥 <b>Screen share:</b> ${screenOn ? 'Active' : 'Inactive'}`,
    `🌐 <b>Connection:</b> ${connection}`,
  ];

  if (cameraCheckStatus) {
    lines.push(`🔎 <b>Camera check:</b> ${escapeHtml(truncate(cameraCheckStatus, 300))}`);
  }
  if (permissionError) {
    lines.push(`⚠️ <b>Current error:</b> ${escapeHtml(truncate(permissionError, 600))}`);
  }

  lines.push(`🕒 <b>Time:</b> ${escapeHtml(time)} (Tashkent)`);
  lines.push(`🔗 <b>Page:</b> <code>${escapeHtml(`${window.location.pathname}${window.location.search}`)}</code>`);
  lines.push(`🧭 <b>Browser:</b> ${escapeHtml(truncate(navigator.userAgent, 350))}`);

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: SUPPORT_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    throw new Error(result?.description || `Telegram request failed (${response.status}).`);
  }
  return true;
};

export default reportErrorToTelegram;
