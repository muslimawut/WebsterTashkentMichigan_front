const ALLOWED_URL_PROTOCOLS = ['https:', 'http:'];

/**
 * URL ni tekshiradi — faqat http/https ruxsat beriladi.
 * javascript:, data:, vbscript: kabi xavfli protokollarni bloklaydi.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) return '';
    return url;
  } catch {
    return '';
  }
}

/**
 * Foydalanuvchi kiritgan matndan XSS belgilarini tozalaydi.
 * Faqat oddiy matn uchun — HTML render qilinmaydigan joylarda ishlatiladi.
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * localStorage dan o'qilgan JSON ni xavfsiz parse qiladi.
 * Parse xato bo'lsa null qaytaradi.
 */
export function safeJsonParse(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
