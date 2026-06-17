import React, { useState } from 'react';
import logo from '../../logobluewebster.png';
import ApiService from '../api/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  );
  const redirectPath = searchParams.get('redirect') || '/';
  const [signUpStep, setSignUpStep] = useState(1);
  const [selectedDegree, setSelectedDegree] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [formData, setFormData] = useState({
    // Sign In
    signInEmail: '',
    signInPassword: '',
    // Sign Up
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    verificationCode: '',
    passportCode: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Scroll to top when page opens
  React.useEffect(() => {
    window.scrollTo(0, 0);

    // Ro'yxatdan o'tib, hali emailini tasdiqlamagan bo'lsa — sahifa yangilansa ham
    // tasdiqlash ekranida qoldiramiz (qayta ro'yxatdan o'tib yurmasligi uchun)
    try {
      const pending = JSON.parse(localStorage.getItem('pendingActivation') || 'null');
      if (pending?.email) {
        setActiveTab('signup');
        setSelectedDegree(pending.degree || '');
        setSignUpStep(2);
        setRegistrationComplete(true);
        setFormData((prev) => ({
          ...prev,
          email: pending.email,
          firstName: pending.firstName || '',
          lastName: pending.lastName || '',
          phone: pending.phone || '',
        }));
      }
    } catch {
      // noto'g'ri JSON bo'lsa e'tiborsiz qoldiramiz
    }
  }, []);

  // Show notification helper


  const showNotification = (message, type = 'success') => {
    // Agar xabar string bo‘lsa — \n ni <br/>ga aylantiramiz
    const formattedMessage = typeof message === 'string'
      ? message.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < message.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))
      : message; // agar JSX bo‘lsa, to‘g‘ridan-to‘g‘ri chiqadi

    const options = {
      position: "top-right",
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    };

    switch (type) {
      case 'success': toast.success(formattedMessage, options); break;
      case 'error': toast.error(formattedMessage, options); break;
      case 'warning': toast.warning(formattedMessage, options); break;
      case 'info': toast.info(formattedMessage, options); break;
      default: toast(formattedMessage, options);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Password validation
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('At least 8 characters required');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least 1 uppercase letter required');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least 1 lowercase letter required');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least 1 number required');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('At least 1 special character required (!@#$%^&*)');
    }
    setPasswordErrors(errors);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await ApiService.login(formData.signInEmail, formData.signInPassword);

      localStorage.setItem('authToken', response.access || response.token);
      localStorage.setItem('userLoggedIn', 'true');
      localStorage.setItem('userEmail', formData.signInEmail);
      localStorage.removeItem('currentPage'); // Clear current page

      showNotification('Sign in successful!', 'success');
      setTimeout(() => {
        navigate(redirectPath); // redirect param bo'lsa o'sha sahifaga, bo'lmasa home
        window.location.reload(); // Reload to update navbar state
      }, 1000);
    } catch (error) {
      console.error('Sign in error:', error);

      // api.js already formatted the error message
      const errorMessage = error.message || 'Sign in failed. Please check your credentials.';

      showNotification(errorMessage, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleDegreeSelect = (degree) => {
    setSelectedDegree(degree);
    setSignUpStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Check password validation
    if (passwordErrors.length > 0) {
      showNotification('Please fulfill all password requirements!', 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match!', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        passportId: formData.passportCode,
        isBachelor: selectedDegree === 'Bachelor',
        password: formData.password
      };

      // Register the user
      const response = await ApiService.register(userData);

      // If registration is successful (200), show verification code input
      if (response) {
        // Refresh'da yo'qolmasligi uchun "tasdiqlash kutilmoqda" holatini saqlaymiz
        localStorage.setItem('pendingActivation', JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          degree: selectedDegree,
        }));
        setRegistrationComplete(true);
        showNotification('Registration successful! A verification code has been sent to your email.', 'success');
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Registration error:', error);

      // "already exists" — bu odam allaqachon ro'yxatdan o'tgan.
      // Xato ko'rsatib qo'ya qolmay, uni Sign In tab'iga yo'naltiramiz.
      const alreadyExists = /already exists/i.test(error.message || '');
      if (alreadyExists) {
        showNotification(
          'You already have an account with these details. Please sign in instead.',
          'info'
        );
        setActiveTab('signin');
        setSignUpStep(1);
        setRegistrationComplete(false);
        setSelectedDegree('');
        localStorage.removeItem('pendingActivation');
        // Kiritilgan emailni Sign In formasiga oldindan to'ldiramiz
        setFormData((prev) => ({ ...prev, signInEmail: prev.email, signInPassword: '' }));
      } else {
        // api.js already formatted the error message
        showNotification(error.message, 'error');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyActivation = async (e) => {
    e.preventDefault();

    if (!formData.verificationCode) {
      showNotification('Please enter the verification code', 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.verifyActivationCode(formData.email, formData.verificationCode);

      // Save tokens to localStorage
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userEmail', formData.email);
        localStorage.removeItem('currentPage'); // Clear current page
      }

      // Tasdiqlash tugadi — pending holatni o'chiramiz
      localStorage.removeItem('pendingActivation');

      showNotification('Account activated successfully! Redirecting...', 'success');

      setTimeout(() => {
        navigate(redirectPath);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Verification error:', error);

      // api.js already formatted the error message
      const errorMessage = error.message || 'Invalid verification code. Please try again.';

      showNotification(errorMessage, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 page-enter flex flex-col">
      <div className="container mx-auto px-4 py-4 sm:py-6 flex flex-col min-h-screen">
        {/* Header - Fixed height to ensure calculation is correct if needed, but flex handles it */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 shrink-0">
          <button

            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-[#024890] transition-colors bg-white/50 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-white/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline font-medium ml-2">Back to Home</span>
          </button>
          <img src={logo} alt="Webster University" className="h-10 sm:h-16 w-auto" />
        </div>

        {/* Main Content - Force Center */}
        <div className="flex-grow flex flex-col justify-center items-center w-full pb-8">
          <div className="w-full max-w-5xl">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                {/* Left Side - Image/Info (Hidden on Mobile) */}
                <div className="hidden md:flex bg-gradient-to-br from-[#024890] to-[#023a70] p-8 lg:p-12 text-white flex-col justify-center relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-white/10 blur-2xl"></div>

                  <div className="relative z-10 mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold mb-4">Welcome to Webster University Tashkent</h1>
                    <p className="text-blue-100 text-base lg:text-lg opacity-90">
                      Take Webster University Tashkent's internal English placement test and begin your academic journey with confidence.
                    </p>
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-start">
                      <div className="bg-white/10 rounded-xl p-3 mr-4 backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Accredited Testing</h3>
                        <p className="text-blue-100 text-sm opacity-80">Reliable English placement assessment for applicants and students</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-white/10 rounded-xl p-3 mr-4 backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Flexible Scheduling</h3>
                        <p className="text-blue-100 text-sm opacity-80">Choose a convenient test date that works for you</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-white/10 rounded-xl p-3 mr-4 backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Fast Results</h3>
                        <p className="text-blue-100 text-sm opacity-80">Receive your test results quickly and securely</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Auth Forms */}
                <div className="p-6 sm:p-8 lg:p-12 bg-white">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 mb-6 sm:mb-8 bg-gray-50/50 rounded-xl p-1">
                    <button
                      onClick={() => {
                        setActiveTab('signin');
                        setSignUpStep(1);
                        setRegistrationComplete(false);
                        setSelectedDegree('');
                        localStorage.removeItem('pendingActivation');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${activeTab === 'signin'
                        ? 'bg-white text-[#024890] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                        }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('signup');
                        setSignUpStep(1);
                        setRegistrationComplete(false);
                        setSelectedDegree('');
                        localStorage.removeItem('pendingActivation');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${activeTab === 'signup'
                        ? 'bg-white text-[#024890] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                        }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Sign In Form */}
                  {activeTab === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <input
                            type="email"
                            name="signInEmail"
                            value={formData.signInEmail}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#024890]/20 focus:border-[#024890] outline-none transition-all disabled:opacity-50"
                            placeholder="your.email@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <input
                            type={showSignInPassword ? "text" : "password"}
                            name="signInPassword"
                            value={formData.signInPassword}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#024890]/20 focus:border-[#024890] outline-none transition-all disabled:opacity-50"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                            disabled={loading}
                          >
                            {showSignInPassword ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="remember"
                            className="h-4.5 w-4.5 text-[#024890] focus:ring-[#024890] border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                            Remember me
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-[#024890] hover:text-blue-700 font-semibold"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#024890] hover:bg-[#023e7d] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 mt-4"
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>
                  )}

                  {/* Sign Up Form */}
                  {activeTab === 'signup' && (
                    <div>
                      {/* Step 1: Degree Selection - ORIGINAL UI */}
                      {signUpStep === 1 && (
                        <div className="text-center">
                          <h2 className="text-2xl sm:text-3xl font-bold text-[#024890] mb-2">Choose your path</h2>
                          <p className="text-gray-500 mb-8 sm:mb-10 text-sm sm:text-base">Select the degree you are applying for</p>

                          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-10">
                            {/* Bachelor Card */}
                            <button
                              onClick={() => setSelectedDegree('Bachelor')}
                              className={`relative p-4 sm:p-8 rounded-2xl border-2 transition-all hover:shadow-lg group text-left sm:text-center ${selectedDegree === 'Bachelor'
                                ? 'border-[#024890] bg-blue-50/50'
                                : 'border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-white'
                                }`}
                            >
                              {selectedDegree === 'Bachelor' && (
                                <div className="absolute top-2 right-2 sm:-top-3 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-[#024890] rounded-full flex items-center justify-center animate-fade-in">
                                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              <div className="mb-3 sm:mb-6">
                                <svg className={`w-10 h-10 sm:w-16 sm:h-16 sm:mx-auto transition-colors ${selectedDegree === 'Bachelor' ? 'text-[#024890]' : 'text-gray-400 group-hover:text-[#024890]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                </svg>
                              </div>

                              <h3 className={`text-base sm:text-lg font-bold uppercase tracking-wide transition-colors ${selectedDegree === 'Bachelor' ? 'text-[#024890]' : 'text-gray-600 group-hover:text-[#024890]'}`}>
                                Bachelor
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">Undergraduate</p>
                            </button>

                            {/* Master Card */}
                            <button
                              onClick={() => setSelectedDegree('Master')}
                              className={`relative p-4 sm:p-8 rounded-2xl border-2 transition-all hover:shadow-lg group text-left sm:text-center ${selectedDegree === 'Master'
                                ? 'border-[#024890] bg-blue-50/50'
                                : 'border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-white'
                                }`}
                            >
                              {selectedDegree === 'Master' && (
                                <div className="absolute top-2 right-2 sm:-top-3 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-[#024890] rounded-full flex items-center justify-center animate-fade-in">
                                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <div className="mb-3 sm:mb-6">
                                <svg className={`w-10 h-10 sm:w-16 sm:h-16 sm:mx-auto transition-colors ${selectedDegree === 'Master' ? 'text-[#024890]' : 'text-gray-400 group-hover:text-[#024890]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>

                              <h3 className={`text-base sm:text-lg font-bold uppercase tracking-wide transition-colors ${selectedDegree === 'Master' ? 'text-[#024890]' : 'text-gray-600 group-hover:text-[#024890]'}`}>
                                Master
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">Graduate</p>
                            </button>
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => {
                              if (selectedDegree) {
                                handleDegreeSelect(selectedDegree);
                              } else {
                                showNotification('Please select a degree program', 'warning');
                              }
                            }}
                            disabled={!selectedDegree || loading}
                            className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-base sm:text-lg text-white transition-all inline-flex items-center justify-center ${selectedDegree
                              ? 'bg-[#f5b706] hover:bg-[#d9a406] shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                              : 'bg-gray-200 cursor-not-allowed text-gray-400'
                              }`}
                          >
                            Continue
                            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Step 2: Registration Form */}
                      {signUpStep === 2 && !registrationComplete && (
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                          <p className="text-sm text-gray-600 mb-6">
                            Applying for: <span className="font-semibold text-[#024890]">{selectedDegree}'s Degree</span>
                          </p>

                          <form onSubmit={handleSignUp} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  required
                                  disabled={loading}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition disabled:opacity-50"
                                  placeholder="First name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  required
                                  disabled={loading}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition disabled:opacity-50"
                                  placeholder="Last name"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition disabled:opacity-50"
                                placeholder="your.email@example.com"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition disabled:opacity-50"
                                placeholder="+998 90 123 45 67"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Passport Number
                              </label>
                              <input
                                type="text"
                                name="passportCode"
                                value={formData.passportCode}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition disabled:opacity-50"
                                placeholder="AA1234567"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  name="password"
                                  value={formData.password}
                                  onChange={handleInputChange}
                                  required
                                  disabled={loading}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition pr-12 disabled:opacity-50"
                                  placeholder="Create a strong password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                  disabled={loading}
                                >
                                  {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              {formData.password && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                                  {passwordErrors.length > 0 ? (
                                    <ul className="space-y-1">
                                      {passwordErrors.map((error, index) => (
                                        <li key={index} className="text-sm text-red-600 flex items-start">
                                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                          </svg>
                                          {error}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-green-600 flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Password is strong!
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  name="confirmPassword"
                                  value={formData.confirmPassword}
                                  onChange={handleInputChange}
                                  required
                                  disabled={loading}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none transition pr-12 disabled:opacity-50"
                                  placeholder="Confirm your password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                  disabled={loading}
                                >
                                  {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-sm text-red-600 mt-2 flex items-start">
                                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  Passwords do not match
                                </p>
                              )}
                              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <p className="text-sm text-green-600 mt-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Passwords match
                                </p>
                              )}
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-[#024890] to-[#024890] hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                              {loading ? 'Creating Account...' : 'Complete Registration'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSignUpStep(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              disabled={loading}
                              className="w-full text-[#024890] hover:text-blue-700 font-medium py-2 disabled:opacity-50"
                            >
                              ← Back to degree selection
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Step 2: After Registration - Verification Code */}
                      {signUpStep === 2 && registrationComplete && (
                        <div>
                          <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h3>
                            <p className="text-gray-600 text-sm">
                              A verification code has been sent to<br />
                              <span className="font-semibold text-gray-900">{formData.email}</span>
                            </p>
                          </div>

                          {/* Display user info */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phone:</span>
                              <span className="font-medium text-gray-900">{formData.phone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Degree:</span>
                              <span className="font-medium text-gray-900">{selectedDegree}'s</span>
                            </div>
                          </div>

                          <form onSubmit={handleVerifyActivation} className="space-y-4">
                            {/* Verification Code Input */}
                            <div className="bg-blue-50 p-6 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Enter Verification Code
                              </label>
                              <input
                                type="text"
                                name="verificationCode"
                                value={formData.verificationCode}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#024890] focus:border-transparent outline-none text-center text-lg font-semibold disabled:opacity-50"
                                placeholder="000000"
                                maxLength={6}
                              />
                              <p className="text-xs text-gray-600 mt-3">
                                Check your email inbox for the 6-digit verification code
                              </p>
                            </div>

                            <button
                              type="submit"
                              disabled={loading || !formData.verificationCode}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                              {loading ? 'Verifying...' : 'Verify & Activate Account'}
                            </button>

                            <p className="text-sm text-gray-600 text-center">
                              Didn't receive the code?{' '}
                              <button
                                type="button"
                                onClick={() => toast.info('Resend functionality will be implemented')}
                                className="text-[#024890] hover:text-blue-700 font-medium"
                                disabled={loading}
                              >
                                Resend
                              </button>
                            </p>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />

        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default AuthPage;