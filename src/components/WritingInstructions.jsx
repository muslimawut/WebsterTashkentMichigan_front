import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WritingInstructions = () => {
  const navigate = useNavigate();
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleStartWriting = () => {
    if (agreedToRules) {
      navigate('/mock-exam/writing');
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleConfirmGoBack = () => {
    navigate('/');
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
              Writing Test Instructions
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Writing Test Instructions</h2>
          <p className="text-xl text-gray-600">
            Please read the following instructions carefully before starting the writing test.
          </p>
        </div>

        {/* Critical Warning */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6 mb-8">
          <div className="flex items-start">
            <svg className="w-8 h-8 text-red-600 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-xl font-bold text-red-900 mb-2">⚠️ CRITICAL: Read This First!</h3>
              <ul className="space-y-2 text-red-800">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Copy/Paste is completely disabled</strong> - You must type everything manually</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Leaving the page = Automatic submission</strong> - Your essay will be submitted immediately</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>No pause option</strong> - Once started, you must complete the test</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>60 minutes only</strong> - Time will not stop for any reason</span>
                </li>
              </ul>
            </div>
          </div>
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
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">⛔ Copy and paste is DISABLED - you cannot paste text from anywhere</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">⛔ Copying text is DISABLED - you cannot copy your own text</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">⚠️ If you leave the page or go back, your essay will be automatically submitted</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">⚠️ If you refresh the page, your work will be lost</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">⚠️ Once you start writing, you cannot pause the test</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">✓ You can edit and revise your essay until time runs out</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">✓ Total time: 60 minutes (1 hour)</span>
            </li>
            <li className="flex items-start text-gray-700">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">✓ Minimum word count: 300 words</span>
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
                onClick={handleStartWriting}
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Start Writing Test
                </span>
              </button>
            </div>

            {!agreedToRules && (
              <p className="text-center text-sm text-red-600 mt-4 font-semibold">
                ⚠️ You must accept the instructions to start the writing test
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

export default WritingInstructions;