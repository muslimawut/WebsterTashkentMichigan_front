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
 * Passport seriyasi va raqami: 2 ta harf + 7 ta raqam (masalan AD7113185).
 * Kiritilayotgan qiymatni shu shaklga keltiradi — kichik harflar katta bo'ladi,
 * probel/tire tashlanadi, harflar to'lmasdan yozilgan raqamlar qabul qilinmaydi
 * va 9 belgidan uzunini kesib tashlaydi.
 */
export const PASSPORT_ID_PATTERN = /^[A-Z]{2}\d{7}$/;
export const PASSPORT_ID_LENGTH = 9;

export function formatPassportId(value) {
  const raw = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let letters = '';
  let digits = '';
  for (const char of raw) {
    if (letters.length < 2) {
      if (char >= 'A' && char <= 'Z') letters += char;
      continue; // harflar to'lmaguncha raqam yozib bo'lmaydi
    }
    if (char >= '0' && char <= '9' && digits.length < 7) digits += char;
  }
  return `${letters}${digits}`;
}

export function isValidPassportId(value) {
  return PASSPORT_ID_PATTERN.test(String(value ?? '').trim().toUpperCase());
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
