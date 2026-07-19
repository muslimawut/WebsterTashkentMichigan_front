import Anthropic from '@anthropic-ai/sdk';

/*
  AI Proctor Agent — proctoring activity loglarni tahlil qiladi,
  cheating holatlarni ajratadi va umumiy xavf bahosini beradi.
  Anthropic modeli orqali event log va ekran snapshotlarini tahlil qiladi.

  ⚠️ XAVFSIZLIK: bu frontend ilova. VITE_ANTHROPIC_API_KEY brauzer bundle'iga
  kiradi va foydalanuvchilarga ko'rinadi. Productionда kalitni backend proxy
  ortiga o'tkazing (AI tahlilni server'da ishlating). dangerouslyAllowBrowser
  faqat shuning uchun yoqilgan.
*/

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const MODEL_NAME = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-opus-4-8';
const MAX_EVENT_GROUPS = 30;

let client = null;
if (apiKey) {
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

const SYSTEM_INSTRUCTION = `You are an AI EXAM PROCTOR that reviews a remote proctoring event log and decides whether the student was cheating.

The exam is taken on an external site (Cambridge Metrica); monitoring happens on our page via camera, full-screen sharing, and AI detection (gaze/eyes, head pose, hands, multiple faces). Each log entry has a timestamp, severity (info/warning) and a message.

EVENT TYPES you will see:
- gaze_away / gaze_away_long / gaze_away_count : the student looked away from the screen (eyes/head). Short and rare = usually benign (thinking). Long (20s+) or frequent (repeated) = suspicious.
- second_face : another person's face appeared on camera. Strong cheating signal.
- tab_switch / window_blur / exam_tab_closed : the student left the exam page / switched to another tab, app, or screen. Strong signal, especially repeated.
- fullscreen_exit : left full screen. Moderate signal.
- hand_raised : hand raised near face — could be normal or reaching for a phone; weigh with context.
- camera_disconnected / screen_share_stopped : monitoring was interrupted — serious (possible evasion).
- snapshot / clip / Periodic snapshot / session_started / calibrated / camera_reconnected : neutral, NOT cheating by themselves.

JUDGEMENT RULES:
- Distinguish GENUINE cheating incidents from benign noise. Do not flag isolated brief look-aways or routine monitoring/system events.
- Weight by severity, frequency, duration and clustering (many warnings close in time = higher risk).
- Repeated tab/app switching, another person, or interrupted monitoring are the strongest indicators.
- Keep "incidents" limited to genuine cheating-relevant items (max 8). If nothing suspicious, return riskLevel "low", empty incidents, and a summary saying monitoring looks clean.
- "recommendation" is what the human proctor should do next.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
    riskScore: { type: 'integer' },
    verdict: { type: 'string' },
    summary: { type: 'string' },
    incidents: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          count: { type: 'integer' },
          reason: { type: 'string' },
          time: { type: 'string' },
        },
        required: ['type', 'severity', 'count', 'reason', 'time'],
      },
    },
    recommendation: { type: 'string' },
  },
  required: ['riskLevel', 'riskScore', 'verdict', 'summary', 'incidents', 'recommendation'],
};

export const isAiProctorAvailable = () => !!client;

// Bir xil warning'larni alohida-alohida yubormaymiz. Type/message bo'yicha
// birlashtirish input tokenlarini kamaytiradi, count va vaqt oralig'i esa AI
// uchun cheating chastotasini saqlab qoladi.
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
    .slice(0, MAX_EVENT_GROUPS)
    .map((event) => {
      const range = event.first && event.last && event.first !== event.last
        ? `${event.first}..${event.last}`
        : (event.last || event.first || '');
      return `[${range}] ${event.type} x${event.count}: ${event.message}`;
    });
};

export const analyzeProctoringSession = async ({ events = [], meta = {} }) => {
  if (!client) return null;
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
    const res = await client.messages.create({
      model: MODEL_NAME,
      max_tokens: 900,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
    });

    // Javob bloklaridan matn (JSON) blokini olamiz (thinking blokini emas)
    const textBlock = res.content.find((b) => b.type === 'text');
    if (!textBlock) return null;
    const parsed = JSON.parse(textBlock.text);

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
    console.error('AI Proctor (Claude) error:', err);
    return null;
  }
};

/* ── VISION: ruxsat etilgan tab rasmlariga qarab tab-almashishni aniqlash ──
   references = ruxsat etilgan sahifalarning namuna rasmlari (dataURL/URL).
   snapshots = student ekranidan olingan snapshotlar ({time, image}).
   Har snapshot ruxsat etilgan sahifami yoki boshqa tab/saytmi — AI hal qiladi. */

const toImageBlock = (src) => {
  if (!src) return null;
  if (src.startsWith('data:')) {
    const m = /^data:(image\/\w+);base64,(.+)$/.exec(src);
    return m ? { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } } : null;
  }
  if (/^https?:\/\//.test(src)) return { type: 'image', source: { type: 'url', url: src } };
  return null;
};

// 1920px screenshotlarni modelga o'z holicha yuborish juda ko'p image token
// sarflaydi. Tab/app identifikatsiyasi uchun 1024×768 yetarli.
const shrinkImage = (src, maxW = 1024, maxH = 768) => {
  if (!src?.startsWith?.('data:image/')) return Promise.resolve(src);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
      if (scale >= 1) { resolve(src); return; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

const SCREEN_SYSTEM = `You are an AI exam proctor doing VISUAL page/tab verification.

You are given ALLOWED reference screenshots — the only pages the student is permitted to be on (e.g. the Cambridge Metrica exam page and the MEPT proctoring page). Then you are given the student's actual SCREEN snapshots captured during the exam.

For EACH student snapshot, decide: does it show one of the ALLOWED pages, or a DIFFERENT website / application / tab (a search engine, ChatGPT/AI chat, notes, messenger, another website, a document, a phone screen, etc.)? A different page = CHEATING.

Rules:
- Compare the SITE/APP identity (layout, header, domain, branding), NOT small differences like scroll position, a changed exam question, or cursor.
- If a snapshot clearly shows the allowed exam/proctoring page → not flagged.
- If it shows anything else, or the exam page is not visible (another app on top) → flag it.
- If unsure, lower the risk but still note it.

Return ONLY JSON.`;

const SCREEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
    verdict: { type: 'string' },
    summary: { type: 'string' },
    flagged: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          index: { type: 'integer' },
          time: { type: 'string' },
          page: { type: 'string' },   // AI ko'rgan sahifa (masalan "Google search", "ChatGPT")
          reason: { type: 'string' },
        },
        required: ['index', 'time', 'page', 'reason'],
      },
    },
  },
  required: ['riskLevel', 'verdict', 'summary', 'flagged'],
};

export const analyzeScreens = async ({ references = [], snapshots = [], meta = {} }) => {
  if (!client) return null;
  if (!references.length || !snapshots.length) return null;

  const content = [];
  content.push({ type: 'text', text: 'ALLOWED reference pages — the student may ONLY be on pages that look like these:' });
  const preparedRefs = await Promise.all(references.slice(0, 2).map((src) => shrinkImage(src)));
  preparedRefs.forEach((src, i) => {
    const b = toImageBlock(src);
    if (b) { content.push({ type: 'text', text: `Allowed reference #${i + 1}:` }); content.push(b); }
  });

  const shots = snapshots.slice(0, 4); // vision tokenlari qimmat: eng so'nggi 4 kadr yetarli
  const preparedShots = await Promise.all(shots.map(async (shot) => ({
    time: shot?.time || '',
    image: await shrinkImage(shot?.image || shot),
  })));
  content.push({ type: 'text', text: `Now the student's screen snapshots during the exam (session ${JSON.stringify(meta)}). Judge each by index:` });
  preparedShots.forEach((s, i) => {
    const b = toImageBlock(s.image || s);
    if (b) { content.push({ type: 'text', text: `Snapshot index ${i}, time ${s.time || ''}:` }); content.push(b); }
  });
  content.push({ type: 'text', text: 'Return the JSON verdict. "flagged" = snapshots that are NOT an allowed page (cheating).' });

  try {
    const res = await client.messages.create({
      model: MODEL_NAME,
      max_tokens: 700,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCREEN_SCHEMA } },
      system: SCREEN_SYSTEM,
      messages: [{ role: 'user', content }],
    });
    const textBlock = res.content.find((b) => b.type === 'text');
    if (!textBlock) return null;
    const parsed = JSON.parse(textBlock.text);
    return {
      riskLevel: parsed.riskLevel || 'low',
      verdict: parsed.verdict || '',
      summary: parsed.summary || '',
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      at: new Date(),
    };
  } catch (err) {
    console.error('AI Proctor vision error:', err);
    return null;
  }
};
