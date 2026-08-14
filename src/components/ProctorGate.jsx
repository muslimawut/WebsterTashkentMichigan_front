import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { clearAuthSession } from '../utils/authSession';

/*
  /proctoring/monitor uchun kirish nazorati.

  Ruxsatni backend hal qiladi: profil `is_staff: true` bo'lishi shart. Login
  shu sahifaning o'zida — proctorni studentlar uchun mo'ljallangan /auth
  sahifasiga olib bormaymiz, u monitor manzilini ochib, o'sha yerda kiradi.

  Auth httpOnly cookie orqali (api.login backend cookie'sini o'rnatadi),
  shuning uchun token frontendda saqlanmaydi.
*/

const ProctorGate = ({ children }) => {
  // checking → login → (allowed | denied)
  const [access, setAccess] = useState('checking');
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('userEmail') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Cookie hali amal qilayotgan bo'lishi mumkin — bayroqqa emas, profilga ishonamiz.
  useEffect(() => {
    let cancelled = false;
    api.getProfile({ silent: true })
      .then((profile) => {
        if (cancelled) return;
        setAccess(profile?.is_staff === true ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setAccess('login');
      });
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.login(email.trim(), password);
      const user = response?.user || response?.data?.user || null;
      try {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userEmail', email.trim());
      } catch { /* localStorage bloklangan bo'lsa ham cookie ishlaydi */ }

      // Login javobida is_staff kelmasa profildan tekshiramiz.
      const isStaff = typeof user?.is_staff === 'boolean'
        ? user.is_staff
        : (await api.getProfile({ silent: true }))?.is_staff === true;
      setPassword('');
      setAccess(isStaff ? 'allowed' : 'denied');
    } catch (signInError) {
      setError(signInError?.message || 'Sign in failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }, [busy, email, password]);

  const signOut = useCallback(() => {
    clearAuthSession();
    setPassword('');
    setError('');
    setAccess('login');
  }, []);

  if (access === 'allowed') return children;

  return (
    <div className="pg-root">
      <style>{CSS}</style>
      <div className="pg-card">
        <p className="pg-eyebrow">Webster · MEPT</p>
        <h1 className="pg-title">Proctor Monitor</h1>

        {access === 'checking' && (
          <div className="pg-status" role="status" aria-live="polite">
            <span className="pg-spinner" aria-hidden="true" />
            <span>Checking access…</span>
          </div>
        )}

        {access === 'denied' && (
          <>
            <p className="pg-note is-denied">
              This account does not have proctor access. Ask an administrator for staff rights, or sign in with a
              different account.
            </p>
            <button type="button" className="pg-submit" onClick={signOut}>Use another account</button>
          </>
        )}

        {access === 'login' && (
          <>
            <p className="pg-note">Staff access only. Sign in with your Webster account.</p>
            <form className="pg-form" onSubmit={signIn}>
              <label className="pg-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@webster.uz"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="pg-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && <p className="pg-error" role="alert">{error}</p>}
              <button type="submit" className="pg-submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const CSS = `
.pg-root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
  background:linear-gradient(160deg,#060d1a,#081428 45%,#060e1d);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#e8eef7;}
.pg-card{width:min(400px,100%);padding:28px;border:1px solid rgba(255,255,255,.09);border-radius:20px;
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
  box-shadow:0 24px 60px -30px rgba(0,0,0,.8);}
.pg-eyebrow{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#7d95b8;}
.pg-title{margin:6px 0 14px;font-size:22px;font-weight:800;color:#fff;}
.pg-note{font-size:13.5px;line-height:1.55;color:#a8bcd8;margin-bottom:18px;}
.pg-note.is-denied{padding:11px 13px;border:1px solid rgba(248,113,113,.32);border-radius:11px;
  background:rgba(239,68,68,.09);color:#fca5a5;}
.pg-form{display:flex;flex-direction:column;gap:14px;}
.pg-field{display:flex;flex-direction:column;gap:7px;}
.pg-field span{font-size:13px;font-weight:600;color:#a8bcd8;}
.pg-field input{width:100%;padding:11px 14px;border:1.5px solid rgba(255,255,255,.1);border-radius:13px;
  background:rgba(255,255,255,.04);color:#eef4ff;font-size:14px;outline:none;}
.pg-field input::placeholder{color:#5c7397;}
.pg-field input:focus{border-color:#2f7ad6;background:rgba(47,122,214,.08);box-shadow:0 0 0 4px rgba(47,122,214,.15);}
.pg-submit{margin-top:4px;padding:12px;border:0;border-radius:13px;cursor:pointer;
  background:linear-gradient(135deg,#2f7ad6,#024890);color:#fff;font-size:14px;font-weight:800;}
.pg-submit:hover:not(:disabled){filter:brightness(1.08);}
.pg-submit:disabled{opacity:.6;cursor:not-allowed;}
.pg-error{padding:9px 11px;border:1px solid rgba(248,113,113,.35);border-radius:10px;
  background:rgba(239,68,68,.09);color:#fca5a5;font-size:12.5px;line-height:1.45;}
.pg-status{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;color:#cfe0f7;}
.pg-spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(125,211,252,.25);
  border-top-color:#7dd3fc;animation:pg-spin 1s linear infinite;}
@keyframes pg-spin{to{transform:rotate(360deg);}}
`;

export default ProctorGate;
