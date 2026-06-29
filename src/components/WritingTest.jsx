import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeJsonParse } from '../utils/sanitize';
import ApiService from '../api/api';
import websterLogo from '../../logowhitewebster.png';

// Article matnini paragraflarga ajratib chiqaradi.
// Ikkilangan qator ("\r\n\r\n") — yangi paragraf; yakka "\r\n" — shunchaki bo'sh joy.
const renderArticleParagraphs = (raw) => {
  if (!raw) return null;
  const paragraphs = raw
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)                  // faqat 2+ qator paragraf ajratadi
    .map((p) => p.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim()) // yakka qator -> bo'sh joy
    .filter(Boolean);
  return paragraphs.map((p, i) => (
    <p key={i} className="text-[15px] text-gray-700 leading-relaxed mb-3 last:mb-0">
      {p}
    </p>
  ));
};

// Instructions'ni "Part N" bo'limlari va bullet'larga ajratib, ko'rinarli chiqaradi
const renderInstructions = (raw) => {
  if (!raw) return null;
  // Bir qatorga keltirib, "Part N (...)" bo'yicha bo'lamiz
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const segments = normalized
    .split(/(?=Part\s*\d+\s*\([^)]*\))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return segments.map((seg, i) => {
    const headingMatch = seg.match(/^(Part\s*\d+\s*\([^)]*\))\s*-?\s*(.*)$/i);
    const heading = headingMatch ? headingMatch[1] : null;
    const body = headingMatch ? headingMatch[2] : seg;
    // Bullet'larga ajratamiz: dash oldidan bo'sh joy bo'lsa (so'z ichidagi tire emas)
    const bullets = body
      .split(/\s+-\s*/)
      .map((b) => b.trim())
      .filter(Boolean);

    return (
      <div key={i} className="mb-4 last:mb-0">
        {heading && (
          <p className="text-sm font-bold text-[#024890] mb-2">{heading}</p>
        )}
        {bullets.length > 1 ? (
          <ul className="space-y-1.5">
            {bullets.map((b, j) => (
              <li key={j} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                <span className="text-[#024890] font-bold mt-0.5 flex-shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{bullets[0] || body}</p>
        )}
      </div>
    );
  });
};

const WritingTest = () => {
  const navigate = useNavigate();

  // ── Intro screen state ──
  const [introStep, setIntroStep]     = useState(true);
  const [fullName, setFullName]       = useState('');
  const [passportId, setPassportId]   = useState('');
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError]   = useState('');

  // ── Session ──
  const [sessionId, setSessionId]     = useState(null);
  const [promptData, setPromptData]   = useState(null); // {title, text, instructions, min_words, max_words}

  const [essayText, setEssayText] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(60 * 60);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationReason, setViolationReason] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [showMouseWarning, setShowMouseWarning] = useState(false);
  const [mouseLeaveCount, setMouseLeaveCount] = useState(0);
  // layout: 'stack' | 'side' | 'wide'
  const [layout, setLayout] = useState('stack');

  const textareaRef        = useRef(null);
  const totalTimerRef      = useRef(null);
  const countdownTimerRef  = useRef(null);
  const hasSubmittedRef    = useRef(false);
  const warningTimeoutRef  = useRef(null);
  const mouseLeaveCountRef = useRef(0);
  const autosaveTimerRef   = useRef(null);
  const sessionIdRef       = useRef(null);
  const essayTextRef       = useRef('');

  // ── Handle Begin Writing ──
  const handleBeginWriting = async () => {
    if (!fullName.trim() || !passportId.trim()) return;
    setStartLoading(true);
    setStartError('');
    try {
      const res = await ApiService.writingStart(fullName.trim(), passportId.trim());
      setSessionId(res.id);
      sessionIdRef.current = res.id;
      // prompt is an object
      setPromptData(res.prompt || null);

      // ── Resume content: localStorage is the most recent local state, use it first ──
      let backupContent = '';
      try {
        const raw = localStorage.getItem(`writing_backup_${res.id}`);
        if (raw) backupContent = JSON.parse(raw)?.text || '';
      } catch (_) {}
      // localStorage takes priority (updated on every keystroke); fall back to server content
      const resumeText = backupContent || res.content || '';
      if (resumeText) setEssayText(resumeText);

      // use server's remaining time
      if (res.seconds_left) setRemainingTime(res.seconds_left);
      setIntroStep(false);
      setTestStarted(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setStartError('Full name or passport ID does not match registration records.');
      } else if (status === 404) {
        setStartError('No active writing prompt found. Please contact the administrator.');
      } else if (status === 500) {
        setStartError('Server error. Please try again or contact support if the issue persists.');
      } else {
        setStartError('Something went wrong. Please try again.');
      }
    } finally {
      setStartLoading(false);
    }
  };

  // Fullscreen only when test actually starts
  useEffect(() => {
    if (!testStarted) return;
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        const req = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
        if (req) await req.call(elem);
      } catch (_) {}
    };
    enterFullscreen();
  }, [testStarted]);

  // Count words and characters + keep ref in sync for timers/autosave
  useEffect(() => {
    essayTextRef.current = essayText;
    const words = essayText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(essayText.length);
  }, [essayText]);

  // Start timers
  useEffect(() => {
    if (!testStarted) return;

    totalTimerRef.current = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 1000);

    countdownTimerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleAutoSubmit('Time expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [testStarted]);

  // Disable copy, cut, and paste
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const preventAction = (e) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'C', 'X', 'V'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    textarea.addEventListener('copy', preventAction);
    textarea.addEventListener('cut', preventAction);
    textarea.addEventListener('paste', preventAction);
    textarea.addEventListener('contextmenu', preventAction);
    textarea.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      textarea.removeEventListener('copy', preventAction);
      textarea.removeEventListener('cut', preventAction);
      textarea.removeEventListener('paste', preventAction);
      textarea.removeEventListener('contextmenu', preventAction);
      textarea.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [testStarted]);

  // Save to localStorage on every text change (instant backup)
  useEffect(() => {
    if (!testStarted || !essayText) return;
    const key = `writing_backup_${sessionIdRef.current || 'draft'}`;
    localStorage.setItem(key, JSON.stringify({ text: essayText, savedAt: Date.now() }));
  }, [essayText, testStarted]);

  // Prevent page unload/refresh — save to localStorage only (no API)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSubmitted && !hasSubmittedRef.current) {
        // Save to localStorage only — API is NOT called on unload
        const key = `writing_backup_${sessionIdRef.current || 'draft'}`;
        localStorage.setItem(key, JSON.stringify({ text: essayText, savedAt: Date.now() }));

        e.preventDefault();
        e.returnValue = 'Your essay will be submitted if you leave this page.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitted, essayText]);

  // Prevent back button
  useEffect(() => {
    const handlePopState = () => {
      if (!isSubmitted && !hasSubmittedRef.current) {
        const confirmLeave = window.confirm(
          'Your essay will be automatically submitted if you go back. Do you want to continue?'
        );
        
        if (confirmLeave) {
          handleAutoSubmit('Back button pressed');
        } else {
          // Push state again to keep them on the page
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    // Initial push
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSubmitted]);

  // Detect tab switch, window blur, or leaving page
  useEffect(() => {
    let isWarningActive = false; // Prevent multiple triggers
    let cooldownTimer = null;
    
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted && !isSubmitted && !hasSubmittedRef.current && !isWarningActive) {
        isWarningActive = true; // Prevent multiple triggers
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        // Warning only — no auto-submit
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = setTimeout(() => {
          setShowMouseWarning(false);
        }, 5000);

        // Cooldown period - prevent new warning for 3 seconds
        cooldownTimer = setTimeout(() => {
          isWarningActive = false;
        }, 3000);
      }
    };

    const handleWindowBlur = () => {
      // Ignore if focus moved to another element within the same page (e.g. layout toggle)
      if (document.activeElement && document.activeElement !== document.body) return;
      if (testStarted && !isSubmitted && !hasSubmittedRef.current && !isWarningActive) {
        isWarningActive = true; // Prevent multiple triggers

        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);

        // Warning only — no auto-submit
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = setTimeout(() => {
          setShowMouseWarning(false);
        }, 5000);

        // Cooldown period - prevent new warning for 3 seconds
        cooldownTimer = setTimeout(() => {
          isWarningActive = false;
        }, 3000);
      }
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement &&
          !document.msFullscreenElement && testStarted && !isSubmitted && !hasSubmittedRef.current && !isWarningActive) {
        isWarningActive = true; // Prevent multiple triggers
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        // Warning only — no auto-submit
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = setTimeout(() => {
          setShowMouseWarning(false);
        }, 5000);

        // Cooldown period - prevent new warning for 3 seconds
        cooldownTimer = setTimeout(() => {
          isWarningActive = false;
        }, 3000);
      }
    };

    // Listen for visibility change (tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for window blur (focus loss)
    window.addEventListener('blur', handleWindowBlur);
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (cooldownTimer) {
        clearTimeout(cooldownTimer);
      }
    };
  }, [testStarted, isSubmitted]);

  // Detect mouse leaving the screen completely OR going to edges in fullscreen
  useEffect(() => {
    let isWarningActive = false;
    let cooldownTimer = null;
    
    const handleMouseMove = (e) => {
      if (!testStarted || isSubmitted || hasSubmittedRef.current || isWarningActive) return;
      
      // In fullscreen mode, detect mouse at top or bottom edges (with count and auto-submit)
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      
      if (isFullscreen) {
        // Only trigger at very top (browser bar area) — ignore bottom
        const atTop = e.clientY <= 2;

        if (atTop) {
          isWarningActive = true;
          
          mouseLeaveCountRef.current += 1;
          const newCount = mouseLeaveCountRef.current;
          setMouseLeaveCount(newCount);
          setShowMouseWarning(true);
          
          // Warning only — no auto-submit
          // Auto hide warning after 5 seconds
          if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
          }
          warningTimeoutRef.current = setTimeout(() => {
            setShowMouseWarning(false);
          }, 5000);
          
          // Cooldown period - prevent new warning for 3 seconds
          cooldownTimer = setTimeout(() => {
            isWarningActive = false;
          }, 3000);
        }
      }
    };
    
    const handleMouseLeave = (e) => {
      if (!testStarted || isSubmitted || hasSubmittedRef.current || isWarningActive) return;
      // Only trigger if fullscreen and mouse truly exits the viewport
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      if (!isFullscreen) return;
      if (e.clientY < 0 || e.clientX < 0 ||
          e.clientX > window.innerWidth || e.clientY > window.innerHeight) {
        
        isWarningActive = true;
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        // Warning only — no auto-submit
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = setTimeout(() => {
          setShowMouseWarning(false);
        }, 5000);
        
        cooldownTimer = setTimeout(() => {
          isWarningActive = false;
        }, 3000);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (cooldownTimer) {
        clearTimeout(cooldownTimer);
      }
    };
  }, [testStarted, isSubmitted]);

  // Auto-submit function
  const handleAutoSubmit = async (reason) => {
    if (hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;
    setIsSubmitted(true);

    // Clear timers
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);

    // ── Submit to API (saves essay in submitted/auto_submitted status) ──
    if (sessionIdRef.current) {
      try {
        await ApiService.writingSubmit(sessionIdRef.current, essayText);
        // Clear localStorage backup after successful submit
        localStorage.removeItem(`writing_backup_${sessionIdRef.current}`);
      } catch (e) {
        console.error('Auto-submit API error:', e);
      }
    }

    // A violation occurred if reason mentions a repeated count or fullscreen/tab/mouse rule
    const isCheating = /times|suspicious|edges|focus lost|switched|fullscreen/i.test(reason)
      && !/Time expired/i.test(reason);

    if (isCheating) {
      // Show violation modal — do NOT go to results page
      setViolationReason(reason);
      setShowViolationModal(true);
      setTimeout(() => {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
          exit.call(document).catch(() => {}).finally(() => navigate('/'));
        } else {
          navigate('/');
        }
      }, 4000);
      return;
    }

    // Time expired — show success then go home
    setShowSuccessModal(true);
    setTimeout(() => {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
        exit.call(document).catch(() => {}).finally(() => navigate('/'));
      } else {
        navigate('/');
      }
    }, 3000);
  };

  // Manual submit
  const handleSubmit = () => {
    setShowSubmitWarning(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitWarning(false);
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);

    // Submit to API
    if (sessionIdRef.current) {
      try {
        await ApiService.writingSubmit(sessionIdRef.current, essayText);
        localStorage.removeItem(`writing_backup_${sessionIdRef.current}`);
      } catch (e) {
        console.error('Submit error:', e);
      }
    }

    setShowSuccessModal(true);
    setTimeout(() => {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
        exit.call(document).catch(() => {}).finally(() => navigate('/'));
      } else {
        navigate('/');
      }
    }, 3000);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle text change
  const handleTextChange = (e) => {
    setEssayText(e.target.value);
  };

  // ── Intro screen ──
  if (introStep) {
    const ready = fullName.trim() && passportId.trim() && !startLoading;
    const features = [
      { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: '60 Minutes', desc: 'Timed writing session' },
      { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: '1 Essay Task', desc: 'One writing prompt' },
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'CEFR Graded', desc: 'International standard' },
    ];
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

            {/* ── Left panel (dark blue) ── */}
            <div className="md:w-5/12 relative overflow-hidden flex flex-col justify-between p-10" style={{ backgroundColor: '#1a3460', minHeight: 480 }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom left, #0d2147 0%, transparent 65%), radial-gradient(ellipse at top right, #2a5298 0%, transparent 60%)' }} />

              <div className="relative">
                {/* Logo */}
                <div className="mb-8">
                  <img src={websterLogo} alt="Webster University" className="h-9 object-contain" />
                </div>

                <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em' }}>
                  MICHIGAN ENGLISH PROFICIENCY TEST
                </p>
                <h2 className="text-3xl font-bold text-white leading-tight mb-2">
                  Writing<br />Section
                </h2>
                <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Demonstrate your English writing skills with a timed essay.
                </p>

                {/* Features */}
                <div className="space-y-4">
                  {features.map(f => (
                    <div key={f.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.85)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{f.label}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom badge */}
              <div className="relative mt-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Secure &amp; Proctored
                </div>
              </div>
            </div>

            {/* ── Right panel (white) ── */}
            <div className="md:w-7/12 flex flex-col justify-center px-10 py-10">
              <h3 className="text-2xl font-bold mb-1" style={{ color: '#1a3460' }}>Enter your details</h3>
              <p className="text-sm text-gray-400 mb-8">Your information must match your registration records.</p>

              <div className="space-y-5 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('passportInput').focus()}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 outline-none transition-all"
                    style={{ fontSize: 15 }}
                    onFocus={e => { e.target.style.borderColor = '#1a3460'; e.target.style.boxShadow = '0 0 0 3px rgba(26,52,96,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Passport serial &amp; number</label>
                  <input
                    id="passportInput"
                    value={passportId}
                    onChange={e => setPassportId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBeginWriting()}
                    placeholder="e.g. AB7545522"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 outline-none transition-all"
                    style={{ fontSize: 15 }}
                    onFocus={e => { e.target.style.borderColor = '#1a3460'; e.target.style.boxShadow = '0 0 0 3px rgba(26,52,96,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Must match your registration for an active test date.</p>
                </div>
              </div>

              {startError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm text-red-700">{startError}</p>
                </div>
              )}

              <button
                onClick={handleBeginWriting}
                disabled={!ready}
                className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: ready ? '#1a3460' : '#e5e7eb',
                  color: ready ? 'white' : '#9ca3af',
                  cursor: ready ? 'pointer' : 'not-allowed',
                  boxShadow: ready ? '0 4px 16px rgba(26,52,96,0.28)' : 'none',
                }}
                onMouseEnter={e => { if (ready) e.currentTarget.style.backgroundColor = '#122548'; }}
                onMouseLeave={e => { if (ready) e.currentTarget.style.backgroundColor = '#1a3460'; }}
              >
                {startLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Checking...
                  </>
                ) : 'Begin writing'}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Once you begin, the 60-minute timer starts and cannot be paused.
              </p>
            </div>

          </div>{/* end flex */}
        </div>
      </div>
    );
  }

  // Submitted state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Essay Submitted!</h3>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Top row */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#024890' }}>Writing Test</h1>
            </div>

            {/* Rules badges */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              {[
                { icon: '⛔', text: 'No copy-paste' },
                { icon: '🔒', text: 'Stay fullscreen' },
                { icon: '🚫', text: 'No tab/window switch' },
                { icon: '🔄', text: 'No refresh' },
                { icon: '◀️', text: 'No go back' },
                { icon: '⚠️', text: 'Violations are recorded' },
              ].map(rule => (
                <span key={rule.text} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <span>{rule.icon}</span>
                  {rule.text}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4">

              {/* Layout toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {[
                  { key: 'stack', title: 'Stacked', icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="14" height="5" rx="1.5"/>
                      <rect x="1" y="9" width="14" height="5" rx="1.5"/>
                    </svg>
                  )},
                  { key: 'side', title: 'Side by side', icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="5" height="14" rx="1.5"/>
                      <rect x="9" y="1" width="6" height="14" rx="1.5"/>
                    </svg>
                  )},
                  { key: 'wide', title: 'Wide sidebar', icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="8" height="14" rx="1.5"/>
                      <rect x="11" y="1" width="4" height="14" rx="1.5"/>
                    </svg>
                  )},
                ].map(({ key, title, icon }) => (
                  <button
                    key={key}
                    title={title}
                    onClick={() => setLayout(key)}
                    className={`p-1.5 rounded-md transition-all ${
                      layout === key
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-400">Words</div>
                <div className="text-base font-bold text-gray-700">{wordCount}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Time Left</div>
                <div className={`text-xl font-bold tabular-nums ${
                  remainingTime < 300 ? 'text-red-600 animate-pulse' :
                  remainingTime < 600 ? 'text-orange-500' : 'text-green-600'
                }`}>
                  {formatTime(remainingTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-1000 bg-blue-600"
                style={{ 
                  width: `${Math.min((totalTime / 3600) * 100, 100)}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>60 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className={`gap-5 ${
            layout === 'stack' ? 'flex flex-col' :
            layout === 'side'  ? 'grid grid-cols-3' :
                                 'grid grid-cols-2'
          }`}>
            {/* Sidebar */}
            <div className={layout === 'stack' ? 'w-full' : 'col-span-1'}>
              <div className="bg-white rounded-2xl shadow-xl flex flex-col">

                {/* Prompt */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      {promptData?.title || 'Essay Prompt'}
                    </h3>
                  </div>

                  <div className="mb-4">
                    {renderArticleParagraphs(promptData?.text)}
                  </div>

                  {promptData?.instructions && (
                    <div className="border-t-2 border-[#024890]/20 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 flex-shrink-0 text-[#024890]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h4 className="text-base font-bold text-[#024890]">Instructions</h4>
                      </div>
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                        {renderInstructions(promptData.instructions)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats — fixed bottom */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>Min: <strong className="text-gray-700">{promptData?.min_words ?? 250}</strong> words</span>
                    <span>Max: <strong className="text-gray-700">{promptData?.max_words ?? 350}</strong> words</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Words</span>
                      <span className={`font-bold ${
                        wordCount < (promptData?.min_words ?? 250) ? 'text-amber-500' :
                        wordCount > (promptData?.max_words ?? 350) ? 'text-red-500' : 'text-green-600'
                      }`}>{wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Characters</span>
                      <span className="font-semibold text-gray-700">{charCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time spent</span>
                      <span className="font-semibold text-gray-700">{formatTime(totalTime)}</span>
                    </div>
                  </div>
                  <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Reminder:</strong> Copy/paste is disabled.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Writing Area */}
            <div className={layout === 'stack' ? 'w-full' : layout === 'side' ? 'col-span-2' : 'col-span-1'}>
              <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your Essay</h3>
                  <p className="text-sm text-gray-600">
                    Write your essay below. Copy and paste are disabled.
                  </p>
                </div>

                <textarea
                  ref={textareaRef}
                  value={essayText}
                  onChange={handleTextChange}
                  placeholder="Start writing your essay here...

Remember to:
• Address all parts of the question
• Organize your ideas clearly
• Use proper grammar and vocabulary"
                  className="w-full flex-1 min-h-[500px] p-6 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none font-mono text-gray-800 leading-relaxed"
                  style={{ fontSize: '16px' }}
                  spellCheck="true"
                  autoFocus
                />

                {/* Warnings */}
                <div className="mt-4 space-y-3">
                  {remainingTime < 300 && (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg animate-pulse">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Warning:</strong> Less than 5 minutes remaining!</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  className="w-full mt-6 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 text-white hover:shadow-lg"
                  style={{ backgroundColor: '#024890' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#013060';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#024890';
                  }}
                >
                  Submit Essay
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {/* Violation Auto-Close Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Essay Automatically Closed</h3>
            <p className="text-gray-600 mb-4">
              You have violated the exam rules <strong>5 times</strong>. Your essay session has been terminated.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-6">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Repeated violations may result in disqualification from the Webster University entrance exam.
              </p>
            </div>
            <p className="text-sm text-gray-400">Redirecting to home page in 4 seconds...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="h-1 rounded-full" style={{ backgroundColor: '#dc2626', width: '100%', animation: 'shrink 4s linear forwards' }} />
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Essay Successfully Submitted!</h3>
            <p className="text-gray-600 mb-2">Your essay has been received and will be reviewed.</p>
            <div className="bg-gray-50 rounded-xl px-5 py-3 mb-6 inline-block">
              <span className="text-sm text-gray-500">Words written: </span>
              <span className="text-sm font-bold text-gray-800">{wordCount}</span>
            </div>
            <p className="text-sm text-gray-400">Redirecting to home page...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="h-1 rounded-full animate-[shrink_3s_linear_forwards]" style={{ backgroundColor: '#024890', width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Submit Essay?</h3>
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2"><strong>Statistics:</strong></p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Words: {wordCount}</li>
                  <li>• Characters: {charCount}</li>
                  <li>• Time spent: {formatTime(totalTime)}</li>
                  <li>• Time remaining: {formatTime(remainingTime)}</li>
                </ul>
              </div>
              <p className="text-gray-600 mb-6">
                Submit your essay? You cannot edit after submission.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitWarning(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Keep Writing
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: '#024890' }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mouse Leave Warning */}
      {showMouseWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`${mouseLeaveCount >= 4 ? 'bg-red-700' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md`}>
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold">⚠️ {mouseLeaveCount >= 4 ? 'FINAL WARNING!' : 'Warning!'}</p>
              <p className="text-sm">
                Keep your mouse in the center area and stay on this page!
              </p>
            </div>
            <button 
              onClick={() => setShowMouseWarning(false)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingTest;