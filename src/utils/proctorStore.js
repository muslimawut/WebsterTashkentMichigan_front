/*
  IndexedDB do'koni — proctoring sessiyasining to'liq activity logini
  (skreenshot dataURL + klip Blob bilan) saqlaydi. localStorage kichik (~5MB)
  bo'lgani uchun media shu yerda saqlanadi; ProctorMonitor shu yerdan o'qiydi.
*/

const DB_NAME = 'proctor';
const STORE = 'sessions';
const VERSION = 1;

const openDB = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no-indexeddb'));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// record: { meta, events: [{id,type,message,severity,time,image(dataURL|null),clipBlob(Blob|null)}] }
export const saveSession = async (id, record) => {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ id, ...record, updated_at: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
  } catch {
    return false;
  }
};

export const getSession = async (id) => {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const listSessions = async () => {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};
