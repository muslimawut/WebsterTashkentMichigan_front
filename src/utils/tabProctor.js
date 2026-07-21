import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_TAB_PROCTOR_API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL_NAME = 'gemini-2.5-flash';

export const isAiProctorAvailable = () => !!ai;

// 1. Log / tab voqealarni tahlil qilish
const SESSION_INSTRUCTION = `You are an AI EXAM PROCTOR that reviews a remote proctoring event log and decides whether the student was cheating.

The exam is taken on an external site; monitoring happens on our page via camera, full-screen sharing, and AI detection (gaze/eyes, head pose, hands, multiple faces). Each log entry has a timestamp, severity (info/warning) and a message.

EVENT TYPES you will see:
- gaze_away_long : sustained look-away for about 10 seconds. Cheating evidence.
- gaze_away_pattern : repeated glances in the same direction over a 1-2 minute pattern. Cheating evidence.
- gaze_side_to_side : repeated side-to-side eye movement sustained as a 2+ minute pattern. Cheating evidence.
- face_turned_away / no_face_long : face was turned away or absent continuously for about 30 seconds. Strong cheating signal.
- second_face : another person's face appeared on camera. Strong cheating signal.
- tab_switch / window_blur / exam_tab_closed : the student left the exam page / switched to another tab, app, or screen. Strong signal, especially repeated.
- fullscreen_exit : left full screen. Moderate signal.
- hand_raised : hand raised near face — could be normal or reaching for a phone; weigh with context.
- camera_disconnected / screen_share_stopped : monitoring was interrupted — serious (possible evasion).
- snapshot / clip / session_started / calibrated / camera_reconnected : neutral, NOT cheating by themselves.

JUDGEMENT RULES:
- Distinguish GENUINE cheating incidents from benign noise. Do not flag isolated brief look-aways or routine monitoring/system events.
- Weight by severity, frequency, duration and clustering.
- Repeated tab/app switching, another person, or interrupted monitoring are the strongest indicators.
- Keep "incidents" limited to genuine cheating-relevant items (max 8). If nothing suspicious, return riskLevel "low", empty incidents, and a summary saying monitoring looks clean.
- "recommendation" is what the human proctor should do next.

You must respond ONLY with a JSON object. No markdown, no markdown formatting.
Schema:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": number (0-100),
  "verdict": "string",
  "summary": "string",
  "incidents": [
    { "type": "string", "severity": "low" | "medium" | "high", "count": number, "reason": "string", "time": "string" }
  ],
  "recommendation": "string"
}`;

const compactEvents = (events) => {
  const groups = new Map();
  events
    .filter((event) => event?.severity === 'warning')
    .forEach((event) => {
      const type = event.type || 'warning';
      const message = String(event.message || '').slice(0, 180);
      const key = `${type}\u0000${message}`;
      const time = event.time || '';
      const current = groups.get(key);
      if (current) {
        current.count += 1;
        current.first = time || current.first;
      } else {
        groups.set(key, { type, message, count: 1, first: time, last: time });
      }
    });

  return [...groups.values()]
    .slice(0, 30)
    .map((event) => {
      const range = event.first && event.last && event.first !== event.last
        ? `${event.first}..${event.last}`
        : (event.last || event.first || '');
      return `[${range}] ${event.type} x${event.count}: ${event.message}`;
    });
};

export const analyzeProctoringSession = async ({ events = [], meta = {} }) => {
  if (!ai) return null;
  if (!events.length) {
    return { riskLevel: 'low', riskScore: 0, verdict: 'No activity yet.', summary: 'No events recorded yet.', incidents: [], recommendation: 'Keep monitoring.', at: new Date() };
  }

  const compactLog = compactEvents(events);
  if (!compactLog.length) {
    return { riskLevel: 'low', riskScore: 0, verdict: 'No suspicious activity.', summary: 'No warning events were recorded.', incidents: [], recommendation: 'No action needed.', at: new Date() };
  }

  const prompt = `SESSION META: ${JSON.stringify(meta)}
TOTAL EVENTS: ${events.length}
WARNING GROUPS: ${compactLog.length}

COMPACT WARNING LOG (newest first):
${compactLog.join('\n')}

Analyze the log and return the JSON verdict.`;

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: [{ role: 'user', parts: [{ text: SESSION_INSTRUCTION }] }, { role: 'model', parts: [{ text: 'Understood. I will respond with only JSON.' }] }]
    });

    const res = await chat.sendMessage({ message: prompt });
    const text = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    return {
      riskLevel: parsed.riskLevel || 'low',
      riskScore: Number.isFinite(parsed.riskScore) ? parsed.riskScore : 0,
      verdict: parsed.verdict || '',
      summary: parsed.summary || '',
      incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
      recommendation: parsed.recommendation || '',
      at: new Date(),
    };
  } catch (err) {
    console.error('TabProctor Session Error:', err);
    return null;
  }
};

// 2. Vision: ruxsat etilgan tab rasmlariga qarab tahlil qilish

// Metrica sessiyasi uchun ruxsat etilgan sahifa identiteti.
const METRICA_IDENTITY = `- For Cambridge Metrica, question text, answer choices, reading passages, question numbers, section labels, selected answers, remaining time, scroll position and expanded/collapsed panels can all change and MUST be ignored.
- Treat a page as allowed when the stable Metrica identity remains: metrica.cambridgemichigan.org, Content Player chrome, dark exam header/navigation, and the same general exam-shell structure. Grammar, listening and reading layouts may differ from one another and are all allowed when they remain inside that Metrica exam shell.`;

// Writing sessiyasi — imtihon BIZNING o'zimizning sahifamizda (protoring.netlify.app/writing-test) topshiriladi.
const WRITING_IDENTITY = `- This is the MEPT Writing test page, served from protoring.netlify.app (our OWN exam page). It IS an allowed page — NEVER treat it as an external site, an "external essay submission platform", or cheating.
- Allowed Writing identity: a light/white page headed "Your Essay" with the helper line "Write your essay below. Copy and paste are disabled.", a large single essay text area, a blue "Submit Essay" button, a top progress timeline ("Start … 60 minutes"), a dark announcement bar across the very top, and a camera picture-in-picture. Any snapshot with this layout is ALLOWED.
- The essay text the student types, the amount of text, the remaining time and the scroll position all change constantly and MUST be ignored.
- The domain protoring.netlify.app and the "Your Essay" editor ARE the exam itself. Only flag when a genuinely different site/app is shown (search engine, ChatGPT/AI chat, notes, messenger, another document, a phone screen, etc.).`;

const buildScreenSystem = (kind) => `You are an AI exam proctor doing VISUAL page/tab verification.

You are given ALLOWED reference screenshots — the only pages the student is permitted to be on. Then you are given the student's actual SCREEN snapshots captured during the exam.

For EACH student snapshot, decide: does it show one of the ALLOWED pages, or a DIFFERENT website / application / tab (a search engine, ChatGPT/AI chat, notes, messenger, another website, a document, a phone screen, etc.)? A different page = CHEATING.

Rules:
- ALLOWED references are layout/identity examples, NOT exact-content templates.
${kind === 'writing' ? WRITING_IDENTITY : METRICA_IDENTITY}
- Ignore camera picture-in-picture, screen-sharing banners, browser tabs, cursor position and minor responsive/layout shifts when deciding whether the underlying exam page is allowed.
- Compare the SITE/APP identity (stable layout, header, domain and branding), never the exact exam question content.
- If a snapshot clearly shows the allowed page → not flagged.
- If it shows anything else, or the exam page is not visible (another app on top) → flag it.
- YouTube, ChatGPT, search engines, social/video sites and developer tools are violations unless that exact site is visibly present in an ALLOWED reference.
- Inspect EVERY supplied snapshot index. Do not omit a snapshot merely because nearby screenshots look similar.
- If unsure, lower the risk but still note it.

You must respond ONLY with a JSON object. No markdown formatting.
Schema:
{
  "riskLevel": "low" | "medium" | "high",
  "verdict": "string",
  "summary": "string",
  "flagged": [
    { "index": number, "time": "string", "page": "string", "reason": "string" }
  ]
}`;

const shrinkImage = (src, maxW = 1024, maxH = 768) => {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(value);
    };
    const timeout = setTimeout(() => finish(null), 12000);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        finish(src.startsWith('data:') ? src : null);
      }
    };
    img.onerror = () => finish(src.startsWith('data:') ? src : null);
    img.src = src;
  });
};

const isPublicImageUrl = (value) => {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'https:'; }
  catch { return false; }
};

const imageMimeType = (value) => {
  const path = String(value || '').toLowerCase().split('?')[0];
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.bmp')) return 'image/bmp';
  return 'image/jpeg';
};

const selectEvenly = (items, limit) => {
  if (items.length <= limit) return items;
  return Array.from({ length: limit }, (_, index) => (
    items[Math.round((index * (items.length - 1)) / (limit - 1))]
  ));
};

// 8x8 difference-hash: ketma-ket bir xil sahifa kadrlarini modelga qayta-qayta
// yubormaymiz, lekin YouTube/ChatGPT kabi vizual boshqa sahifalarni saqlab qolamiz.
const imageFingerprint = (src) => new Promise((resolve) => {
  const img = new Image();
  const timeout = setTimeout(() => resolve(null), 5000);
  img.onload = () => {
    try {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      canvas.width = 9;
      canvas.height = 8;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 9, 8);
      const pixels = ctx.getImageData(0, 0, 9, 8).data;
      let hash = '';
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          const left = (y * 9 + x) * 4;
          const right = left + 4;
          const leftLum = pixels[left] * 0.299 + pixels[left + 1] * 0.587 + pixels[left + 2] * 0.114;
          const rightLum = pixels[right] * 0.299 + pixels[right + 1] * 0.587 + pixels[right + 2] * 0.114;
          hash += leftLum > rightLum ? '1' : '0';
        }
      }
      resolve(hash);
    } catch { resolve(null); }
  };
  img.onerror = () => { clearTimeout(timeout); resolve(null); };
  img.src = src;
});

const hashDistance = (a, b) => {
  if (!a || !b || a.length !== b.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) distance += 1;
  return distance;
};

export const analyzeScreens = async ({ references = [], snapshots = [], meta = {}, kind = 'metrica' }) => {
  if (!ai) return null;
  if (!references.length || !snapshots.length) return null;

  try {
    const contents = [];
    contents.push({
      text: kind === 'writing'
        ? 'This is a Writing test. The allowed page is the MEPT "Your Essay" editor on protoring.netlify.app. Reference images below show other allowed exam pages; the Writing editor is allowed even if it is not among them:'
        : 'ALLOWED reference pages — the student may ONLY be on pages that look like these:',
    });
    
    // Grammar, reading va boshqa Metrica layoutlari bir-biridan ancha farq qiladi;
    // barcha bundled namunalardan foydalanamiz (UI uploadlari bilan jami 6 tagacha).
    const preparedRefs = (await Promise.all(references.slice(0, 6).map((src) => shrinkImage(src))))
      .filter((src) => src?.startsWith('data:image/'));
    if (!preparedRefs.length) {
      return { error: 'Allowed-page reference images could not be loaded. Please reload and try again.' };
    }
    preparedRefs.forEach((src, i) => {
      if (src && src.startsWith('data:image/')) {
        const mimeType = src.substring(5, src.indexOf(';'));
        const base64Data = src.substring(src.indexOf(',') + 1);
        contents.push({ text: `Allowed reference #${i + 1}:` });
        contents.push({ inlineData: { data: base64Data, mimeType: mimeType } });
      }
    });

    const candidateShots = snapshots.slice(0, 60);
    contents.push({ text: `Now the student's screen snapshots during the exam (session ${JSON.stringify(meta)}). Judge each by index:` });

    const preparedShots = [];
    const fingerprints = [];
    // 8 tadan parallel tayyorlaymiz: uzoq sessiyada UI juda sekinlashib qolmaydi.
    for (let offset = 0; offset < candidateShots.length; offset += 8) {
      const batch = candidateShots.slice(offset, offset + 8);
      const processedBatch = await Promise.all(
        batch.map((shot) => {
          const source = shot?.image || shot;
          // Public backend URL'ni browserda canvas qilish CORS sabab bloklanadi.
          // Uni keyin Gemini fileData orqali server-side yuklatamiz.
          return isPublicImageUrl(source) ? Promise.resolve(null) : shrinkImage(source, 768, 576);
        })
      );
      for (let j = 0; j < processedBatch.length; j += 1) {
        const processed = processedBatch[j];
        const source = batch[j]?.image || batch[j];
        if (!processed?.startsWith('data:image/')) {
          if (isPublicImageUrl(source)) {
            preparedShots.push({
              originalIndex: offset + j,
              time: batch[j]?.time || '',
              remoteUrl: source,
            });
          }
          continue;
        }
        const fingerprint = await imageFingerprint(processed);
        const duplicate = fingerprint && fingerprints.some((known) => hashDistance(known, fingerprint) <= 8);
        if (duplicate) continue;
        if (fingerprint) fingerprints.push(fingerprint);
        preparedShots.push({
          originalIndex: offset + j,
          time: batch[j]?.time || '',
          image: processed,
        });
      }
    }

    // Bitta manual check uchun tokenni nazoratda ushlab, 16 ta vizual turli sahifa.
    // Remote URL'lar vizual hash qilinmaydi; timeline bo'ylab teng tanlash eskiroq
    // YouTube/ChatGPT kadrlarini faqat eng yangi screenshotlar bosib ketishidan saqlaydi.
    const submitted = selectEvenly(preparedShots, 16);
    submitted.forEach((shot) => {
      contents.push({ text: `Snapshot index ${shot.originalIndex}, time ${shot.time}:` });
      if (shot.image) {
        const mimeType = shot.image.substring(5, shot.image.indexOf(';'));
        const base64Data = shot.image.substring(shot.image.indexOf(',') + 1);
        contents.push({ inlineData: { data: base64Data, mimeType } });
      } else {
        contents.push({ fileData: { fileUri: shot.remoteUrl, mimeType: imageMimeType(shot.remoteUrl) } });
      }
    });

    // Rasm yuklanmasa modelga so'rov bermaymiz: aks holda u noto'g'ri LOW RISK
    // va "No student screen snapshots" javobini qaytaradi.
    if (!submitted.length) {
      return { error: 'Student screenshots could not be loaded for analysis. Reload the session and try again.' };
    }

    contents.push({ text: 'Return the JSON verdict. "flagged" = snapshots that are NOT an allowed page (cheating).' });

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: [{ role: 'user', parts: [{ text: buildScreenSystem(kind) }] }, { role: 'model', parts: [{ text: 'Understood. I will respond with only JSON.' }] }]
    });

    const res = await chat.sendMessage({ message: contents });
    const text = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    const um = res.usageMetadata || {};
    const usage = {
      prompt: um.promptTokenCount || 0,
      output: um.candidatesTokenCount || 0,
      total: um.totalTokenCount || ((um.promptTokenCount || 0) + (um.candidatesTokenCount || 0)),
    };

    return {
      riskLevel: parsed.riskLevel || 'low',
      verdict: parsed.verdict || '',
      summary: parsed.summary || '',
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      analyzedCount: submitted.length,
      usage,
      at: new Date(),
    };
  } catch (err) {
    console.error('TabProctor vision error:', err);
    return null;
  }
};
