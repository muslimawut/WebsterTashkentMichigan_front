import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const MockExamPage = () => {
  const navigate = useNavigate();
  const [agreedToRules, setAgreedToRules] = useState(false);

  const examSections = [
    {
      title: 'Listening',
      questions: 25,
      duration: '25 minutes',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      description: '25 questions, 10 seconds per question to answer after audio ends.',
      bgColor: 'bg-[#024890]',
      hoverColor: 'hover:bg-[#013060]'
    },
    {
      title: 'Reading',
      questions: 55,
      duration: '35 minutes',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      description: '55 questions, reading comprehension based test.',
      bgColor: 'bg-[#035aa6]',
      hoverColor: 'hover:bg-[#024890]'
    },
    {
      title: 'Writing',
      questions: 'Essay',
      duration: '1 hour',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: 'Essay writing, express your thoughts clearly and coherently.',
      bgColor: 'bg-[#0470d8]',
      hoverColor: 'hover:bg-[#035aa6]'
    }
  ];

  const examRules = [
    {
      title: 'Exam Structure',
      rules: [
        'The exam consists of 3 sections: Listening, Reading, and Writing',
        'Each section is completed sequentially and cannot be returned to',
        'Total exam duration: approximately 2 hours and 5 minutes'
      ]
    },
    {
      title: 'Listening Section',
      rules: [
        '25 questions, 25 minutes',
        'Audio will be played only once',
        '10 seconds are given to answer each question',
        'Move to next question automatically after audio ends'
      ]
    },
    {
      title: 'Reading Section',
      rules: [
        '55 questions, 35 minutes',
        'Read passages carefully',
        'All questions are in multiple-choice format',
        'Manage your time wisely'
      ]
    },
    {
      title: 'Writing Section',
      rules: [
        '1 hour time limit',
        'Write an essay on the given topic',
        'Minimum 300 words',
        'Grammar and spelling are important'
      ]
    },
    {
      title: 'Important Rules',
      rules: [
        'Cannot refresh page or exit browser during exam',
        'Cannot pause once exam has started',
        'Results will be displayed after all sections are completed',
        'Stable internet connection is required'
      ]
    }
  ];

  // TEMPORARY: Coming Soon State
  const isComingSoon = true;

  if (isComingSoon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white p-8 sm:p-12 rounded-3xl shadow-2xl max-w-lg w-full transform transition-all hover:scale-105 duration-500">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#024890]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#024890] mb-4">Coming Soon</h1>
          <p className="text-gray-600 mb-8 text-lg">
            We are working hard to bring you the Mock Exam feature. Stay tuned for updates!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#024890] text-white rounded-xl font-semibold hover:bg-[#013060] transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleStartExam = () => {
    if (agreedToRules) {
      navigate('/mock-exam/listening');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header with Back Button */}
      <div className="bg-white/80 border-b border-gray-200 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 transition-colors"
              style={{ color: '#024890' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#013060';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#024890';
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
            <h1 className="text-xl font-bold" style={{ color: '#024890' }}>Mock Exam</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#024890' }}>
              Mock Exam
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Michigan English Placement Test practice exam. Test yourself in real exam format.
            </p>
          </div>

          {/* Exam Sections Overview */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {examSections.map((section, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300"
              >
                <div className={`${section.bgColor} ${section.hoverColor} transition-colors duration-300 p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    {section.icon}
                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                      {section.duration}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                  <p className="text-lg font-semibold text-white/90">
                    {typeof section.questions === 'number' ? `${section.questions} questions` : section.questions}
                  </p>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">{section.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Exam Rules */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#024890' }}>
              Exam Rules
            </h2>

            <div className="space-y-6">
              {examRules.map((section, index) => (
                <div key={index} className="border-l-4 pl-6 py-2" style={{ borderColor: '#024890' }}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.rules.map((rule, ruleIndex) => (
                      <li key={ruleIndex} className="flex items-start">
                        <svg
                          className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                          style={{ color: '#024890' }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement and Start Section */}
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
                <label htmlFor="agreeRules" className="ml-3 text-gray-700 cursor-pointer">
                  I have read and accept all rules and instructions. I agree not to violate the rules during the exam and to devote my full attention to taking the test.
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartExam}
                  disabled={!agreedToRules}
                  className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform ${agreedToRules
                      ? 'hover:scale-105 shadow-lg hover:shadow-xl text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  style={agreedToRules ? {
                    backgroundColor: '#024890'
                  } : {}}
                  onMouseEnter={(e) => {
                    if (agreedToRules) {
                      e.currentTarget.style.backgroundColor = '#013060';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (agreedToRules) {
                      e.currentTarget.style.backgroundColor = '#024890';
                    }
                  }}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Exam
                  </span>
                </button>
                <Link
                  to="/"
                  className="flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform border-2 text-gray-700 hover:scale-105 text-center"
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
                </Link>
              </div>

              {!agreedToRules && (
                <p className="text-center text-sm text-red-600 mt-4">
                  You must accept the rules to start the exam
                </p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 rounded-r-xl p-6 border-l-4" style={{
            backgroundColor: '#e3f2fd',
            borderColor: '#024890'
          }}>
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-1" style={{ color: '#024890' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Important Information</h4>
                <p className="text-gray-700 text-sm">
                  This practice exam is designed to assess your readiness for the real exam.
                  The results are visible only to you and are not official scores.
                  At the end of the exam, you will receive detailed results and recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MockExamPage;