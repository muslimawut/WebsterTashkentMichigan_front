import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/api';
import { sanitizeUrl } from '../utils/sanitize';
import clicklogo from '../../clicklogo.svg';
import paymelogo from '../../payme.svg';
import xaznalogo from '../../xazna.png';

const PaymentModal = ({ isOpen, selectedDate, onClose }) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [promocode, setPromocode] = useState('');
  const [confirmedMessage, setConfirmedMessage] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.dispatchEvent(new CustomEvent('payment-modal-open'));
    } else {
      document.body.style.overflow = 'unset';
      document.dispatchEvent(new CustomEvent('payment-modal-close'));
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.dispatchEvent(new CustomEvent('payment-modal-close'));
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;
  if (!selectedDate) return null;

  const hasPromocode = promocode.trim().length > 0;
  const canSubmit = hasPromocode || !!paymentMethod;

  const handlePayment = async () => {
    if (!canSubmit) return;
    try {
      setIsProcessing(true);

      // Promocode kiritilgan bo'lsa — promocode yo'lidan ketamiz (Payme kerak emas)
      if (hasPromocode) {
        const response = await api.createOrder('promocode', 650000, selectedDate.id, promocode);

        // waived: true — to'lov bekor qilindi, booking tasdiqlandi
        if (response.waived) {
          setConfirmedMessage(response.message || 'Payment waived via promocode. Your booking is confirmed.');
          setIsProcessing(false);
          return;
        }
        // Kutilmagan holat: waived emas, lekin xato ham emas — modalni yopamiz
        handleModalClose();
        return;
      }

      // Oddiy oqim: Payme va h.k. — payment_url ga yo'naltiramiz
      const response = await api.createOrder(paymentMethod, 650000, selectedDate.id);

      const safeUrl = sanitizeUrl(response.payment_url);
      if (safeUrl) {
        window.location.href = safeUrl;
      } else {
        // If no payment URL (e.g. for cash or other future methods), just close
        handleModalClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      // Promocode xatolari (Invalid promocode va h.k.) interceptor orqali toast'da ko'rsatiladi

      // Check for various forms of auth error
      const isAuthError =
        error?.message?.toLowerCase().includes('authentication credentials') ||
        error?.response?.status === 401 ||
        error?.response?.data?.detail?.toLowerCase().includes('authentication') ||
        error?.message?.toLowerCase().includes('401');

      if (isAuthError) {
        // Close modal without delay to prevent state updates on unmount
        setIsClosing(true);
        onClose();
        navigate('/auth?tab=signup');
        return;
      }
      setIsProcessing(false); // Only stop processing if not redirecting
    }
  };

  const handleModalClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setPaymentMethod('');
      setPromocode('');
      setConfirmedMessage('');
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const paymentOptions = [
    {
      name: 'Payme',
      icon: paymelogo,
      description: 'Pay with Payme'
    },
    {
      name: 'Click',
      icon: clicklogo,
      description: 'Pay with Click'
    },
    {
      name: 'Xazna',
      icon: xaznalogo,
      description: 'Pay with Xazna'
    }
  ];

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm
        flex items-end sm:items-center sm:justify-center sm:p-4
        ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleModalClose}
    >
      {/* Modal */}
      <div
        className={`
          bg-gray-900 w-full relative shadow-2xl overflow-y-auto
          rounded-t-3xl sm:rounded-3xl
          max-h-[88vh] sm:max-h-[90vh] sm:max-w-lg
          ${isClosing ? 'sheet-exit sm:animate-slideDown' : 'sheet-enter sm:animate-slideUp'}
        `}
        style={{ minHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Close button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-gray-300 transition-colors p-2 z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8" style={{ paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom) + 2rem))' }}>
          {confirmedMessage ? (
            /* ── Booking confirmed (promocode bilan to'lov bekor qilindi) ── */
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <svg className="w-11 h-11 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Booking Confirmed!</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-2 max-w-sm">{confirmedMessage}</p>
              <div className="bg-gray-800 rounded-2xl px-5 py-3 my-5 flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-semibold text-white text-sm">{selectedDate.month} {selectedDate.day}, {selectedDate.year}</p>
              </div>
              <button
                onClick={() => {
                  handleModalClose();
                  navigate('/profile');
                }}
                className="w-full py-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all"
              >
                View My Bookings
              </button>
              <button
                onClick={handleModalClose}
                className="mt-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
          <>
          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 pr-8">Complete Payment</h2>
          <p className="text-gray-400 text-sm mb-6 sm:mb-8">Secure payment for your test registration</p>

          {/* Test Details - Dark Card */}
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex flex-row items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Test Date</p>
                  <p className="font-semibold text-white text-sm sm:text-base">{selectedDate.month} {selectedDate.day}, {selectedDate.year}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm text-gray-400">Amount</p>
                <p className="font-bold text-white text-sm sm:text-base">650,000 UZS</p>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-300">Webster University</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-300 mb-4">Select payment method</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {paymentOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    if (option.name === 'Click' || option.name === 'Xazna') {
                      toast.info('Coming soon');
                      return;
                    }
                    setPaymentMethod(option.name);
                  }}
                  className={`group relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 flex sm:block items-center gap-4 sm:gap-0 ${paymentMethod === option.name
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-750'
                    }`}
                >
                  {/* Icon Container */}
                  <div className="relative w-12 h-12 sm:w-full sm:aspect-square sm:mb-3 flex items-center justify-center rounded-xl p-1 overflow-hidden shrink-0 bg-white/5 sm:bg-transparent">
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="w-8 h-8 sm:w-full sm:h-full object-contain"
                    />
                  </div>

                  {/* Name */}
                  <p className={`text-sm font-semibold text-left sm:text-center transition-colors flex-1 ${paymentMethod === option.name ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'
                    }`}>
                    {option.name}
                  </p>

                  {/* Selected Indicator */}
                  {paymentMethod === option.name && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:top-2 sm:translate-y-0 sm:right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>


          {/* Promocode (optional) — highlighted so it's hard to miss */}
          <div className={`mb-6 rounded-2xl p-4 sm:p-5 border-2 transition-all ${hasPromocode
            ? 'bg-blue-500/10 border-blue-500/50'
            : 'bg-blue-500/5 border-blue-500/30 border-dashed'
            }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/30">
                {/* Ticket / tag icon */}
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 9V4a1 1 0 011-1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm whitespace-nowrap">
                  <span className="font-bold text-white">Have a promo code?</span>{' '}
                 
                </p>
              </div>
            </div>
            <input
              type="text"
              value={promocode}
              onChange={(e) => setPromocode(e.target.value.toUpperCase())}
              disabled={isProcessing}
              placeholder="ENTER PROMOCODE"
              className="w-full px-4 py-3.5 bg-gray-900/60 border-2 border-blue-500/40 rounded-xl text-white placeholder-gray-500 tracking-wider uppercase font-semibold text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
            {hasPromocode && (
              <p className="text-xs text-green-400 mt-3 flex items-center justify-center gap-1.5 font-medium">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                A valid promocode waives the payment — no card needed.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={handlePayment}
            disabled={!canSubmit || isProcessing}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${canSubmit && !isProcessing
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              hasPromocode ? 'Confirm with Promocode' : (paymentMethod ? `Pay with ${paymentMethod}` : 'Select a payment method')
            )}
          </button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-center">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-400">Secure payment powered by Webster University</p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PaymentModal;