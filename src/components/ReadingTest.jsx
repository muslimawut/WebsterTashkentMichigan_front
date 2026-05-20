import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CORRECT_ANSWERS, calculateScore } from '../components/CorrectAnswers';
import { safeJsonParse } from '../utils/sanitize';

const ReadingTest = () => {
  const navigate = useNavigate();
  
  // Demo data - matches your API structure for reading
  const demoQuestions = [
    {
      id: 1,
      question_number: 1,
      question_text: "What is the main idea of the passage?",
      option_a: "Technology advances rapidly",
      option_b: "Education is important",
      option_c: "Climate change affects everyone"
    },
    {
      id: 2,
      question_number: 2,
      question_text: "According to the text, what year did the event occur?",
      option_a: "2020",
      option_b: "2021",
      option_c: "2022"
    },
    {
      id: 3,
      question_number: 3,
      question_text: "The author's tone in this passage is best described as:",
      option_a: "Optimistic",
      option_b: "Neutral",
      option_c: "Critical"
    },
    {
      id: 4,
      question_number: 4,
      question_text: "Which of the following is NOT mentioned in the passage?",
      option_a: "Economic factors",
      option_b: "Social impact",
      option_c: "Political implications"
    },
    {
      id: 5,
      question_number: 5,
      question_text: "What can be inferred from the last paragraph?",
      option_a: "The situation will improve",
      option_b: "More research is needed",
      option_c: "The problem is unsolvable"
    },
    {
      id: 6,
      question_number: 6,
      question_text: "The word 'significant' in line 3 is closest in meaning to:",
      option_a: "Important",
      option_b: "Difficult",
      option_c: "Unusual"
    },
    {
      id: 7,
      question_number: 7,
      question_text: "According to the passage, which factor is most critical?",
      option_a: "Time management",
      option_b: "Resource allocation",
      option_c: "Team collaboration"
    },
    {
      id: 8,
      question_number: 8,
      question_text: "What does the author suggest in paragraph 2?",
      option_a: "Immediate action is required",
      option_b: "Further study should be conducted",
      option_c: "The current approach is effective"
    },
    {
      id: 9,
      question_number: 9,
      question_text: "The example in paragraph 3 serves to:",
      option_a: "Illustrate the main point",
      option_b: "Introduce a new topic",
      option_c: "Contrast different viewpoints"
    },
    {
      id: 10,
      question_number: 10,
      question_text: "Which statement best summarizes the passage?",
      option_a: "Change is necessary for progress",
      option_b: "Traditional methods remain effective",
      option_c: "Multiple approaches should be considered"
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [testDuration] = useState(35 * 60); // 35 minutes in seconds
  const [remainingTime, setRemainingTime] = useState(35 * 60);
  
  const totalTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const currentQuestion = demoQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / demoQuestions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Start total timer and countdown
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 1000);

    countdownTimerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleTestComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Load selected answer when question changes
  useEffect(() => {
    const savedAnswer = answers[currentQuestion.id];
    setSelectedAnswer(savedAnswer || null);
  }, [currentQuestionIndex, answers, currentQuestion.id]);

  // Handle answer selection
  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  // Handle navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < demoQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleQuestionJump = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Handle test completion
  const handleTestComplete = () => {
  if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = demoQuestions.length;
  
  // Calculate score based on correct answers
  const score = calculateScore(answers, CORRECT_ANSWERS.reading);
  
  // Save reading results to localStorage
  const readingResults = {
    answered: answeredCount,
    total: totalQuestions,
    score: score,
    answers: answers,
    timeSpent: totalTime,
    timestamp: new Date().toISOString()
  };
  
  // Get existing results from localStorage
  let allResults = safeJsonParse(localStorage.getItem('mockExamResults'), {});
  allResults.reading = readingResults;
  localStorage.setItem('mockExamResults', JSON.stringify(allResults));
  
  
  // Navigate to writing instructions
  navigate('/mock-exam/writing-instructions');
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
          <div className="flex items-center justify-between flex-wrap gap-4">
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
                  Reading Test
                </h1>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {demoQuestions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-500">Answered</div>
                <div className="text-lg font-bold" style={{ color: '#024890' }}>
                  {answeredCount}/{demoQuestions.length}
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigator - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-5 gap-2">
                {demoQuestions.map((q, index) => {
                  const isAnswered = answers[q.id];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionJump(index)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md'
                          : isAnswered
                            ? 'bg-green-100 text-green-700 border-2 border-green-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span className="text-gray-600">Not answered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Reading Passage - Placeholder */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Reading Passage</h3>
                </div>
                
                <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
                  <p>
                    In recent years, technological advancement has revolutionized the way we live, work, and communicate. 
                    The digital age has brought unprecedented changes to nearly every aspect of modern life, from how we 
                    access information to how we maintain relationships across vast distances.
                  </p>
                  <p>
                    One of the most significant developments has been the rise of artificial intelligence and machine learning. 
                    These technologies are no longer confined to research laboratories but have become integral parts of our 
                    daily lives. From virtual assistants that help us manage our schedules to recommendation algorithms that 
                    suggest content we might enjoy, AI is everywhere.
                  </p>
                  <p>
                    However, this rapid technological progress has also raised important questions about privacy, security, 
                    and the future of work. As machines become more capable of performing tasks traditionally done by humans, 
                    society must grapple with the implications of automation and the need for workforce adaptation.
                  </p>
                  <p>
                    Education systems worldwide are recognizing the need to prepare students for a future where technological 
                    literacy is as fundamental as reading and writing. This shift requires not only teaching technical skills 
                    but also fostering critical thinking, creativity, and adaptability—qualities that will remain uniquely human 
                    even as technology continues to advance.
                  </p>
                </div>
              </div>
            </div>

            {/* Question Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Question {currentQuestionIndex + 1}
                  </h4>
                  {selectedAnswer && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      Answered
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-lg">{currentQuestion.question_text}</p>
              </div>
              
              <div className="space-y-4">
                {['a', 'b', 'c'].map((option) => {
                  const optionKey = `option_${option}`;
                  const optionValue = currentQuestion[optionKey];
                  const isSelected = selectedAnswer === option;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
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

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    currentQuestionIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  ← Previous
                </button>
                
                {currentQuestionIndex === demoQuestions.length - 1 ? (
                  <button
                    onClick={handleTestComplete}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg"
                    style={{ backgroundColor: '#024890' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#013060'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#024890'}
                  >
                    Finish Test
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg"
                    style={{ backgroundColor: '#024890' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#013060'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#024890'}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            {/* <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 mb-1">Tips:</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• You can navigate between questions using the sidebar</li>
                    <li>• All questions must be answered before finishing</li>
                    <li>• Time limit: 35 minutes</li>
                    <li>• Read the passage carefully before answering</li>
                  </ul>
                </div>
              </div>
            </div> */}
          </div>
        </div>
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

export default ReadingTest;