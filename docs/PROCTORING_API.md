# Proctoring API — Backend Specification

Frontend: `src/api/api.js` (`proctor*` methods), `src/components/ProctoringExam.jsx` (student), `src/components/ProctorMonitor.jsx` (proctor), `src/utils/aiProctor.js` (AI review).

- **Base URL:** `VITE_API_BASE_URL` (all paths below are relative to it).
- **Auth:** these endpoints are currently called with `skipAuth: true` (no Bearer token). The student is identified by `full_name` + `passport_id`. Add auth later if needed.
- **CSRF:** the axios layer attaches `X-CSRFToken` on POST/PUT/PATCH/DELETE if a `csrftoken` cookie exists. Django: keep CSRF or exempt these routes.
- **CORS (required):** the frontend runs on a different origin than the API (dev: `http://localhost:5173` → `http://127.0.0.1:8000`). Without CORS headers the browser blocks every call (`No 'Access-Control-Allow-Origin' header`). Configure it — see the CORS section at the bottom.
- **Content-Type:** JSON everywhere **except** the clip upload (multipart/form-data).
- **Timestamps:** frontend sends `client_time` as ISO-8601 UTC (browser clock — don't trust for security, keep your own `created_at` server-side).

---

## 1. Start session

`POST /proctoring/sessions/start`

Called after the camera check passes, before the exam opens.

**Request**
```json
{
  "full_name": "Ali Valiyev",
  "passport_id": "AD7113185",
  "exam_url": "https://metrica.cambridgemichigan.org/metrica/"
}
```

**Response 201**
```json
{
  "session_id": "sesn_9f2c1a",
  "status": "active",
  "created_at": "2026-07-18T09:12:00Z"
}
```

> Frontend reads the id as `session_id` **or** `id` **or** `data.session_id` — return any one (`session_id` preferred). If this call fails, the frontend falls back to a local id and keeps running, so a non-2xx won't crash the exam — but then screenshots/events won't be linked. Return 2xx.

---

## 2. Log an event (activity log)

`POST /proctoring/sessions/{session_id}/events`

Called on every monitoring event (fire-and-forget; frontend ignores the response body).

**Request**
```json
{
  "event_id": "evt_1752830415000_a1b2c",
  "type": "tab_switch",
  "message": "Switched to another tab / window hidden",
  "severity": "warning",
  "client_time": "2026-07-18T09:20:15.123Z"
}
```

**Response 200/201** — body ignored. Return `{ "ok": true }`.

> **`event_id`** — for **cheating** events (gaze_away, second_face, tab_switch, window_blur, fullscreen_exit, exam_tab_closed, hand_raised, …) the frontend sends a stable `event_id`, and the **same id** is sent on the matching screenshot (§3) and clip (§4). Store it and use it to attach the screenshot/clip URLs back onto this event row (see §7). Non-cheating/info events may send `event_id: null` — that's fine.

**`severity`:** `"info"` or `"warning"`. Count `warning` events for the warnings total.

**`type` values the frontend emits** (store as-is; the AI + UI understand them):

| type | severity | meaning |
|---|---|---|
| `session_started` | info | session began |
| `ai_detection_ready` | info | AI (hand+face) loaded |
| `gaze_calibrated` | info | eye calibration confirmed |
| `exam_opened` / `exam_reopened` | info | Metrica tab opened |
| `exam_open_blocked` | warning | browser blocked the tab |
| `camera_reconnected` / `fullscreen_enter` / `tab_return` | info | benign recoveries |
| `camera_disconnected` | warning | camera lost |
| `screen_share_stopped` | warning | screen sharing stopped |
| `tab_switch` | warning | left the tab / window hidden |
| `window_blur` | warning | switched to another app/window/screen |
| `fullscreen_exit` | warning | left fullscreen |
| `exam_tab_closed` | warning | Metrica tab closed |
| `hand_raised` | warning | hand raised near face (suspicious) |
| `gaze_away` | warning | looked away ~3s (suspicious) |
| `gaze_away_long` | warning | looked away 20s+ (cheating) |
| `gaze_away_count` | warning | looked away many times (cheating) |
| `second_face` | warning | a second person's face detected (cheating) |
| `snapshot` | warning | event snapshot taken |
| `clip` | info | screen clip recorded |

---

## 3. Upload screenshot (JSON base64)

`POST /proctoring/sessions/{session_id}/screenshot`

Screen + camera composite, JPEG.

**Request**
```json
{
  "event_id": "evt_1752830416400_x9y8z",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "reason": "Looked away from screen — suspicious",
  "client_time": "2026-07-18T09:20:16.400Z"
}
```

> **`event_id`** links this screenshot to the cheating event of the same id (§2). Store the file, then set `image_url` on the matching event row. `image` is a full data URL (`data:image/jpeg;base64,....`). Strip the `data:...;base64,` prefix before decoding. Typical size ~200–400 KB. Store the file (S3/disk) and keep a URL. Periodic snapshots (`reason: "Periodic snapshot"`) arrive every ~8s; event snapshots on cheating.

**Response 201**
```json
{ "id": "shot_01", "url": "https://cdn.example.com/proctor/sesn_9f2c1a/shot_01.jpg" }
```

**Recommended:** also append an event so it shows in the activity log — either create an `events` row of `type: "screenshot"` with the image URL, or attach the URL to the nearest event. See §7 for how the monitor reads images.

---

## 4. Upload clip (multipart)

`POST /proctoring/sessions/{session_id}/clip`

Short screen recording (~8s webm) taken at suspicious moments.

**Request — `multipart/form-data`**
| field | type | example |
|---|---|---|
| `clip` | file | `clip-1752830416.webm` (video/webm) |
| `event_id` | text | `evt_1752830416400_x9y8z` (links to the cheating event; set `clip_url` on that event row) |
| `reason` | text | `Second person detected (2 faces) — cheating` |
| `client_time` | text | `2026-07-18T09:20:18.900Z` |

**Response 201**
```json
{ "id": "clip_01", "url": "https://cdn.example.com/proctor/sesn_9f2c1a/clip_01.webm" }
```

> ~1.5 MB each. Store and keep a URL. Set an upload size limit (e.g. 10 MB) to be safe.

---

## 5. Finish session

`POST /proctoring/sessions/{session_id}/finish`

**Request**
```json
{ "warnings": 7 }
```

**Response 200**
```json
{ "status": "completed", "finished_at": "2026-07-18T10:15:00Z", "warnings": 7 }
```

---

## 6. List sessions (proctor)

`GET /proctoring/sessions`

**Response 200** — array, or `{ "results": [...] }`, or `{ "sessions": [...] }` (any of the three works):
```json
[
  {
    "id": "sesn_9f2c1a",
    "full_name": "Ali Valiyev",
    "passport_id": "AD7113185",
    "status": "active",
    "warnings": 3,
    "created_at": "2026-07-18T09:12:00Z"
  }
]
```

> Frontend needs at least `id` (or `session_id`) and `full_name` (or `name`) per item.

---

## 7. Get session detail (proctor + AI) — most important

`GET /proctoring/sessions/{session_id}`

This feeds the **activity log**, the **status tiles**, and the **AI Proctor** analysis. Return the full collected log with screenshot/clip URLs.

**Response 200**
```json
{
  "id": "sesn_9f2c1a",
  "full_name": "Ali Valiyev",
  "passport_id": "AD7113185",
  "status": "active",
  "warnings": 7,
  "created_at": "2026-07-18T09:12:00Z",
  "events": [
    {
      "event_id": "evt_1752830416400_x9y8z",
      "type": "second_face",
      "message": "Second person detected (2 faces) — cheating",
      "severity": "warning",
      "client_time": "2026-07-18T09:20:16.400Z",
      "image": "https://cdn.example.com/proctor/sesn_9f2c1a/shot_07.jpg",
      "clip": "https://cdn.example.com/proctor/sesn_9f2c1a/clip_03.webm"
    },
    {
      "type": "tab_switch",
      "message": "Switched to another tab / window hidden",
      "severity": "warning",
      "client_time": "2026-07-18T09:19:02.000Z",
      "image": "https://cdn.example.com/proctor/sesn_9f2c1a/shot_06.jpg"
    },
    {
      "type": "session_started",
      "message": "Session started",
      "severity": "info",
      "client_time": "2026-07-18T09:12:05.000Z"
    }
  ]
}
```

**Field aliases the frontend accepts** (return any one per row — pick a consistent set):

| purpose | accepted keys (first match wins) |
|---|---|
| events array | `events` \| `logs` \| `activity` |
| event time | `client_time` \| `created_at` \| `time` \| `timestamp` |
| event screenshot | `image` \| `screenshot` \| `screenshot_url` \| `image_url` |
| event clip/video | `clip` \| `clip_url` \| `video` \| `video_url` |
| warnings total | `warnings` \| `warning_count` |
| session status | `status` \| `exam_status` \| `state` |
| student name | `full_name` \| `student` \| `name` |
| passport | `passport_id` \| `passport` |

**Ordering:** newest first (the UI renders top-down as received). Sort `events` by time descending.

**Note:** if `events` is empty/absent, the frontend falls back to a local (same-browser) copy — so once this endpoint returns real events, the backend becomes the source of truth automatically.

---

## Data model (suggested)

```
Session
  id (pk)                     e.g. "sesn_9f2c1a"
  full_name, passport_id
  exam_url
  status                      active | completed
  warnings (int)
  created_at, finished_at

ProctorEvent
  id (pk)
  session_id (fk)
  event_id (str, indexed)     client-supplied id — links screenshot/clip to this event
  type (str)                  see §2 table
  message (str)
  severity (str)              info | warning
  client_time (datetime)      from client
  created_at (datetime)       server-set (authoritative)
  image_url (nullable)        set when a screenshot is attached
  clip_url (nullable)         set when a clip is attached
```

**Linking via `event_id` (recommended):** a cheating event (§2), its screenshot (§3), and its clip (§4) all carry the **same `event_id`**. On screenshot/clip upload, look up the event row by `(session_id, event_id)` and set its `image_url` / `clip_url`. Then §7 returns each cheating event with its `image`/`clip` already attached — no time-based guessing needed. (Screenshots/clips may arrive slightly after the event row; upsert by `event_id`, or create the event row on first-seen `event_id`.)

> Note: the clip finishes ~8s after the event (recording duration), so the clip upload arrives later than the event log — that's expected. Match by `event_id`, not arrival order.

---

## Notes for the backend dev

1. **Warnings** = count of events with `severity: "warning"` (or maintain a counter; `finish` also sends the client's tally).
2. **Storage:** put screenshots/clips in object storage (S3/minio) and return public or signed URLs. Don't return base64 in §7 (too heavy).
3. **Retention:** clips/screenshots are large — set a lifecycle/TTL policy.
4. **AI review:** currently runs client-side (Claude Opus) in `ProctorMonitor` over the events from §7. You do **not** need an AI endpoint. If you later want server-side AI, add `POST /proctoring/sessions/{id}/ai-review` returning `{ riskLevel, riskScore, verdict, summary, incidents[], recommendation }`.
5. **Errors:** return standard JSON errors; the axios layer surfaces `message`/`error`/`detail`. Non-2xx on write endpoints is tolerated by the student flow (won't crash) but data won't be linked — aim for 2xx.

---

## CORS (must configure — otherwise the browser blocks everything)

The frontend and API are on different origins, so the browser enforces CORS. Symptom if missing:

```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/v1/proctoring/...'
from origin 'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Django (django-cors-headers)

```bash
pip install django-cors-headers
```

```python
# settings.py
INSTALLED_APPS = [
    # ...
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # as high as possible, above CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    # ...
]

# Dev origins (Vite). Add the production frontend origin(s) too.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://protoring.netlify.app",
]

# Only if the frontend sends cookies/session auth (withCredentials: true — it does).
CORS_ALLOW_CREDENTIALS = True

# If CSRF is enabled, also trust these origins for unsafe methods:
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://protoring.netlify.app",
]
```

Notes:
- The frontend axios client uses `withCredentials: true`, so you **cannot** use `CORS_ALLOW_ALL_ORIGINS = True` together with credentials — list explicit origins (as above).
- The multipart clip upload and JSON posts are "non-simple" requests → the browser sends a **preflight `OPTIONS`**. `corsheaders` handles it automatically; just make sure the middleware is above `CommonMiddleware` and the route accepts `OPTIONS`.
- Match the exact scheme+host+port. `localhost` and `127.0.0.1` are different origins — include both for dev.

### FastAPI (if not Django)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://protoring.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Express (if not Django)

```js
import cors from "cors";
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://protoring.netlify.app"],
  credentials: true,
}));
```
