import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WritingTest = () => {
  const navigate = useNavigate();
  
  // Essay prompt
  const essayPrompt = `Technology has significantly changed the way people communicate. Some people believe that technology has improved communication, while others think it has made communication less personal.

Discuss both views and give your own opinion. Support your answer with specific examples and reasons.

Write your essay below.`;

  const [essayText, setEssayText] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(60 * 60); // 60 minutes
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [showMouseWarning, setShowMouseWarning] = useState(false);
  const [mouseLeaveCount, setMouseLeaveCount] = useState(0);
  
  const textareaRef = useRef(null);
  const totalTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const warningTimeoutRef = useRef(null);
  const mouseLeaveCountRef = useRef(0);

  // Start test
  useEffect(() => {
    setTestStarted(true);
    
    // Request fullscreen
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE11
          await elem.msRequestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen request failed:', err);
      }
    };
    
    enterFullscreen();
  }, []);

  // Count words and characters
  useEffect(() => {
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
  }, []);

  // Prevent page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSubmitted && !hasSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = 'Your essay will be submitted if you leave this page.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitted]);

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
      if (document.hidden && !isSubmitted && !hasSubmittedRef.current && !isWarningActive) {
        isWarningActive = true; // Prevent multiple triggers
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        // Check if reached 3 warnings
        if (newCount >= 3) {
          handleAutoSubmit('Tab switched or window minimized 3 times');
        } else {
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

    const handleWindowBlur = () => {
      if (!isSubmitted && !hasSubmittedRef.current && !isWarningActive) {
        isWarningActive = true; // Prevent multiple triggers
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        // Check if reached 3 warnings
        if (newCount >= 3) {
          handleAutoSubmit('Window focus lost 3 times');
        } else {
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

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && 
          !document.msFullscreenElement && !isSubmitted && !hasSubmittedRef.current && !isWarningActive) {
        isWarningActive = true; // Prevent multiple triggers
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        // Check if reached 3 warnings
        if (newCount >= 3) {
          handleAutoSubmit('Exited fullscreen mode 3 times');
        } else {
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
  }, [isSubmitted]);

  // Detect mouse leaving the screen completely OR going to edges in fullscreen
  useEffect(() => {
    let isWarningActive = false;
    let cooldownTimer = null;
    
    const handleMouseMove = (e) => {
      if (isSubmitted || hasSubmittedRef.current || isWarningActive) return;
      
      // In fullscreen mode, detect mouse at top or bottom edges (with count and auto-submit)
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      
      if (isFullscreen) {
        const atTop = e.clientY <= 5;
        const atBottom = e.clientY >= window.innerHeight - 5;
        
        if (atTop || atBottom) {
          isWarningActive = true;
          
          mouseLeaveCountRef.current += 1;
          const newCount = mouseLeaveCountRef.current;
          setMouseLeaveCount(newCount);
          setShowMouseWarning(true);
          
          // Check if reached 3 warnings
          if (newCount >= 3) {
            handleAutoSubmit('Mouse moved to screen edges 3 times');
            return;
          }
          
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
      if (isSubmitted || hasSubmittedRef.current || isWarningActive) return;
      
      // Only trigger if mouse actually leaves the window boundaries
      if (e.clientY < 0 || e.clientX < 0 || 
          e.clientX > window.innerWidth || e.clientY > window.innerHeight) {
        
        isWarningActive = true;
        
        mouseLeaveCountRef.current += 1;
        const newCount = mouseLeaveCountRef.current;
        setMouseLeaveCount(newCount);
        setShowMouseWarning(true);
        
        if (newCount >= 3) {
          handleAutoSubmit('Mouse left screen 3 times - suspicious activity');
          return;
        }
        
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
  }, [isSubmitted]);

  // Auto-submit function
  const handleAutoSubmit = (reason) => {
    if (hasSubmittedRef.current) return;
    
    hasSubmittedRef.current = true;
    setIsSubmitted(true);

    // Clear timers
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    const submissionData = {
      reason,
      essayText,
      wordCount,
      charCount,
      timeSpent: totalTime,
      timestamp: new Date().toISOString()
    };

    console.log('Essay auto-submitted:', submissionData);

    // Determine if cheating was detected
    const cheatingReasons = [
      'Tab switched or window minimized',
      'Window focus lost - switched to another application',
      'Exited fullscreen mode',
      'Mouse left screen 3 times - suspicious activity',
      'Mouse moved to restricted area 3 times - suspicious activity'
    ];
    const isCheating = cheatingReasons.includes(reason);

    // Save writing results
    const writingResults = {
      wordCount,
      timeSpent: totalTime,
      submitted: true,
      cheatingDetected: isCheating,
      cheatingReason: isCheating ? reason : null
    };

    // Get existing results from localStorage or create new
    let allResults = JSON.parse(localStorage.getItem('mockExamResults') || '{}');
    allResults.writing = writingResults;
    localStorage.setItem('mockExamResults', JSON.stringify(allResults));

    // TODO: Send to API
    /*
    fetch('YOUR_API/submit-essay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    })
    .then(res => res.json())
    .then(data => console.log('Submitted:', data))
    .catch(err => console.error('Error:', err));
    */

    // Navigate to results page
    navigate('/mock-exam/results', { 
      replace: true,
      state: { results: allResults }
    });
  };

  // Manual submit
  const handleSubmit = () => {
    setShowSubmitWarning(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitWarning(false);
    handleAutoSubmit('Manual submission');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#024890' }}>
                Writing Test
              </h1>
              <p className="text-sm text-gray-500">Essay Writing - 60 minutes</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-500">Words</div>
                <div className="text-lg font-bold text-gray-700">
                  {wordCount}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div className={`text-2xl font-bold ${
                  remainingTime < 300 ? 'text-red-600 animate-pulse' : 
                  remainingTime < 600 ? 'text-orange-600' : 
                  'text-green-600'
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900">Essay Prompt</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {essayPrompt}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Statistics:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Words:</span>
                      <span className="font-semibold">{wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Characters:</span>
                      <span className="font-semibold">{charCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time spent:</span>
                      <span className="font-semibold">{formatTime(totalTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Reminder:</strong> Copy/paste is disabled. Type your essay directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Writing Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
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
                  className="w-full h-[600px] p-6 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none font-mono text-gray-800 leading-relaxed"
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

              {/* Important Notes */}
              <div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-red-800 mb-1">⚠️ Important:</p>
                    <ul className="text-red-700 space-y-1">
                      <li>• Do not refresh - your work will be lost</li>
                      <li>• Do not press back - essay will auto-submit</li>
                      <li>• Do not switch tabs or windows - essay will auto-submit</li>
                      <li>• Do not exit fullscreen - essay will auto-submit</li>
                      <li>• Keep mouse in center area - 3 warnings = auto-submit</li>
                      <li>• Copy/paste is disabled</li>
                      <li>• Auto-submits when time expires</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <div className={`${mouseLeaveCount >= 2 ? 'bg-red-700' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md`}>
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold">⚠️ {mouseLeaveCount >= 2 ? 'FINAL WARNING!' : 'Warning!'}</p>
              <p className="text-sm">
                {mouseLeaveCount >= 2 
                  ? `One more time and essay will auto-submit! (${mouseLeaveCount}/3)`
                  : `Keep your mouse in the center area! (${mouseLeaveCount}/3)`
                }
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