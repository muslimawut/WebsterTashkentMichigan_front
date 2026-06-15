// Telegram error reporting — adminlar monitoring qilishi uchun
// Frontend'dan to'g'ridan-to'g'ri Telegram Bot API'ga yuboradi.

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

const isConfigured = Boolean(BOT_TOKEN && CHAT_ID);

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
    lines.push(``, `🧩 <b>Server javobi:</b>`, `<pre>${escapeHtml(truncate(details))}</pre>`);
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

export default reportErrorToTelegram;
