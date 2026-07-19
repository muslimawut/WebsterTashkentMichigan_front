import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { reportErrorToTelegram } from '../utils/telegram';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Proctoring backend URL ataylab manual: .env qiymatiga bog'liq emas.
const PROCTORING_API_BASE_URL = 'https://mept.webster.uz/api/v1';

// Proctoring backend guide bo'yicha public va asosiy /api/v1 servisidan alohida.
// fetch helper JSON/text response hamda DRF validation xatolarini saqlab beradi.
const proctoringRequest = async (path, options = {}) => {
  const { requireAuth = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers || {});
  if (requireAuth) {
    const token = localStorage.getItem('authToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${PROCTORING_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(`Proctoring API request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
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
    const token = localStorage.getItem('authToken');
    if (token && !config.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
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

// Response interceptor (error handling)
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);

    let errorMessage = 'An error occurred';

    if (error.response && error.response.data) {
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
      { skipAuth: true }
    );
  }

  async verifyActivationCode(email, activateCode) {
    return axiosInstance.post(
      '/users/register-activate-code',
      {
        email,
        activate_code: parseInt(activateCode),
      },
      { skipAuth: true }
    );
  }

  async login(email, password) {
    return axiosInstance.post(
      '/users/login',
      { email, password },
      { skipAuth: true }
    );
  }

  async getProfile() {
    return axiosInstance.get('/users/profile');
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

  // Qo'l ko'tarilganda (yoki boshqa hodisada) olingan skrinshotni yuboramiz.
  async proctorUploadScreenshot(sessionId, { image, reason, eventId, clientTime }) {
    return proctoringRequest(`/proctoring/sessions/${encodeURIComponent(sessionId)}/screenshot`, {
      method: 'POST',
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
