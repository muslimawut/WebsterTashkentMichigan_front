/*
  YouTube IFrame Player API'ni bir marta yuklaydi.

  Oddiy <iframe> bilan videoning ko'rilgani aniqlanmaydi — shuning uchun
  proctoring yo'riqnomasi kabi "oxirigacha ko'rish shart" holatlarda shu API
  kerak (player holati ENDED bo'lgani bilinadi).
*/

const API_SRC = 'https://www.youtube.com/iframe_api';
const LOAD_TIMEOUT_MS = 12000;

let apiPromise = null;

export const loadYouTubeIframeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    // Boshqa komponent ham shu callback'ni kutayotgan bo'lishi mumkin.
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') previousReady();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube Player API did not initialize.'));
    };

    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = API_SRC;
      script.async = true;
      script.onerror = () => reject(new Error('YouTube Player API could not be loaded.'));
      document.head.appendChild(script);
    }

    setTimeout(() => reject(new Error('YouTube Player API timed out.')), LOAD_TIMEOUT_MS);
  }).catch((error) => {
    // Muvaffaqiyatsiz urinish keyingi chaqiruvni abadiy bloklamasin.
    apiPromise = null;
    throw error;
  });

  return apiPromise;
};
