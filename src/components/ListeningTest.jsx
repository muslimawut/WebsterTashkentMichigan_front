import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Englishtestvoice from '../../Everymorning.mp3';
import Lastweekend from '../../Lastweekend.mp3';
import Mariastarted from '../../Mariastarted.mp3';
import Theweatheris from '../../Theweatherfor.mp3';
import Tomistrying from '../../Tomistrying.mp3';
import { CORRECT_ANSWERS, calculateScore } from '../components/CorrectAnswers';

const ListeningTest10Sec = () => {
  const navigate = useNavigate();
  
  const demoQuestions = [
    {
      id: 1,
      question_number: 1,
      audio: Englishtestvoice,
      question_text: "Listen to the audio. What sound do you hear?",
      option_a: "A bell ringing",
      option_b: "A door closing",
      option_c: "A phone notification"
    },
    {
      id: 2,
      question_number: 2,
      audio: Lastweekend,
      question_text: "How many times did you hear the sound repeat?",
      option_a: "Once",
      option_b: "Twice",
      option_c: "Three times"
    },
    {
      id: 3,
      question_number: 3,
      audio: Mariastarted,
      question_text: "What is the volume level of the audio?",
      option_a: "Very loud",
      option_b: "Medium",
      option_c: "Very quiet"
    },
    {
      id: 4,
      question_number: 4,
      audio: Theweatheris,
      question_text: "In which direction did the sound move?",
      option_a: "Left to right",
      option_b: "Right to left",
      option_c: "No movement"
    },
    {
      id: 5,
      question_number: 5,
      audio: Tomistrying,
      question_text: "What was the duration of the audio?",
      option_a: "5 seconds",
      option_b: "10 seconds",
      option_c: "15 seconds"
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [answerTimer, setAnswerTimer] = useState(10);
  const [showWarning, setShowWarning] = useState(false);
  const [canAnswer, setCanAnswer] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [maxAudioDuration] = useState(10);
  
  const audioRef = useRef(null);
  const answerTimerRef = useRef(null);
  const audioTimeoutRef = useRef(null);

  const currentQuestion = demoQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / demoQuestions.length) * 100;

  // Auto play audio when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAudioEnded(false);
    setAnswerTimer(10);
    setCanAnswer(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    
    const playTimer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            
            audioTimeoutRef.current = setTimeout(() => {
              if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                handleAudioEnd();
              }
            }, maxAudioDuration * 1000);
          })
          .catch(err => console.error('Audio play error:', err));
      }
    }, 500);

    return () => {
      clearTimeout(playTimer);
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    };
  }, [currentQuestionIndex, maxAudioDuration]);

  // Update audio current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setAudioCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      const duration = Math.min(audio.duration, maxAudioDuration);
      setAudioDuration(duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentQuestionIndex, maxAudioDuration]);

  // Handle audio end
  const handleAudioEnd = () => {
    setIsPlaying(false);
    setAudioEnded(true);
    setCanAnswer(true);
    
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
    }
    
    answerTimerRef.current = setInterval(() => {
      setAnswerTimer(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle answer selection
  const handleAnswerSelect = (option) => {
    if (!canAnswer) return;
    
    setSelectedAnswer(option);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
    }
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
    }

    if (currentQuestionIndex < demoQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleTestComplete();
    }
  };

  // Handle test completion
 const handleTestComplete = () => {
  if (answerTimerRef.current) clearInterval(answerTimerRef.current);
  if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
  
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = demoQuestions.length;
  
  // Calculate score based on correct answers
  const score = calculateScore(answers, CORRECT_ANSWERS.listening);
  
  // Save listening results to localStorage
  const listeningResults = {
    answered: answeredCount,
    total: totalQuestions,
    score: score,
    answers: answers,
    timestamp: new Date().toISOString()
  };
  
  // Get existing results or create new object
  let allResults = JSON.parse(localStorage.getItem('mockExamResults') || '{}');
  allResults.listening = listeningResults;
  localStorage.setItem('mockExamResults', JSON.stringify(allResults));
  
  console.log('Listening test completed!', {
    answers,
    answeredCount,
    totalQuestions,
    score,
    percentage: ((score / totalQuestions) * 100).toFixed(1) + '%'
  });
  
  // Navigate to reading instructions
  navigate('/mock-exam/reading-instructions');
};

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleExitAttempt = () => {
    setShowWarning(true);
  };

  const handleConfirmExit = () => {
    navigate('/mock-exam');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExitAttempt}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Exit Test"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#024890' }}>
                  Listening Test
                </h1>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {demoQuestions.length}
                </p>
              </div>
            </div>
            
            {/* Only show answer timer when audio has ended */}
            {audioEnded && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Time to Answer</div>
                <div className={`text-2xl font-bold ${answerTimer <= 3 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                  {answerTimer}s
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: '#024890',
                  width: `${progress}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Audio Player Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center">
            {/* Audio Status Icon */}
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
              isPlaying ? 'bg-green-100 animate-pulse' : audioEnded ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {isPlaying ? (
                <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              ) : audioEnded ? (
                <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {isPlaying ? 'Audio Playing...' : audioEnded ? 'Audio Completed' : 'Preparing Audio...'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isPlaying ? 'Listen carefully. Audio will play only once (max 10 seconds).' : 
               audioEnded ? 'Select your answer below' : 
               'Audio will start automatically'}
            </p>

            {/* Audio Progress Bar */}
            {isPlaying && audioDuration > 0 && (
              <div className="mt-4 max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{formatTime(Math.floor(audioCurrentTime))}</span>
                  <span>{formatTime(Math.floor(audioDuration))}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-100"
                    style={{ 
                      backgroundColor: '#024890',
                      width: `${(audioCurrentTime / audioDuration) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={currentQuestion.audio}
              onEnded={handleAudioEnd}
              onError={(e) => console.error('Audio error:', e)}
            />
          </div>
        </div>

        {/* Question Section */}
        {currentQuestion.question_text && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Question:</h4>
            <p className="text-gray-700">{currentQuestion.question_text}</p>
          </div>
        )}

        {/* Answer Options */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {canAnswer ? 'Select your answer:' : 'Wait for audio to finish...'}
          </h4>
          
          <div className="space-y-4">
            {['a', 'b', 'c'].map((option) => {
              const optionKey = `option_${option}`;
              const optionValue = currentQuestion[optionKey];
              const isSelected = selectedAnswer === option;
              
              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!canAnswer}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    !canAnswer 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {option.toUpperCase()}
                    </div>
                    <span className="text-gray-800 font-medium">{optionValue}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {canAnswer && selectedAnswer && (
            <button
              onClick={handleNextQuestion}
              className="w-full mt-6 py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: '#024890' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#013060'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#024890'}
            >
              {currentQuestionIndex < demoQuestions.length - 1 ? 'Next Question' : 'Finish Test'}
            </button>
          )}
        </div>

        {/* Instructions */}
        {/* <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 mb-1">Important Reminders:</p>
              <ul className="text-yellow-700 space-y-1">
                <li>• Audio will play only once (maximum 10 seconds)</li>
                <li>• You have 10 seconds to answer after audio ends</li>
                <li>• Question will automatically move to next if time runs out</li>
                <li>• You cannot go back to previous questions</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Exit Test?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to exit? Your progress will be lost and you'll need to start over.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListeningTest10Sec;