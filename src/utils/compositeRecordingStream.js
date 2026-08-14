/*
  Ekran + kamera birlashtirilgan yozuv oqimi (video-klip uchun).

  Muammo: klip faqat ekran video-trekidan yozilardi — yozuvda studentning o'zi
  ko'rinmasdi. Skreenshotlarda kamera o'ng-past burchakda PIP bo'lib chiziladi,
  videoda esa yo'q edi; natijada "ikkinchi odam", "yuz ko'rinmadi" kabi
  dalillarni videodan tasdiqlab bo'lmasdi.

  Yechim: canvas'ga ekran (asosiy kadr) va kamera (PIP, ko'zgu) chiziladi,
  canvas.captureStream() esa MediaRecorder'ga beriladi.

  Muhim: chizish tsikli Web Worker timeri bilan yuritiladi. requestAnimationFrame
  fon tabida umuman ishlamaydi, setInterval esa sekundiga bir martagacha
  sekinlashadi — aynan MEPT tabi yashiringan payt (student Metrica tabida)
  video muzlab qolardi.
*/

const DEFAULT_FPS = 12;
const DEFAULT_MAX_WIDTH = 1280;
const PIP_WIDTH_RATIO = 0.22;
const PIP_MARGIN = 12;

const videoReady = (video) => Boolean(video && video.videoWidth > 0 && video.videoHeight > 0);

// Throttle qilinmaydigan timer: worker mavjud bo'lmasa oddiy intervalga tushamiz.
const startTicker = (intervalMs, onTick) => {
  const workerCode = `let id; onmessage = (e) => {
    if (e.data && e.data.type === 'start') { clearInterval(id); id = setInterval(() => postMessage('tick'), e.data.interval); }
    else { clearInterval(id); }
  };`;
  try {
    const url = URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = onTick;
    worker.postMessage({ type: 'start', interval: intervalMs });
    return () => {
      try { worker.postMessage({ type: 'stop' }); worker.terminate(); } catch { /* ignore */ }
    };
  } catch {
    const id = setInterval(onTick, intervalMs);
    return () => clearInterval(id);
  }
};

// Kadrni cho'zmasdan, nisbatni saqlab canvas'ga joylaymiz (letterbox).
const drawContain = (ctx, video, width, height, mirror) => {
  const scale = Math.min(width / video.videoWidth, height / video.videoHeight);
  const w = video.videoWidth * scale;
  const h = video.videoHeight * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  if (!mirror) {
    ctx.drawImage(video, x, y, w, h);
    return;
  }
  ctx.save();
  ctx.translate(x + w, y);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
};

const drawPip = (ctx, video, width, height) => {
  const pipW = Math.round(width * PIP_WIDTH_RATIO);
  const pipH = Math.round(pipW * (video.videoHeight / video.videoWidth));
  const x = width - pipW - PIP_MARGIN;
  const y = height - pipH - PIP_MARGIN;
  ctx.save();
  ctx.translate(x + pipW, y);
  ctx.scale(-1, 1); // kamera ko'zgu holatida — skreenshotlardagi kabi
  ctx.drawImage(video, 0, 0, pipW, pipH);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, pipW, pipH);
};

/*
  getScreenVideo / getCameraVideo — <video> elementlarini QAYTARUVCHI funksiyalar
  (element o'rniga getter: ref yozuv davomida almashsa ham eng yangisi olinadi).
  audioTrack — mikrofon treki; u shu yerda TO'XTATILMAYDI, chunki uni kamera
  oqimi egasi boshqaradi.
*/
export const createCompositeRecordingStream = ({
  getScreenVideo,
  getCameraVideo,
  audioTrack = null,
  fps = DEFAULT_FPS,
  maxWidth = DEFAULT_MAX_WIDTH,
}) => {
  const screenAt = (typeof getScreenVideo === 'function') ? getScreenVideo : () => null;
  const cameraAt = (typeof getCameraVideo === 'function') ? getCameraVideo : () => null;

  const canvas = document.createElement('canvas');
  if (typeof canvas.captureStream !== 'function') return null;

  // O'lcham bir marta belgilanadi: yozuv o'rtasida canvas o'lchamini o'zgartirish
  // MediaRecorder uchun muammoli. Manba o'lchami keyin o'zgarsa — letterbox.
  const source = videoReady(screenAt()) ? screenAt() : (videoReady(cameraAt()) ? cameraAt() : null);
  const sourceW = source ? source.videoWidth : 1280;
  const sourceH = source ? source.videoHeight : 720;
  const scale = Math.min(1, maxWidth / sourceW);
  canvas.width = Math.max(2, Math.round(sourceW * scale));
  canvas.height = Math.max(2, Math.round(sourceH * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const draw = () => {
    const screenVideo = screenAt();
    const cameraVideo = cameraAt();
    const hasScreen = videoReady(screenVideo);
    const hasCamera = videoReady(cameraVideo);
    if (!hasScreen && !hasCamera) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (hasScreen) {
      drawContain(ctx, screenVideo, canvas.width, canvas.height, false);
      // Ekran ulashish to'xtagan bo'lsa ham kamera yozuvda qoladi.
      if (hasCamera) drawPip(ctx, cameraVideo, canvas.width, canvas.height);
    } else {
      drawContain(ctx, cameraVideo, canvas.width, canvas.height, true);
    }
  };

  draw(); // captureStream birinchi kadrsiz bo'sh trek bermasin
  const stream = canvas.captureStream(fps);
  const canvasTrack = stream.getVideoTracks()[0] || null;
  if (audioTrack) stream.addTrack(audioTrack);
  const stopTicker = startTicker(Math.max(40, Math.round(1000 / fps)), draw);

  return {
    stream,
    stop() {
      stopTicker();
      if (audioTrack) {
        // Mikrofon treki boshqa joyda ishlatiladi — oqimdan chiqaramiz, xolos.
        try { stream.removeTrack(audioTrack); } catch { /* ignore */ }
      }
      try { canvasTrack?.stop(); } catch { /* ignore */ }
    },
  };
};
