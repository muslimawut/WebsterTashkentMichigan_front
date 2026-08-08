export const AUTH_LOGOUT_EVENT = 'auth:logout';

// localStorage o'zgarishi shu tabning o'zida "storage" eventini chiqarmaydi.
// Shu sabab sessiyani tozalagandan keyin React auth holatiga alohida event yuboramiz.
export const clearAuthSession = () => {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('currentPage');
  } catch {
    // localStorage mavjud bo'lmasa ham logout oqimi davom etadi.
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
};
