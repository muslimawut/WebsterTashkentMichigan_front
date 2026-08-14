/*
  Proctoring media (skreenshot / video-klip) yuklash navbati va sog'liq nazorati.

  Muammo: skreenshot va klip POST'lari "fire-and-forget" edi — sekin yoki band
  uplinkda ular osilib qolar, tab yopilganda esa bekor bo'lar edi. Xatolar jim
  yutilgani uchun na student, na proctor buni ko'rmasdi. Natijada 111 hodisali
  sessiyada atigi 2 ta rasm serverga yetib borgan, qolgan dalil yo'qolgan.

  Bu modul uch narsani beradi:
    1. NAVBAT — bir vaqtda ko'pi bilan MAX_PARALLEL yuklash. Brauzerning host
       bo'yicha 6 ta ulanish limiti tiqilib qolmaydi va event loglari (kichik
       JSON) media yuklash orqasida navbatda qolib ketmaydi.
    2. RETRY — vaqtinchalik xatolar (tarmoq uzilishi, timeout, 5xx, 429) uchun
       backoff bilan qayta urinish; offline bo'lsa tarmoq qaytguncha kutish.
    3. HISOBOT — butunlay muvaffaqiyatsiz yuklash activity log'ga tushadi, ya'ni
       proctor "dalil yo'q" bilan "dalil yuklanmadi"ni ajrata oladi.
*/

const MAX_PARALLEL = 2;
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [2000, 6000, 15000];
const OFFLINE_WAIT_MS = 20000;

// Navbat cheksiz o'smasligi kerak: sekin kanalda kadrlar yuklanishidan tez
// to'planadi va xotirani (dataURL/Blob) yeb qo'yadi. Limitga yetganda eng eski
// element chiqarib tashlanadi — lekin cheating dalili (evidence) davriy
// kadrdan ancha uzoq saqlanadi, klip esa og'ir bo'lgani uchun kamroq.
const QUEUE_LIMITS = {
  'screenshot:routine': 12,
  'screenshot:evidence': 40,
  'clip:routine': 4,
  'clip:evidence': 10,
};
const DEFAULT_QUEUE_LIMIT = 12;

const queue = [];
let running = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Bir vaqtda ko'p klient qayta urinmasligi uchun ±30% tasodifiy og'ish.
const jitter = (ms) => Math.round(ms * (0.7 + Math.random() * 0.6));

// Tarmoq xatosi, timeout, 5xx va 429 — vaqtinchalik. Qolgan 4xx (validatsiya,
// 404, 413) qayta urinishdan tuzalmaydi, darhol xato deb belgilanadi.
export const isRetriableUploadError = (error) => {
  const status = error?.status;
  if (!status) return true;
  if (status === 408 || status === 425 || status === 429) return true;
  return status >= 500;
};

const waitForOnline = async () => {
  if (typeof navigator === 'undefined' || navigator.onLine !== false) return;
  await new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('online', done);
      resolve();
    };
    const timer = setTimeout(done, OFFLINE_WAIT_MS);
    window.addEventListener('online', done);
  });
};

const pump = () => {
  while (running < MAX_PARALLEL && queue.length) {
    const task = queue.shift();
    running += 1;
    task.run().finally(() => {
      running -= 1;
      pump();
    });
  }
};

const enforceLimit = (kind, priority) => {
  const limit = QUEUE_LIMITS[`${kind}:${priority}`] ?? DEFAULT_QUEUE_LIMIT;
  const sameGroup = queue.filter((task) => task.kind === kind && task.priority === priority);
  for (let i = 0; i <= sameGroup.length - limit; i += 1) {
    const victim = sameGroup[i];
    const index = queue.indexOf(victim);
    if (index >= 0) queue.splice(index, 1);
    victim.drop();
  }
};

/*
  Media yuklashni navbatga qo'yadi. Promise HAR DOIM resolve bo'ladi:
  { ok, kind, attempts, dropped?, error? }. Chaqiruvchi finish oqimida shu
  promise'ni kutadi, shuning uchun u reject qilmasligi kerak.
*/
export const queueMediaUpload = ({ kind = 'screenshot', priority = 'routine', upload, onFailure }) => (
  new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (!result.ok) {
        try { onFailure?.(result); } catch { /* hisobot yuklashni to'xtatmaydi */ }
      }
      resolve(result);
    };

    const task = {
      kind,
      priority,
      drop: () => finish({
        ok: false,
        kind,
        dropped: true,
        attempts: 0,
        error: new Error('upload queue is full'),
      }),
      run: async () => {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          await waitForOnline();
          try {
            const data = await upload();
            finish({ ok: true, kind, attempts: attempt, data });
            return;
          } catch (error) {
            if (attempt === MAX_ATTEMPTS || !isRetriableUploadError(error)) {
              finish({ ok: false, kind, attempts: attempt, error });
              return;
            }
            await sleep(jitter(RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]));
          }
        }
      },
    };

    enforceLimit(kind, priority);
    queue.push(task);
    pump();
  })
);

/* ── Yuklash xatolari haqida hisobot ─────────────────────────────
   Sekin kanalda o'nlab kadr ketma-ket yiqilishi mumkin — har biriga alohida
   event yozsak activity log ishlatib bo'lmas holga keladi. Shuning uchun
   xatolar bir daqiqalik oynada yig'iladi va bitta umumiy event bo'lib chiqadi.
*/
const FAILURE_REPORT_COOLDOWN_MS = 60000;

const failureLabel = (kind, count) => (
  kind === 'clip'
    ? `${count} video clip${count === 1 ? '' : 's'}`
    : `${count} screenshot${count === 1 ? '' : 's'}`
);

const failureReason = (result) => {
  if (result?.dropped) return 'upload queue overflow — connection too slow';
  if (result?.error?.timeout) return 'upload timed out';
  return result?.error?.message || 'network error';
};

export const createUploadFailureReporter = (logEvent) => {
  const pending = { screenshot: 0, clip: 0 };
  const reasons = { screenshot: '', clip: '' };
  let lastReportAt = 0;
  let timer = null;

  const emit = (kind, type) => {
    const count = pending[kind];
    if (!count) return;
    pending[kind] = 0;
    logEvent(
      type,
      `${failureLabel(kind, count)} could not be uploaded (${reasons[kind]}) — this evidence is missing from the session.`,
      'info'
    );
  };

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!pending.screenshot && !pending.clip) return;
    lastReportAt = Date.now();
    emit('screenshot', 'screenshot_upload_failed');
    emit('clip', 'clip_upload_failed');
  };

  return {
    note(kind, result) {
      const bucket = kind === 'clip' ? 'clip' : 'screenshot';
      pending[bucket] += 1;
      reasons[bucket] = failureReason(result);
      const sinceLast = Date.now() - lastReportAt;
      if (sinceLast >= FAILURE_REPORT_COOLDOWN_MS) {
        flush();
        return;
      }
      if (!timer) timer = setTimeout(flush, FAILURE_REPORT_COOLDOWN_MS - sinceLast);
    },
    flush,
  };
};

/* ── Kadr olish sog'lig'i (throttle aniqlash) ────────────────────
   Brauzer fon tabini "intensive throttling" bilan sekinlashtirsa yoki qurilma
   band bo'lsa, davriy snapshot 6-15s o'rniga 2 daqiqada bir marta olinadi —
   ya'ni monitoring amalda ishlamay qoladi. Buni faqat log oralig'iga qarab
   keyin aniqlash mumkin edi; endi student sessiyasining o'zi xabar beradi.
*/
const THROTTLE_FACTOR = 3;          // kutilgan oraliqdan shuncha marta katta
const THROTTLE_MIN_GAP_MS = 25000;  // va kamida shuncha — kichik tebranish emas
const THROTTLE_REPORT_COOLDOWN_MS = 300000;

export const createCaptureHealthMonitor = (logEvent) => {
  let lastTickAt = 0;
  let lastReportAt = 0;
  let delayedTicks = 0;

  return {
    tick(expectedIntervalMs) {
      const now = Date.now();
      const previous = lastTickAt;
      lastTickAt = now;
      if (!previous || !expectedIntervalMs) return;

      const gap = now - previous;
      if (gap < THROTTLE_MIN_GAP_MS || gap < expectedIntervalMs * THROTTLE_FACTOR) return;

      delayedTicks += 1;
      if (now - lastReportAt < THROTTLE_REPORT_COOLDOWN_MS) return;
      lastReportAt = now;
      const actual = Math.round(gap / 1000);
      const expected = Math.round(expectedIntervalMs / 1000);
      const count = delayedTicks;
      delayedTicks = 0;
      logEvent(
        'capture_throttled',
        `Screen monitoring is running slowly: the last snapshot took ${actual}s instead of ${expected}s (${count} delayed snapshot${count === 1 ? '' : 's'}). The student's browser tab is throttled or the device is overloaded, so periods of the exam may be uncovered.`,
        'info'
      );
    },
    reset() {
      lastTickAt = 0;
      lastReportAt = 0;
      delayedTicks = 0;
    },
  };
};
