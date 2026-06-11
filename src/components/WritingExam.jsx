import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TOTAL_SECS = 60 * 60;
const MAX_PASTE  = 3;

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const countWords = (t) => t.trim().split(/\s+/).filter(Boolean).length;

/* ── Intro screen (name + passport) ─────────────────────── */
const IntroScreen = ({ onBegin }) => {
  const navigate = useNavigate();
  const [name, setName]         = useState('');
  const [passport, setPassport] = useState('');
  const ready = name.trim() && passport.trim();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/mock-exam/writing-instructions')}
            className="flex items-center gap-2 font-medium transition-colors"
            style={{ color: '#024890' }}
            onMouseEnter={e => e.currentTarget.style.color = '#013060'}
            onMouseLeave={e => e.currentTarget.style.color = '#024890'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#024890' }}>Writing Test</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* dark top */}
          <div className="px-8 py-6" style={{ backgroundColor: '#024890' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-white font-bold text-base tracking-wide">Webster · MEPT</span>
            </div>
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              MICHIGAN ENGLISH PROFICIENCY TEST
            </p>
            <h2 className="text-2xl font-bold text-white">Writing Section</h2>
          </div>

          {/* body */}
          <div className="px-8 py-6">
            {/* stats */}
            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
              {[['DURATION','60 min'],['TASK','1 essay'],['RESULT','CEFR']].map(([l,v],i) => (
                <div key={l} className={`flex-1 ${i > 0 ? 'pl-4 border-l border-gray-100' : ''}`}>
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">{l}</p>
                  <p className="text-base font-bold text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {/* fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800 text-sm transition-colors"
                  style={{ fontSize: 15 }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Passport serial &amp; number</label>
                <input
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                  placeholder="e.g. AD7113185"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800 text-sm transition-colors"
                  style={{ fontSize: 15 }}
                />
                <p className="text-xs text-gray-400 mt-1.5">Must match your registration for an active test date.</p>
              </div>
            </div>

            {/* button */}
            <button
              onClick={() => ready && onBegin({ name: name.trim(), passport: passport.trim() })}
              disabled={!ready}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 ${
                ready ? 'text-white hover:scale-[1.02] hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              style={ready ? { backgroundColor: '#024890' } : {}}
              onMouseEnter={e => ready && (e.currentTarget.style.backgroundColor = '#013060')}
              onMouseLeave={e => ready && (e.currentTarget.style.backgroundColor = '#024890')}
            >
              Begin writing
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Once you begin, the 60-minute timer starts and cannot be paused.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Paste warning banner ────────────────────────────────── */
const PasteWarning = ({ count, onClose }) => {
  const isFinal = count >= MAX_PASTE;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className={`${isFinal ? 'bg-red-700' : 'bg-red-600'} text-white rounded-xl px-5 py-4 shadow-2xl flex items-start gap-3`}>
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
        <div className="flex-1">
          <p className="font-bold text-sm mb-0.5">
            {isFinal ? '🚫 Essay Automatically Closed — 3rd Violation' : `⚠️ Warning ${count} / ${MAX_PASTE} — Copy-Paste Detected`}
          </p>
          <p className="text-xs opacity-90">
            {isFinal
              ? 'You violated the copy-paste rule 3 times. Your essay has been closed.'
              : `Copy-paste is not allowed. ${MAX_PASTE - count} warning(s) left before auto-close.`}
          </p>
        </div>
        {!isFinal && (
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Exam screen ─────────────────────────────────────────── */
const ExamScreen = ({ user, onSubmit }) => {
  const [essay, setEssay]               = useState('');
  const [timeLeft, setTimeLeft]         = useState(TOTAL_SECS);
  const [totalTime, setTotalTime]       = useState(0);
  const [pasteCount, setPasteCount]     = useState(0);
  const [showWarning, setShowWarning]   = useState(false);
  const [autoClosing, setAutoClosing]   = useState(false);
  const [showSubmit, setShowSubmit]     = useState(false);

  const textareaRef   = useRef(null);
  const timerRef      = useRef(null);
  const totalRef      = useRef(null);
  const pasteCountRef = useRef(0);
  const submittedRef  = useRef(false);

  const words = countWords(essay);
  const urgent = timeLeft < 300;

  /* timers */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { doSubmit('Time expired'); return 0; } return p - 1; });
    }, 1000);
    totalRef.current = setInterval(() => setTotalTime(p => p + 1), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(totalRef.current); };
  }, []);

  /* block copy / cut / contextmenu */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const block = e => e.preventDefault();
    el.addEventListener('copy', block);
    el.addEventListener('cut', block);
    el.addEventListener('contextmenu', block);
    return () => { el.removeEventListener('copy', block); el.removeEventListener('cut', block); el.removeEventListener('contextmenu', block); };
  }, []);

  /* paste handler */
  const handlePaste = useCallback(e => {
    e.preventDefault();
    if (submittedRef.current) return;
    pasteCountRef.current += 1;
    const n = pasteCountRef.current;
    setPasteCount(n);
    setShowWarning(true);
    if (n >= MAX_PASTE) {
      setAutoClosing(true);
      clearInterval(timerRef.current);
      clearInterval(totalRef.current);
      setTimeout(() => doSubmit('Auto-closed: copy-paste limit exceeded'), 2500);
    }
  }, []);

  /* keyboard shortcut block */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const block = e => {
      if ((e.ctrlKey || e.metaKey) && ['v','V','c','C','x','X'].includes(e.key)) {
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
    clearInterval(totalRef.current);
    onSubmit({ essay, words, totalTime, reason });
  };

  if (autoClosing) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Essay Automatically Closed</h3>
        <p className="text-gray-500 text-sm">Copy-paste violated 3 times. Redirecting...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>

      {showWarning && <PasteWarning count={pasteCount} onClose={() => setShowWarning(false)} />}

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* user info */}
            <div>
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-400">{user.passport}</p>
            </div>

            {/* auto-save */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-sm text-gray-500">All changes saved</span>
            </div>

            {/* timer */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <span className="text-xs font-semibold text-gray-500 tracking-wider">TIME LEFT</span>
              <span className={`text-xl font-black tabular-nums ${urgent ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                {fmt(timeLeft)}
              </span>
            </div>
          </div>

          {/* progress */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(totalTime / TOTAL_SECS) * 100}%`, backgroundColor: '#024890' }}
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-28">

        {/* Writing task card */}
        <div className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-l-4" style={{ borderLeftColor: '#024890' }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#024890' }}>WRITING TASK</p>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Technology and human connection</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Some people believe that modern communication technology brings people closer together, while others argue it makes face-to-face relationships weaker. Discuss both views and give your own opinion, supported by reasons and examples from your experience.
            </p>
            <div className="border-t-2 border-dashed border-gray-200 pt-3">
              <p className="text-sm text-gray-500">
                Write a well-organised essay of <strong className="text-gray-700">250–350 words</strong>. You will be assessed on task response, organisation, grammar, and vocabulary.
              </p>
            </div>
          </div>
        </div>

        {/* Response card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* card header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 tracking-widest">YOUR RESPONSE</span>
            <span className={`text-sm font-semibold ${
              words === 0 ? 'text-gray-400' :
              words < 250 ? 'text-amber-500' :
              words > 350 ? 'text-red-500' :
              'text-green-600'
            }`}>
              {words} words
            </span>
          </div>

          {/* lined textarea */}
          <textarea
            ref={textareaRef}
            value={essay}
            onChange={e => setEssay(e.target.value)}
            onPaste={handlePaste}
            placeholder="Start writing your essay here..."
            autoFocus
            spellCheck
            className="w-full outline-none resize-none"
            style={{
              minHeight: 480,
              padding: '16px 24px',
              fontSize: 16,
              lineHeight: '36px',
              color: '#1f2937',
              fontFamily: 'Georgia, "Times New Roman", serif',
              background: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 35px,
                #e5e7eb 35px,
                #e5e7eb 36px
              )`,
              backgroundPositionY: '19px',
              border: 'none',
              caretColor: '#024890',
            }}
          />

          {/* footer hint */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {words < 250
                ? `${250 - words} more words needed`
                : words > 350
                ? `${words - 350} words over limit`
                : '✓ Word count in range'}
            </p>
            <div className="flex items-center gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${
                  i < Math.min(Math.floor((words / 250) * 3), 3) ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-6 py-3 flex items-center justify-between z-20">
        <p className="text-sm text-gray-500">Your work saves automatically. Submit when you are ready.</p>
        <button
          onClick={() => setShowSubmit(true)}
          className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 hover:shadow-lg"
          style={{ backgroundColor: '#024890' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#013060'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#024890'}
        >
          Submit for assessment
        </button>
      </div>

      {/* ── Submit modal ── */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e3f2fd' }}>
                <svg className="w-8 h-8" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Submit Essay?</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-2">
                <p className="text-sm text-gray-600">• Words written: <strong>{words}</strong></p>
                <p className="text-sm text-gray-600">• Time spent: <strong>{fmt(totalTime)}</strong></p>
                <p className="text-sm text-gray-600">• Time remaining: <strong className={urgent ? 'text-red-600' : ''}>{fmt(timeLeft)}</strong></p>
              </div>
              <p className="text-gray-500 text-sm mb-6">You cannot make changes after submission.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmit(false)}
                  className="flex-1 px-5 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Keep Writing
                </button>
                <button
                  onClick={() => { setShowSubmit(false); doSubmit('Manual submission'); }}
                  className="flex-1 px-5 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-md"
                  style={{ backgroundColor: '#024890' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#013060'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#024890'}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Root ────────────────────────────────────────────────── */
const WritingExam = () => {
  const navigate = useNavigate();
  const [user, setUser]     = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = (data) => {
    setResult(data);
    setTimeout(() => navigate('/'), 2500);
  };

  if (result) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Essay Submitted!</h3>
        <p className="text-gray-500 text-sm">{result.words} words · {result.reason === 'Manual submission' ? 'Submitted manually' : result.reason}</p>
        <p className="text-gray-400 text-xs mt-2">Redirecting...</p>
      </div>
    </div>
  );

  if (!user) return <IntroScreen onBegin={setUser} />;
  return <ExamScreen user={user} onSubmit={handleSubmit} />;
};

export default WritingExam;
