import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── helpers ─────────────────────────────────────────────── */
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const countWords = (t) => t.trim().split(/\s+/).filter(Boolean).length;

const TOTAL_SECS = 60 * 60; // 60 min
const MAX_PASTE  = 3;

/* ── Intro screen ────────────────────────────────────────── */
const IntroScreen = ({ onBegin }) => {
  const [name, setName]         = useState('');
  const [passport, setPassport] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* dark header */}
        <div style={{ background: '#1a2744', padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'sans-serif' }}>W</span>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 17, fontFamily: 'sans-serif', letterSpacing: 0.3 }}>Webster · MEPT</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'sans-serif', letterSpacing: '0.12em', marginBottom: 8 }}>
            MICHIGAN ENGLISH PROFICIENCY TEST
          </p>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 700, margin: 0 }}>Writing Section</h1>
        </div>

        {/* white body */}
        <div style={{ background: 'white', padding: '28px 32px 36px' }}>
          {/* stats row */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
            {[['DURATION', '60 min'], ['TASK', '1 essay'], ['RESULT', 'CEFR']].map(([label, val], i) => (
              <div key={label} style={{ flex: 1, paddingRight: i < 2 ? 16 : 0, borderRight: i < 2 ? '1px solid #e8e8e8' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
                <p style={{ fontSize: 10, color: '#999', letterSpacing: '0.1em', fontFamily: 'sans-serif', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', fontFamily: 'sans-serif', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #ebebeb', marginBottom: 24 }} />

          {/* inputs */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontFamily: 'sans-serif', fontSize: 14, color: '#222', marginBottom: 8, fontWeight: 500 }}>Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dde0e8', borderRadius: 8, fontSize: 15, fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box', color: '#1a2744' }}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontFamily: 'sans-serif', fontSize: 14, color: '#222', marginBottom: 8, fontWeight: 500 }}>Passport serial &amp; number</label>
            <input
              value={passport}
              onChange={e => setPassport(e.target.value)}
              placeholder="e.g. AD7113185"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dde0e8', borderRadius: 8, fontSize: 15, fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box', color: '#1a2744' }}
            />
          </div>
          <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#aaa', marginBottom: 24 }}>Must match your registration for an active test date.</p>

          <button
            onClick={() => name.trim() && passport.trim() && onBegin({ name: name.trim(), passport: passport.trim() })}
            disabled={!name.trim() || !passport.trim()}
            style={{ width: '100%', padding: '14px', background: name.trim() && passport.trim() ? '#2a7a6b' : '#b0cdc9', border: 'none', borderRadius: 10, color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'sans-serif', cursor: name.trim() && passport.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
          >
            Begin writing
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'sans-serif', fontSize: 12, color: '#aaa', marginTop: 12 }}>
            Once you begin, the 60-minute timer starts and cannot be paused.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Paste warning toast ─────────────────────────────────── */
const PasteWarning = ({ count, onClose }) => {
  const isFinal = count >= MAX_PASTE;
  return (
    <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, minWidth: 360, maxWidth: 480 }}>
      <div style={{ background: isFinal ? '#7f1d1d' : '#7c2d12', color: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', fontFamily: 'sans-serif' }}>
            {isFinal ? '🚫 Essay Closed — 3rd Violation' : `⚠️ Warning ${count} / ${MAX_PASTE}`}
          </p>
          <p style={{ fontSize: 13, margin: 0, fontFamily: 'sans-serif', opacity: 0.9 }}>
            {isFinal
              ? 'You have violated the copy-paste rule 3 times. Your essay has been automatically closed.'
              : `Copy-paste is not allowed. ${MAX_PASTE - count} warning(s) remaining before auto-close.`}
          </p>
        </div>
        {!isFinal && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, opacity: 0.7 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Exam screen ─────────────────────────────────────────── */
const ExamScreen = ({ user, onSubmit }) => {
  const [essay, setEssay]           = useState('');
  const [timeLeft, setTimeLeft]     = useState(TOTAL_SECS);
  const [pasteCount, setPasteCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [autoClosing, setAutoClosing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const textareaRef    = useRef(null);
  const timerRef       = useRef(null);
  const pasteCountRef  = useRef(0);
  const submittedRef   = useRef(false);

  const words = countWords(essay);
  const urgent = timeLeft < 300;

  /* timer */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doSubmit('Time expired'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* disable copy / cut / contextmenu — only on textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const block = (e) => e.preventDefault();
    el.addEventListener('copy', block);
    el.addEventListener('cut', block);
    el.addEventListener('contextmenu', block);
    return () => {
      el.removeEventListener('copy', block);
      el.removeEventListener('cut', block);
      el.removeEventListener('contextmenu', block);
    };
  }, []);

  /* paste handler with warning */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    if (submittedRef.current) return;

    pasteCountRef.current += 1;
    const n = pasteCountRef.current;
    setPasteCount(n);
    setShowWarning(true);

    if (n >= MAX_PASTE) {
      setAutoClosing(true);
      clearInterval(timerRef.current);
      setTimeout(() => doSubmit('Auto-closed: copy-paste limit exceeded'), 2500);
    }
  }, []);

  /* keyboard shortcuts block */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const block = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['v', 'V', 'c', 'C', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
        if (e.key.toLowerCase() === 'v') handlePaste(e);
      }
    };
    el.addEventListener('keydown', block);
    return () => el.removeEventListener('keydown', block);
  }, [handlePaste]);

  const doSubmit = (reason) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    clearInterval(timerRef.current);
    onSubmit({ essay, words, reason });
  };

  if (autoClosing) return (
    <div style={{ minHeight: '100vh', background: '#1a2744', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Essay Automatically Closed</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Copy-paste rule violated 3 times. Redirecting...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0ebe0', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>

      {/* paste warning toast */}
      {showWarning && <PasteWarning count={pasteCount} onClose={() => setShowWarning(false)} />}

      {/* ── Header ── */}
      <div style={{ background: '#1a2744', position: 'sticky', top: 0, zIndex: 50 }}>
        {/* progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ height: '100%', background: '#2a7a6b', width: `${((TOTAL_SECS - timeLeft) / TOTAL_SECS) * 100}%`, transition: 'width 1s linear' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
          {/* user info */}
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>{user.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{user.passport}</p>
          </div>

          {/* center status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>All changes saved</span>
          </div>

          {/* timer */}
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: '0.08em' }}>TIME LEFT</span>
            <span style={{ color: urgent ? '#f87171' : 'white', fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '32px 20px 120px' }}>

        {/* Writing task card */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4d8', borderLeft: '4px solid #1a2744', padding: '28px 32px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2a7a6b', letterSpacing: '0.12em', marginBottom: 12 }}>WRITING TASK</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 14, fontFamily: 'Georgia, serif' }}>
            Technology and human connection
          </h2>
          <p style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 20 }}>
            Some people believe that modern communication technology brings people closer together, while others argue it makes face-to-face relationships weaker. Discuss both views and give your own opinion, supported by reasons and examples from your experience.
          </p>
          <hr style={{ border: 'none', borderTop: '1.5px dashed #ddd', marginBottom: 16 }} />
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>
            Write a well-organised essay of <strong>250–350 words</strong>. You will be assessed on task response, organisation, grammar, and vocabulary.
          </p>
        </div>

        {/* Response card */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e4d8', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {/* response header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0ece2' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.1em' }}>YOUR RESPONSE</span>
            <span style={{ fontSize: 14, color: words < 250 ? '#f59e0b' : words > 350 ? '#ef4444' : '#2a7a6b', fontWeight: 600 }}>
              {words} words
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={essay}
            onChange={e => setEssay(e.target.value)}
            onPaste={handlePaste}
            placeholder="Start writing your essay here..."
            autoFocus
            spellCheck
            style={{
              width: '100%',
              minHeight: 480,
              padding: '12px 24px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 16,
              lineHeight: '36px',
              color: '#1a1a2e',
              fontFamily: 'Georgia, serif',
              boxSizing: 'border-box',
              background: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 35px,
                #d6d3ca 35px,
                #d6d3ca 36px
              )`,
              backgroundPositionY: '11px',
              caretColor: '#1a2744',
            }}
          />
        </div>

        {/* word count hint */}
        <p style={{ textAlign: 'right', fontSize: 12, color: '#aaa', marginTop: 8 }}>
          Target: 250–350 words
          {words < 250 && ` · ${250 - words} more to go`}
          {words > 350 && ` · ${words - 350} over limit`}
        </p>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e8e4d8', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Your work saves automatically. Submit when you are ready.</p>
        <button
          onClick={() => setShowSubmitModal(true)}
          style={{ background: '#1a2744', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Submit for assessment
        </button>
      </div>

      {/* ── Submit confirm modal ── */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '36px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2a7a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Submit your essay?</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              You have written <strong>{words} words</strong>. Once submitted, you cannot make changes.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #dde0e8', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#444' }}>
                Keep writing
              </button>
              <button onClick={() => { setShowSubmitModal(false); doSubmit('Manual submission'); }} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#2a7a6b', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Root component ──────────────────────────────────────── */
const WritingExam = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [done, setDone]       = useState(false);
  const [result, setResult]   = useState(null);

  const handleSubmit = ({ essay, words, reason }) => {
    setResult({ essay, words, reason });
    setDone(true);
    setTimeout(() => navigate('/'), 2500);
  };

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 440, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2a7a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Essay Submitted!</h2>
        <p style={{ color: '#888', fontSize: 14 }}>
          {result?.words} words · {result?.reason === 'Manual submission' ? 'Submitted manually' : result?.reason}
        </p>
        <p style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>Redirecting...</p>
      </div>
    </div>
  );

  if (!user) return <IntroScreen onBegin={setUser} />;
  return <ExamScreen user={user} onSubmit={handleSubmit} />;
};

export default WritingExam;
