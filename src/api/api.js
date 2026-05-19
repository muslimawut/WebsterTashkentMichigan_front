import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = 'https://meptadmin.webster.uz/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Error notification helper
const showApiError = (message) => {
  if (!message) message = 'An unexpected error occurred';

  // '\n' bo'yicha ajratib, har bir satrni alohida toast sifatida ko'rsatamiz
  const errors = message.split('\n').filter(msg => msg.trim() !== '');

  console.log(message, 'message');

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

// Request interceptor (auth token)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && !config.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (error handling)
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);

    let errorMessage = 'An error occurred';

    if (error.response && error.response.data) {
      const data = error.response.data;

      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.detail) {
        errorMessage = data.detail;
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

    // 🔹 Show toast directly from API layer
    showApiError(errorMessage);

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

  async createOrder(paymentMethod, cost, testDateId) {
    return axiosInstance.post('/orders/create/', {
      payment_method: paymentMethod.toLowerCase(),
      cost: 1000,
      test_date: testDateId
    });
  }
}

export default new ApiService();