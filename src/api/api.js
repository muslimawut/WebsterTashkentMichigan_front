import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { reportErrorToTelegram } from '../utils/telegram';
import { clearAuthSession } from '../utils/authSession';

// Barcha axios so'rovlari cookie (session) yuborsin — global default.
axios.defaults.withCredentials = true;

// Auth endi to'liq httpOnly cookie orqali. Eski JWT localStorage'da qolgan bo'lsa
// tozalaymiz — aks holda eski/muddati o'tgan Bearer yuborilib qolishi mumkin edi.
try {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
} catch { /* localStorage mavjud emas */ }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Proctoring ham asosiy API bilan bir xil base URL'dan (.env) foydalanadi.
// Yo'llar '/' bilan boshlanadi — oxiridagi '/' ikki marta bo'lmasligi uchun olib tashlanadi.
const PROCTORING_API_BASE_URL = String(API_BASE_URL || '').replace(/\/+$/, '');

// Media yuklash timeoutlari: sekin kanalda so'rov cheksiz osilib turmasin.
// Skreenshot ~60-400 KB, klip ~1-3 MB — shu sabab klipga uzunroq vaqt.
const SCREENSHOT_UPLOAD_TIMEOUT_MS = 45000;
const CLIP_UPLOAD_TIMEOUT_MS = 120000;

const PROCTORING_FIELD_LABELS = {
  full_name: 'Full name',
  passport_id: 'Passport ID',
  exam_url: 'Exam URL',
  non_field_errors: '',
};

// DRF xatolari ikki shaklda keladi:
//   { passport_id: ['...'] } yoki { detail: '...' }.
// Ikkalasini ham foydalanuvchiga ko'rsatishga yaroqli bitta xabarga aylantiramiz.
const formatProctoringErrorData = (data, status) => {
  if (typeof data === 'string') {
    const value = data.trim();
    if (value && !value.startsWith('<')) return value;
    return status >= 500
      ? 'Proctoring server error. Please try again.'
      : `Proctoring request failed (${status}).`;
  }

  if (Array.isArray(data)) {
    const messages = data.map((item) => String(item).trim()).filter(Boolean);
    if (messages.length) return messages.join(' ');
  }

  if (data && typeof data === 'object') {
    if (data.detail !== undefined) {
      const detail = Array.isArray(data.detail) ? data.detail : [data.detail];
      const messages = detail.map((item) => String(item).trim()).filter(Boolean);
      if (messages.length) return messages.join(' ');
    }

    const messages = Object.entries(data).flatMap(([field, value]) => {
      const fieldMessages = Array.isArray(value) ? value : [value];
      const label = PROCTORING_FIELD_LABELS[field]
        ?? field.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      return fieldMessages
        .map((item) => String(item).trim())
        .filter(Boolean)
        .map((message) => label ? `${label}: ${message}` : message);
    });

    if (messages.length) return messages.join(' ');
  }

  return status >= 500
    ? 'Proctoring server error. Please try again.'
    : `Proctoring request failed (${status}).`;
};

const stringifyProctoringDetails = (data) => {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data ?? '');
  }
};

// Proctor monitor endpointlari (sessions ro'yxati/tafsiloti, cheating events)
// staff uchun yopiq va `Authorization: Bearer <access_token>` talab qiladi.
// Access token login/refresh javobidan olinadi; sahifa yangilansa ham qolishi
// uchun sessionStorage'da (tab yopilganda o'chadi).
const PROCTOR_ACCESS_TOKEN_KEY = 'proctorAccessToken';

const extractAccessToken = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload.access,
    payload.access_token,
    payload.token,
    payload.tokens?.access,
    payload.data?.access,
    payload.data?.access_token,
    payload.data?.tokens?.access,
  ];
  return candidates.find((value) => typeof value === 'string' && value) || null;
};

const storeProctorAccessToken = (payload) => {
  const token = extractAccessToken(payload);
  if (token) {
    try { sessionStorage.setItem(PROCTOR_ACCESS_TOKEN_KEY, token); } catch { /* unavailable */ }
  }
  return token;
};

const readProctorAccessToken = () => {
  try { return sessionStorage.getItem(PROCTOR_ACCESS_TOKEN_KEY); } catch { return null; }
};

// Proctoring backend guide bo'yicha public va asosiy /api/v1 servisidan alohida.
// fetch helper JSON/text response hamda DRF validation xatolarini saqlab beradi.
const proctoringRequest = async (path, options = {}) => {
  const {
    requireAuth = false,
    _retried = false,
    reportToTelegram = false,
    timeoutMs = 0,
    ...requestOptions
  } = options;
  const headers = new Headers(requestOptions.headers || {});
  let refreshed = _retried;
  if (requireAuth) {
    // Token yo'q bo'lsa (masalan cookie bilan oldin kirilgan), refresh orqali olamiz.
    let accessToken = readProctorAccessToken();
    if (!accessToken && !refreshed) {
      refreshed = true;
      try { accessToken = storeProctorAccessToken(await refreshAuthToken()); } catch { /* 401 quyida */ }
    }
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const url = `${PROCTORING_API_BASE_URL}${path}`;
  const method = String(requestOptions.method || 'GET').toUpperCase();
  let response;

  // Media yuklash sekin kanalda soatlab osilib qolishi mumkin edi (fetch'da
  // standart timeout yo'q) — tab yopilguncha na yuklanardi, na xato berardi.
  // Timeout bilan u tez yiqiladi va yuklash navbati qayta urinib ko'radi.
  const controller = timeoutMs > 0 && typeof AbortController !== 'undefined' && !requestOptions.signal
    ? new AbortController()
    : null;
  const abortTimer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    response = await fetch(url, {
      ...requestOptions,
      headers,
      credentials: 'include',
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    const timedOut = Boolean(controller) && error?.name === 'AbortError';
    const failure = timedOut
      ? Object.assign(
        new Error(`Proctoring request timed out after ${Math.round(timeoutMs / 1000)}s.`),
        { timeout: true }
      )
      : error;
    if (reportToTelegram) {
      void reportErrorToTelegram({
        message: failure?.message || 'Proctoring network request failed.',
        method,
        url,
        details: [
          `Network response was not received. Browser online: ${navigator.onLine ? 'yes' : 'no'}.`,
          failure?.stack || '',
        ].filter(Boolean).join('\n'),
        payload: requestOptions.body,
      });
    }
    throw failure;
  } finally {
    if (abortTimer) clearTimeout(abortTimer);
  }

  const contentType = response.headers.get('content-type') || '';
  const responseBody = await response.text();
  let data = responseBody;
  if (contentType.includes('json') && responseBody) {
    try {
      data = JSON.parse(responseBody);
    } catch {
      // Noto'g'ri JSON qaytsa ham HTTP statusni yo'qotmaymiz; raw text xato
      // formatteriga tushadi.
    }
  }

  // Access token muddati tugagan — bir marta refresh qilib qayta urinamiz.
  if (response.status === 401 && requireAuth && !refreshed) {
    try {
      if (storeProctorAccessToken(await refreshAuthToken())) {
        return proctoringRequest(path, { ...options, _retried: true });
      }
    } catch { /* refresh ishlamadi — pastda 401 xatosi */ }
  }

  if (!response.ok) {
    const error = new Error(formatProctoringErrorData(data, response.status));
    error.status = response.status;
    error.data = data;
    if (reportToTelegram) {
      void reportErrorToTelegram({
        message: error.message,
        status: response.status,
        method,
        url,
        details: stringifyProctoringDetails(data),
        payload: requestOptions.body,
      });
    }
    throw error;
  }
  return data;
};

const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Auth httpOnly cookie orqali (withCredentials) — Authorization Bearer yuborilmaydi.
    // Django uchun CSRF tokenini esa cookie'dan olib header'ga qo'yamiz.
    const csrfToken = getCsrfToken();
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Error notification helper
const showApiError = (message) => {
  if (!message) message = 'An unexpected error occurred';
  // Massiv yoki boshqa tur kelsa ham buzilmasligi uchun satrga aylantiramiz
  if (Array.isArray(message)) message = message.join('\n');
  if (typeof message !== 'string') message = String(message);

  // '\n' bo'yicha ajratib, har bir satrni alohida toast sifatida ko'rsatamiz
  const errors = message.split('\n').filter(msg => msg.trim() !== '');


  errors.forEach((error, index) => {
    // Har bir error uchun alohida toast ko'rsatamiz, biroz delay bilan
    setTimeout(() => {
      toast.error(error.trim(), {
        position: 'top-right',
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }, index * 200); // Har bir toast 200ms oralig'ida ko'rsatiladi
  });
};

// JWT httpOnly cookie'da saqlanadi. Access token muddati tugasa, refresh token
// ham cookie orqali AVTOMATIK boradi — body'siz. Bir vaqtda faqat bitta refresh
// so'rovi ketsin (parallel 401'larda takror bo'lmasin).
let refreshInFlight = null;
const refreshAuthToken = () => {
  if (!refreshInFlight) {
    refreshInFlight = axiosInstance
      // body yo'q; refresh token localStorage'dan emas, cookie'dan boradi
      .post('/users/token/refresh', null, { skipAuth: true, skipErrorToast: true, _retried: true })
      .then((data) => { storeProctorAccessToken(data); return data; })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
};

// Response interceptor (error handling)
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const status0 = error.response?.status;
    const isAuthEndpoint = /\/users\/(login|token\/refresh)/.test(original?.url || '');
    let sessionExpired = false;

    // 401 — access token muddati tugagan bo'lishi mumkin. Cookie'ni bir marta
    // refresh qilib, asl so'rovni qayta yuboramiz. Login/refresh'ning o'zi bundan mustasno.
    if (status0 === 401 && original && !isAuthEndpoint) {
      if (!original._retried) {
        original._retried = true;
        try {
          await refreshAuthToken();
          return axiosInstance(original); // cookie yangilandi — qayta urinamiz
        } catch (_) {
          // Refresh ham muvaffaqiyatsiz — sessiyani quyida yakunlaymiz.
        }
      }

      // Refresh ishlamadi yoki refreshdan keyingi takroriy so'rov ham 401 qaytardi.
      // localStorage bilan birga React auth holatini ham darhol yangilaymiz.
      clearAuthSession();
      sessionExpired = true;
    }

    console.error('API Error:', error);

    let errorMessage = sessionExpired
      ? 'Session expired. Please sign in again.'
      : 'An error occurred';

    if (!sessionExpired && error.response && error.response.data) {
      const data = error.response.data;

      // HTML response (e.g. Django 500 page) — don't show raw HTML
      if (typeof data === 'string' && data.trim().startsWith('<')) {
        errorMessage = `Server error (${error.response.status})`;
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = Array.isArray(data.message) ? data.message.join('\n') : data.message;
      } else if (data.error) {
        // error massiv ham bo'lishi mumkin: {"error":["Invalid email or password."]}
        errorMessage = Array.isArray(data.error) ? data.error.join('\n') : data.error;
      } else if (data.detail) {
        errorMessage = Array.isArray(data.detail) ? data.detail.join('\n') : data.detail;
      } else if (typeof data === 'object') {
        const errors = [];

        Object.keys(data).forEach((key) => {
          const fieldError = data[key];
          const formattedKey = key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          if (Array.isArray(fieldError)) {
            errors.push(`${formattedKey}: ${fieldError[0]}`);
          } else if (typeof fieldError === 'string') {
            errors.push(`${formattedKey}: ${fieldError}`);
          }
        });

        if (errors.length > 0) {
          errorMessage = errors.join('\n');
        } else {
          errorMessage = JSON.stringify(data);
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Ba'zi so'rovlar (masalan proctoring — backend ixtiyoriy) xatoni jimgina
    // o'tkazadi: toast ham, Telegram ham yo'q.
    const silent = error.config?.skipErrorToast;

    // 🔹 Show toast directly from API layer
    if (!silent) showApiError(errorMessage);

    // 🔹 Adminlarga monitoring uchun Telegramga yuboramiz
    const status = error.response?.status;
    // 401 (oddiy login xatosi) va 0 (network) larni ham yuboramiz, faqat
    // foydalanuvchi tomonidan bekor qilingan so'rovlarni o'tkazib yuboramiz
    if (!silent && error.code !== 'ERR_CANCELED') {
      let rawDetails = error.response?.data;
      if (rawDetails && typeof rawDetails === 'object') {
        rawDetails = JSON.stringify(rawDetails, null, 2);
      }
      reportErrorToTelegram({
        message: errorMessage,
        status,
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        details: rawDetails,
        payload: error.config?.data,
      });
    }

    // Throw for catch blocks (AuthPage.jsx, etc.)
    const apiError = new Error(errorMessage);
    apiError.response = error.response;
    if (sessionExpired) apiError.code = 'SESSION_EXPIRED';
    throw apiError;
  }
);

class ApiService {
  async register(userData) {
    return axiosInstance.post(
      '/users/register',
      {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        passport_id: userData.passportId,
        is_bachelor: userData.isBachelor,
        password: userData.password,
      },
      // AuthPage o'zi xatoni ko'rsatadi — global toast ikki marta bo'lmasin.
      { skipAuth: true, skipErrorToast: true }
    );
  }

  async verifyActivationCode(email, activateCode) {
    return axiosInstance.post(
      '/users/register-activate-code',
      {
        email,
        activate_code: parseInt(activateCode),
      },
      // AuthPage o'zi xatoni ko'rsatadi — global toast ikki marta bo'lmasin.
      { skipAuth: true, skipErrorToast: true }
    );
  }

  async login(email, password) {
    // Backend JWT'ni httpOnly cookie sifatida o'rnatadi (withCredentials orqali).
    // skipErrorToast: AuthPage o'zi xatoni ko'rsatadi — global toast ikki marta bo'lmasin.
    const data = await axiosInstance.post(
      '/users/login',
      { email, password },
      { skipAuth: true, skipErrorToast: true }
    );
    // Proctor monitor so'rovlari uchun Bearer token.
    storeProctorAccessToken(data);
    return data;
  }

  // Access token muddati tugaganda cookie'ni yangilaydi — body'siz, cookie avtomatik.
  async refreshToken() {
    const data = await axiosInstance.post('/users/token/refresh', null, { skipAuth: true });
    storeProctorAccessToken(data);
    return data;
  }

  // silent: kirmagan foydalanuvchida 401 normal holat (masalan ProctorGate
  // kirish tekshiruvi) — bunda global toast va Telegram xabari kerak emas.
  async getProfile({ silent = false } = {}) {
    return axiosInstance.get('/users/profile', silent ? { skipErrorToast: true } : undefined);
  }

  async updateProfile(userData) {
    return axiosInstance.put('/users/profile', {
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      passport_id: userData.passportId,
      is_bachelor: userData.isBachelor,
    });
  }

  async updateProfileFormData(formData) {
    return axiosInstance.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axiosInstance.post('/users/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async sendPasswordResetCode(email) {
    return axiosInstance.post(
      '/users/reset-password',
      { email },
      { skipAuth: true }
    );
  }

  async resetPasswordConfirm(email, activationCode, newPassword, confirmPassword) {
    return axiosInstance.post(
      '/users/reset-password-confirm',
      {
        email,
        activation_code: activationCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      { skipAuth: true }
    );
  }

  async getDates() {
    return axiosInstance.get('/dates', { skipAuth: true });
  }

  async bookTestDate(dateId) {
    return axiosInstance.post('/bookings', { date_id: dateId });
  }

  async getMyBookings() {
    return axiosInstance.get('/bookings/my');
  }

  async cancelBooking(bookingId) {
    return axiosInstance.delete(`/bookings/${bookingId}`);
  }

  async getTestResults() {
    return axiosInstance.get('/results');
  }

  async getVideos() {
    return axiosInstance.get('/videos', { skipAuth: true });
  }

  async createOrder(paymentMethod, cost, testDateId, promocode) {
    if (!getCsrfToken()) {
      await axiosInstance.get('/dates', { skipAuth: true });
    }
    const payload = {
      payment_method: paymentMethod.toLowerCase(),
      cost: 1000,
      test_date: testDateId,
    };
    // Promocode kiritilgan bo'lsa, qo'shamiz — backend promocode yo'lidan ketadi
    if (promocode && promocode.trim()) {
      payload.promocode = promocode.trim();
    }
    return axiosInstance.post('/orders/create/', payload);
  }

  // ── Writing exam ────────────────────────────────────────
  async writingStart(fullName, passportId) {
    return axiosInstance.post('/writing/start', {
      full_name: fullName,
      passport_id: passportId,
    }, { skipAuth: true });
  }

  async writingAutosave(sessionId, content) {
    return axiosInstance.patch(`/writing/session/${sessionId}/autosave`, { content }, { skipAuth: true });
  }

  async writingSubmit(sessionId, content) {
    return axiosInstance.post(`/writing/session/${sessionId}/submit`, { content }, { skipAuth: true });
  }

  async writingGetSession(sessionId) {
    return axiosInstance.get(`/writing/session/${sessionId}`, { skipAuth: true });
  }

  // ── Proctoring (Cambridge Metrica imtihoni nazorati) ─────
  // Kamera tekshiruvidan o'tgach sessiya ochamiz — backend session_id qaytaradi.
  async proctorStartSession({ fullName, passportId, examUrl }) {
    return proctoringRequest('/proctoring/sessions/start', {
      method: 'POST',
      reportToTelegram: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        passport_id: passportId,
        exam_url: examUrl,
      }),
    });
  }

  // Tab almashish / fullscreen chiqish / kamera uzilishi kabi hodisalarni log qilamiz.
  // eventId — cheating hodisasi id'si; skreenshot/klip shu id bilan bog'lanadi.
  async proctorLogEvent(sessionId, { type, message, severity, eventId, clientTime }) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId || undefined,
        type,
        message,
        severity,
        client_time: clientTime || new Date().toISOString(),
      }),
    });
  }

  // Sahifa yopilayotganda oddiy fetch bekor qilinadi — sendBeacon esa brauzer
  // tomonidan navbatga qo'yilib baribir yuboriladi. Faqat kichik JSON event
  // uchun (media emas). Production'da app va API bitta origin'da (mept.webster.uz)
  // bo'lgani uchun application/json preflight muammosi chiqmaydi.
  proctorBeaconEvent(sessionId, { type, message, severity = 'warning', eventId, clientTime } = {}) {
    if (!sessionId || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false;
    const url = `${PROCTORING_API_BASE_URL}/proctoring/sessions/${encodeURIComponent(sessionId)}/events`;
    try {
      const body = new Blob([JSON.stringify({
        event_id: eventId || undefined,
        type,
        message,
        severity,
        client_time: clientTime || new Date().toISOString(),
      })], { type: 'application/json' });
      return navigator.sendBeacon(url, body);
    } catch {
      return false;
    }
  }

  // Qo'l ko'tarilganda (yoki boshqa hodisada) olingan skrinshotni yuboramiz.
  async proctorUploadScreenshot(sessionId, { image, reason, eventId, clientTime }) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/screenshot`, {
      method: 'POST',
      timeoutMs: SCREENSHOT_UPLOAD_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId || undefined,
        image,
        reason,
        client_time: clientTime || new Date().toISOString(),
      }),
    });
  }

  // Shubhali lahzada olingan qisqa ekran video-klipini yuboramiz.
  async proctorUploadClip(sessionId, { blob, reason, eventId, clientTime }) {
    const fd = new FormData();
    fd.append('clip', blob, 'proctoring.webm');
    fd.append('reason', reason || '');
    if (eventId) fd.append('event_id', eventId);
    fd.append('client_time', clientTime || new Date().toISOString());
    // Content-Type qo'lda berilmaydi — multipart boundary'ni browser qo'shadi.
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/clip`, {
      method: 'POST',
      timeoutMs: CLIP_UPLOAD_TIMEOUT_MS,
      body: fd,
    });
  }

  // ── Proctor monitoring (admin ko'rinishi) ───────────────
  // Barcha sessiyalar ro'yxati
  async proctorListSessions() {
    return proctoringRequest('/proctoring/sessions', { requireAuth: true });
  }

  // Bitta sessiya — status + hodisalar (loglar) + skrinshotlar
  async proctorGetSession(sessionId) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}`, { requireAuth: true });
  }

  // AI tab/screen tekshiruvi natijasini sessiyaga idempotent saqlaymiz.
  async proctorSaveCheatingEvents(sessionId, payload) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/cheating/events`, {
      method: 'POST',
      requireAuth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // Admin monitor refresh qilinganda avval saqlangan AI natijasini qayta olamiz.
  async proctorGetCheatingEvents(sessionId) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/cheating/events`, {
      requireAuth: true,
    });
  }

  // Imtihon tugagach sessiyani yopamiz.
  async proctorFinishSession(sessionId, { warnings } = {}) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warnings: Math.max(0, Number(warnings) || 0) }),
    });
  }
}

export default new ApiService();
