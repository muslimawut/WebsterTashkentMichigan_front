import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  BarChart3,
  Settings,
  ArrowLeft,
  CheckCircle,
  Edit3,
  X,
  Save,
  Mail,
  Phone,
  CreditCard,
  Cake,
  Calendar,
  ChevronRight,
  AlertCircle,
  Key,
  LogOut,
  Award,
  TrendingUp
} from 'lucide-react';
import ApiService from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChangePasswordModal from './ChangePasswordModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formatBookingDateTime = (dateStr, timeStr) => {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const datePart = `${months[month - 1]} ${day}, ${year}`;

  if (!timeStr || timeStr.length > 10) return datePart;

  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const min = minStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${datePart} at ${hour12}:${min} ${ampm}`;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passport: '',
    degree: '',
    image: null,
    // Exam Results
    listening_score: null,
    gvr_score: null,
    writing_score: null,
    total_score: null,
    cefr_level: null,
    // Bookings
    bookings: []
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setIsVisible(true), 100);
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const profile = await ApiService.getProfile();

      setUserData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        passport: profile.passport_id || '',
        degree: profile.is_bachelor ? 'Bachelor' : 'Master',
        image: profile.image || null,
        
        // Exam Results
        listening_score: profile.listening_score,
        gvr_score: profile.gvr_score,
        writing_score: profile.writing_score,
        total_score: profile.total_score,
        cefr_level: profile.cefr_level,

        // Bookings - ensure it's an array
        bookings: Array.isArray(profile.bookings) ? profile.bookings : []
      });
    } catch (error) {
      setError('Failed to load profile data. Please try again.');
      showNotification('Failed to load profile data. Please try again.', 'error');
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    const options = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'info':
        toast.info(message, options);
        break;
      default:
        toast(message, options);
    }
  };

  // testHistory removed as it is now dynamic from API

  const handleInputChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }

      setUserData({
        ...userData,
        image: file
      });

      showNotification('Image selected. Click Save to update your profile.', 'info');
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        showNotification('Session expired. Please login again.', 'error');
        return;
      }

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('first_name', userData.firstName);
      formData.append('last_name', userData.lastName);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('passport_id', userData.passport);
      formData.append('is_bachelor', userData.degree === 'Bachelor');

      // Add image if it exists and is a File object
      if (userData.image && userData.image instanceof File) {
        formData.append('image', userData.image);
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type, browser will set it automatically with boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();

      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');

      // Reload profile to get updated data
      await loadUserProfile();
    } catch (error) {
      showNotification(error.message || 'Failed to update profile. Please try again.', 'error');
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear all stored data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('currentPage');

      // Redirect to home
      window.location.href = '/';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (score >= 80) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (score >= 70) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
    return 'bg-gradient-to-r from-red-500 to-orange-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 page-enter">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium hidden sm:inline">Back to Home</span>
            </button>
            <h1 className="text-xl font-bold text-white">My Profile</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header Card */}
        <div className={`bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-6 md:p-10 mb-8 border border-blue-500/20 shadow-2xl transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl">
                {userData.image && typeof userData.image === 'string' ? (
                  <img
                    src={userData.image}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-gray-900"
                  />
                ) : userData.image instanceof File ? (
                  <img
                    src={URL.createObjectURL(userData.image)}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-gray-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center border-4 border-gray-900">
                    <User className="w-16 h-16 md:w-20 md:h-20 text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all group-hover:scale-110 border-4 border-gray-900">
                  <Edit3 className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={saveLoading}
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                <span>{userData.firstName}</span> <span>{userData.lastName}</span>
              </h2>
              <p className="text-gray-400 text-lg mb-4 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-5 h-5" />
                {userData.email}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {/* <span className="px-5 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {userData.degree} Student
                </span> */}
                <span className="px-5 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold border border-green-500/30 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <Edit3 className="w-5 h-5" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Save/Cancel Buttons when editing */}
          {isEditing && (
            <div className="flex gap-3 mt-6 justify-center md:justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadUserProfile(); // Reset to original data
                }}
                disabled={saveLoading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`flex gap-3 mb-8 overflow-x-auto pb-2 transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'history', label: 'Test History', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap border-2 ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                <IconComponent className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className={`bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-1">Personal Information</h3>
              <p className="text-gray-400 text-sm">Manage your personal details and contact information</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: 'First Name', name: 'firstName', type: 'text', icon: User },
                { label: 'Last Name', name: 'lastName', type: 'text', icon: User },
                { label: 'Email', name: 'email', type: 'email', icon: Mail },
                { label: 'Phone', name: 'phone', type: 'tel', icon: Phone },
                { label: 'Passport ID', name: 'passport', type: 'text', icon: CreditCard },
                { label: 'Degree Program', name: 'degree', type: 'text', icon: Award, disabled: true }
              ].map((field) => {
                const IconComponent = field.icon;
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-white" />
                      {field.label}
                    </label>
                    {isEditing && !field.disabled ? (
                      <input
                        type={field.type}
                        name={field.name}
                        value={userData[field.name]}
                        onChange={handleInputChange}
                        disabled={saveLoading}
                        className="w-full px-4 py-3.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    ) : (
                      <div className={`px-4 py-3.5 bg-gray-700/50 border-2 border-gray-600/50 rounded-xl font-medium text-gray-200 ${field.disabled ? 'opacity-60' : ''
                        }`}>
                        {userData[field.name] || 'Not provided'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Test History Tab */}
        {activeTab === 'history' && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const visibleBookings = (userData.bookings || []).filter(b => {
            const hasResult = b.total_score !== null || b.listening_score !== null;
            const isFuture = new Date(b.test_date) >= today;
            return hasResult || isFuture;
          });

          return (
            <div className="space-y-5">
              {visibleBookings.map((booking, index) => {
                const hasResult = booking.total_score !== null || booking.listening_score !== null;

                /* ── Completed card ── */
                if (hasResult) return (
                  <div
                    key={booking.id}
                    className={`bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 hover:border-gray-600 transition-all transform hover:scale-[1.01] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h4 className="text-xl font-bold text-white">Michigan Placement Test</h4>
                          <span className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Completed
                          </span>
                          {booking.decision && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${booking.decision === 'Pass' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              {booking.decision}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{formatBookingDateTime(booking.test_date, booking.time)}</span>
                          {booking.location && <span className="text-gray-500">· {booking.location}</span>}
                        </p>
                      </div>

                      <div className="text-center md:text-right bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20 min-w-[120px]">
                        <div className={`text-5xl font-bold ${getScoreColor(booking.total_score)} mb-1`}>
                          {booking.total_score ?? '—'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Level: <span className="font-bold text-white text-lg">{booking.cefr_level || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-6 mt-2">
                      <h5 className="text-base font-bold text-gray-200 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Section Scores
                      </h5>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: 'Listening', score: booking.listening_score },
                          { label: 'GVR',       score: booking.gvr_score },
                          { label: 'Writing',   score: booking.writing_score },
                        ].map(section => (
                          <div key={section.label} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-300">{section.label}</span>
                              <span className="text-lg font-bold text-white">{section.score ?? '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );

                /* ── Upcoming card ── */
                return (
                  <div
                    key={booking.id}
                    className={`bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 hover:border-gray-600 transition-all transform hover:scale-[1.01] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h4 className="text-xl font-bold text-white">Michigan Placement Test</h4>
                          <span className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            <Calendar className="w-3.5 h-3.5" />
                            Upcoming
                          </span>
                        </div>
                        <p className="text-gray-400 flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{formatBookingDateTime(booking.test_date, booking.time)}</span>
                          {booking.location && <span className="text-gray-500">· {booking.location}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-6 mt-2">
                      <div className="flex items-start gap-3 text-yellow-400 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-1">Test Reminder</p>
                          <p className="text-sm text-yellow-300/80">Please arrive 15 minutes early. Bring your passport and registration confirmation.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {visibleBookings.length === 0 && (
                <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Test History</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    You haven't taken any tests yet and have no upcoming bookings.
                  </p>
                  <button
                    onClick={() => navigate('/test-dates')}
                    className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Book a Test
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Security Settings */}
            <div className={`bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-1">Security Settings</h3>
                <p className="text-gray-400 text-sm">Manage your account security and privacy</p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 rounded-2xl border-2 border-blue-500/20 hover:border-blue-500/40 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                      <Key className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-lg mb-1">Change Password</p>
                      <p className="text-sm text-gray-400">Update your password regularly to keep your account secure</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Logout Section */}
            <div className={`bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-6 md:p-8 shadow-xl border-2 border-red-500/30 transform transition-all duration-500 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30 flex-shrink-0">
                  <LogOut className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-400 mb-2">Logout</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Sign out of your account. You'll need to sign in again to access your profile and test history.
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                <LogOut className="w-5 h-5" />
                Logout from Account
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default ProfilePage;