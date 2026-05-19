import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpInfoModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      navigate('/auth');
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative ${
          isClosing ? 'modal-content-exit' : 'modal-content-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#024890]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Application Process
          </h3>

          {/* Message */}
          <div className="text-left bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4 leading-relaxed">
              To register for the Michigan Test, you need to:
            </p>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold text-[#024890] mr-2">1.</span>
                <span>Visit Webster University's official website and complete the application form</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-[#024890] mr-2">2.</span>
                <span>Wait for your application to be reviewed and approved</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-[#024890] mr-2">3.</span>
                <span>Once selected, you'll receive access credentials to register and take the test</span>
              </li>
            </ol>
          </div>

          {/* Important note */}
          <div className="bg-yellow-50 border-l-4 border-[#f5b706] p-4 mb-6 text-left">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-[#f5b706] mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-800 font-medium">
                Important: You can only register for the test after your application is approved by Webster University
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://apply.webster.uz/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Save to localStorage when going to Webster website
                localStorage.setItem('websterApplicationStarted', 'true');
                localStorage.setItem('websterApplicationTime', new Date().toISOString());
                // Close modal after clicking
                handleClose();
              }}
              className="flex-1 bg-[#024890] hover:bg-[#023a70] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-center"
            >
              Go to Webster Website
            </a>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpInfoModal;