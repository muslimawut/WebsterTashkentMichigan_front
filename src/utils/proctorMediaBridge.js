let pendingMedia = null;
let releaseTimer = null;

const stopStream = (stream) => {
  stream?.getTracks?.().forEach((track) => track.stop());
};

const isLiveStream = (stream, kind) => Boolean(
  stream?.getTracks?.().some((track) => track.kind === kind && track.readyState === 'live')
);

export const handoffProctorMedia = ({ cameraStream, screenStream }) => {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = null;
  if (pendingMedia) {
    stopStream(pendingMedia.cameraStream);
    stopStream(pendingMedia.screenStream);
  }
  pendingMedia = { cameraStream, screenStream };
};

export const takeProctorMedia = () => {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = null;
  const media = pendingMedia;
  pendingMedia = null;
  if (!media) return null;
  return {
    cameraStream: isLiveStream(media.cameraStream, 'video') ? media.cameraStream : null,
    screenStream: isLiveStream(media.screenStream, 'video') ? media.screenStream : null,
  };
};

export const cancelProctorMediaRelease = () => {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = null;
};

// React StrictMode developmentda effect cleanup'ni bir marta sinov uchun ham
// ishlatadi. Kichik grace period remountga handoffni saqlab qoladi, real route
// exit bo'lsa esa kamera/screen-share ochiq qolib ketmaydi.
export const scheduleProctorMediaRelease = (delay = 1000) => {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (!pendingMedia) return;
    stopStream(pendingMedia.cameraStream);
    stopStream(pendingMedia.screenStream);
    pendingMedia = null;
  }, delay);
};
