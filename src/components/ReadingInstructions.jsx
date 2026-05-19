import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReadingInstructions = () => {
  const navigate = useNavigate();
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleStartReading = () => {
    if (agreedToRules) {
      navigate('/mock-exam/reading');
    }
  };

  const handleGoBack = () => {
    setShowWarning(true);
  };

  const handleConfirmGoBack = () => {
    navigate('/mock-exam');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 transition-colors"
              style={{ color: '#024890' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#013060'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#024890'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold" style={{ color: '#024890' }}>
              Reading Test Instructions
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#e3f2fd' }}>
            <svg className="w-10 h-10" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Reading Test Instructions</h2>
          <p className="text-xl text-gray-600">
            Please read the following instructions carefully before starting the reading test.
          </p>
        </div>

        {/* Test Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
              <svg className="w-6 h-6" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Test Overview</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-lg"><strong>Total Questions:</strong> 55 questions</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-lg"><strong>Time Limit:</strong> 35 minutes</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-lg"><strong>Format:</strong> Multiple choice (A, B, C)</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-lg"><strong>Content:</strong> Reading passages with comprehension questions</span>
            </li>
          </ul>
        </div>

        {/* Important Rules */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Important Rules</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">You <strong>cannot pause</strong> the test once started</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Do not refresh the page - your progress will be lost</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">You <strong>can navigate</strong> between questions freely</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">You <strong>can change</strong> your answers before submitting</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Test will <strong>auto-submit</strong> when time expires</span>
            </li>
          </ul>
        </div>

        {/* Agreement Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start mb-8">
              <input
                type="checkbox"
                id="agreeRules"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="w-5 h-5 border-gray-300 rounded focus:ring-2 mt-1 cursor-pointer"
                style={{ 
                  accentColor: '#024890',
                  color: '#024890'
                }}
              />
              <label htmlFor="agreeRules" className="ml-3 text-gray-700 cursor-pointer text-lg">
                I have read and understood all instructions above.
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStartReading}
                disabled={!agreedToRules}
                className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                  agreedToRules
                    ? 'hover:scale-105 shadow-lg hover:shadow-xl text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={agreedToRules ? { backgroundColor: '#024890' } : {}}
                onMouseEnter={(e) => {
                  if (agreedToRules) e.currentTarget.style.backgroundColor = '#013060';
                }}
                onMouseLeave={(e) => {
                  if (agreedToRules) e.currentTarget.style.backgroundColor = '#024890';
                }}
              >
                <span className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Start Reading Test
                </span>
              </button>
              <button
                onClick={handleGoBack}
                className="flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform border-2 text-gray-700 hover:scale-105"
                style={{ borderColor: '#024890', color: '#024890' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#024890';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#024890';
                }}
              >
                Go Back
              </button>
            </div>

            {!agreedToRules && (
              <p className="text-center text-sm text-red-600 mt-4 font-semibold">
                ⚠️ You must accept the instructions to start the reading test
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Go Back?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to go back? You'll need to read the instructions again to start the test.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                >
                  Stay Here
                </button>
                <button
                  onClick={handleConfirmGoBack}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                  style={{ backgroundColor: '#024890' }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingInstructions;