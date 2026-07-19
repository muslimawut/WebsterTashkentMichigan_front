import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../api/api';

const StaffRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('authToken');
  const [access, setAccess] = useState(token ? 'checking' : 'login');

  useEffect(() => {
    if (!token) {
      setAccess('login');
      return undefined;
    }

    let cancelled = false;
    api.getProfile()
      .then((profile) => {
        if (cancelled) return;
        setAccess(profile?.is_staff === true ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setAccess('login');
      });

    return () => { cancelled = true; };
  }, [token]);

  if (access === 'login') {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  if (access === 'denied') return <Navigate to="/" replace />;

  if (access !== 'allowed') {
    return (
      <div style={styles.root} role="status" aria-live="polite">
        <span style={styles.spinner} aria-hidden="true" />
        <p style={styles.text}>Checking staff access…</p>
      </div>
    );
  }

  return children;
};

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    color: '#cfe0f7',
    background: 'linear-gradient(160deg,#060d1a,#081428 45%,#060e1d)',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid rgba(125,211,252,.25)',
    borderTopColor: '#7dd3fc',
    animation: 'spin 1s linear infinite',
  },
  text: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
  },
};

export default StaffRoute;
