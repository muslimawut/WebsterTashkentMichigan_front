/*
  Uzilib qolgan proctoring sessiyasini davom ettirish uchun kichik do'kon.

  Muammo: Start bosilgan har safar YANGI backend sessiyasi ochilardi. Sahifa
  qayta yuklansa yoki tab yopilib qaytadan kirilsa, bitta studentning imtihoni
  ro'yxatda 3-7 ta alohida sessiyaga bo'linib ketardi va eskilari abadiy
  "active" bo'lib qolardi.

  Nega localStorage: ilgari sessiya ID `sessionStorage`ga yozilardi (va umuman
  o'qilmasdi). sessionStorage tab yopilganda o'chadi — kuzatilgan holatda aynan
  shunday bo'lgan: student sahifani yopib, bir necha daqiqadan keyin qaytgan.
  localStorage esa tab yopilsa ham saqlanadi.

  Bu yerda faqat lokal yozuv bor; sessiya haqiqatan davom etayotganini
  chaqiruvchi backenddan (status hali `active` mi) tekshiradi.
*/

const storageKey = (kind) => `proctor_resume_${kind}`;

// Shundan eski yozuv tiklanmaydi — o'tgan kungi sessiyaga ulanib qolmaslik uchun.
export const RESUME_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export const saveResumableSession = (kind, { sessionId, fullName = '', passportId = '' }) => {
  if (!sessionId) return;
  try {
    localStorage.setItem(storageKey(kind), JSON.stringify({
      sessionId,
      fullName,
      passportId,
      savedAt: Date.now(),
    }));
  } catch { /* localStorage to'la yoki bloklangan */ }
};

export const readResumableSession = (kind, { passportId = null, maxAgeMs = RESUME_MAX_AGE_MS } = {}) => {
  try {
    const record = JSON.parse(localStorage.getItem(storageKey(kind)) || 'null');
    if (!record?.sessionId) return null;
    if (Date.now() - (record.savedAt || 0) > maxAgeMs) return null;
    // Bir kompyuterda ketma-ket ikki student topshirsa — boshqasining sessiyasiga
    // ulanib qolmaymiz.
    if (passportId
      && String(record.passportId || '').toUpperCase() !== String(passportId).toUpperCase()) return null;
    return record;
  } catch {
    return null;
  }
};

export const clearResumableSession = (kind) => {
  try { localStorage.removeItem(storageKey(kind)); } catch { /* ignore */ }
};
