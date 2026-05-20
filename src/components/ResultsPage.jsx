import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { safeJsonParse } from '../utils/sanitize';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get test results from navigation state or localStorage
  const [results, setResults] = useState({
    listening: {
      answered: 0,
      total: 5,
      score: 0
    },
    reading: {
      answered: 0,
      total: 55,
      score: 0
    },
    writing: {
      wordCount: 0,
      timeSpent: 0,
      submitted: false,
      cheatingDetected: false,
      cheatingReason: null
    }
  });

  useEffect(() => {
    // Try to get results from navigation state
    if (location.state?.results) {
      setResults(location.state.results);
    } else {
      // Try to get from localStorage as fallback
      const savedResults = localStorage.getItem('mockExamResults');
      const parsed = safeJsonParse(savedResults);
      if (parsed) setResults(parsed);
    }

    // Clean up localStorage when results are displayed
    // This ensures results are shown once and then cleared
    return () => {
      localStorage.removeItem('mockExamResults');
    };
  }, [location]);

  // Calculate total score (out of 100)
  const calculateTotalScore = () => {
    // Validate that we have the necessary data
    if (!results?.listening?.total || !results?.reading?.total) {
      return '0.0';
    }
    
    const listeningPercentage = (results.listening.score / results.listening.total) * 100;
    const readingPercentage = (results.reading.score / results.reading.total) * 100;
    
    // Average of listening and reading (writing is evaluated separately)
    const averageScore = (listeningPercentage + readingPercentage) / 2;
    return averageScore.toFixed(1);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReturnToHome = () => {
    // Clear results
    localStorage.removeItem('mockExamResults');
    navigate('/mock-exam');
  };

  // Safe calculation for percentages
  const getPercentage = (score, total) => {
    if (!total || total === 0) return 0;
    return ((score / total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold" style={{ color: '#024890' }}>
              Mock Exam Results
            </h1>
            <p className="text-gray-600 mt-2">Your performance summary</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Overall Score Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Overall Score</h2>
            <div className="text-7xl font-bold mb-2">{calculateTotalScore()}%</div>
            <p className="text-xl opacity-90">Listening + Reading Average</p>
          </div>
        </div>

        {/* Cheating Warning - Only show if detected */}
        {results?.writing?.cheatingDetected && (
          <div className="bg-red-50 border-l-4 border-red-600 rounded-r-xl p-6 mb-8 animate-pulse">
            <div className="flex items-start">
              <svg className="w-8 h-8 text-red-600 mr-4 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-2">⚠️ CHEATING DETECTED</h3>
                <p className="text-red-800 mb-3 font-semibold">
                  Violation: {results?.writing?.cheatingReason || 'Unknown violation'}
                </p>
                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                  <p className="text-red-900 font-bold text-lg">
                    ⚠️ If such cheating is repeated, you will not be allowed to take the Webster University internal exam
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Listening Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
                  <svg className="w-6 h-6" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Listening</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Answered:</span>
                <span className="font-bold text-gray-900">
                  {results?.listening?.answered || 0}/{results?.listening?.total || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Score:</span>
                <span className="font-bold text-green-600 text-xl">
                  {results?.listening?.score || 0}/{results?.listening?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div 
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: '#10b981',
                    width: `${getPercentage(results?.listening?.score || 0, results?.listening?.total || 0)}%` 
                  }}
                />
              </div>
              <p className="text-center text-sm font-semibold" style={{ color: '#024890' }}>
                {getPercentage(results?.listening?.score || 0, results?.listening?.total || 0)}%
              </p>
            </div>
          </div>

          {/* Reading Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
                  <svg className="w-6 h-6" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Reading</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Answered:</span>
                <span className="font-bold text-gray-900">
                  {results?.reading?.answered || 0}/{results?.reading?.total || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Score:</span>
                <span className="font-bold text-green-600 text-xl">
                  {results?.reading?.score || 0}/{results?.reading?.total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div 
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: '#10b981',
                    width: `${getPercentage(results?.reading?.score || 0, results?.reading?.total || 0)}%` 
                  }}
                />
              </div>
              <p className="text-center text-sm font-semibold" style={{ color: '#024890' }}>
                {getPercentage(results?.reading?.score || 0, results?.reading?.total || 0)}%
              </p>
            </div>
          </div>

          {/* Writing Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
                  <svg className="w-6 h-6" style={{ color: '#024890' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Writing</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Word Count:</span>
                <span className={`font-bold ${(results?.writing?.wordCount || 0) >= 300 ? 'text-green-600' : 'text-red-600'}`}>
                  {results?.writing?.wordCount || 0} words
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time Spent:</span>
                <span className="font-bold text-gray-900">
                  {formatTime(results?.writing?.timeSpent || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-bold ${results?.writing?.cheatingDetected ? 'text-red-600' : 'text-green-600'}`}>
                  {results?.writing?.cheatingDetected ? '❌ Invalidated' : '✓ Submitted'}
                </span>
              </div>
              
              {(results?.writing?.wordCount || 0) >= 300 && !results?.writing?.cheatingDetected && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm text-center font-semibold">
                    ✓ Essay will be evaluated by instructors
                  </p>
                </div>
              )}
              
              {(results?.writing?.wordCount || 0) < 300 && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-orange-800 text-sm text-center font-semibold">
                    ⚠️ Below minimum word count
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Summary</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Strengths:</h4>
              <ul className="space-y-2">
                {(results?.listening?.total || 0) > 0 && (results?.listening?.score || 0) / (results?.listening?.total || 1) >= 0.7 && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Good listening comprehension</span>
                  </li>
                )}
                {(results?.reading?.total || 0) > 0 && (results?.reading?.score || 0) / (results?.reading?.total || 1) >= 0.7 && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Strong reading skills</span>
                  </li>
                )}
                {(results?.writing?.wordCount || 0) >= 300 && !results?.writing?.cheatingDetected && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Met writing requirements</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Areas for Improvement:</h4>
              <ul className="space-y-2">
                {(results?.listening?.total || 0) > 0 && (results?.listening?.score || 0) / (results?.listening?.total || 1) < 0.7 && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Practice listening exercises</span>
                  </li>
                )}
                {(results?.reading?.total || 0) > 0 && (results?.reading?.score || 0) / (results?.reading?.total || 1) < 0.7 && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Improve reading comprehension</span>
                  </li>
                )}
                {results?.writing?.cheatingDetected && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Follow test rules strictly</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleReturnToHome}
            className="w-full sm:w-auto py-4 px-12 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:shadow-lg"
            style={{ backgroundColor: '#024890' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#013060'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#024890'}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;