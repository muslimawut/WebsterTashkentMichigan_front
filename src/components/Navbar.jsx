import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../logowhitewebster.png';
import { Home, Calendar, Info, User, PenTool } from 'lucide-react';
import onlineexam from '../../online-exam.png';
const Navbar = ({ onSignUpClick, isLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Mobile pastki nav: pastga skrollda kichrayadi, tepaga skrollda asliga qaytadi
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const currentY = window.scrollY;
      // Yo'nalishni aniqlaymiz (kichik tebranishlar e'tiborga olinmaydi)
      if (Math.abs(currentY - lastY) > 6) {
        // Pastga + sahifa tepasidan biroz uzoqlashgan bo'lsa — kichrayadi
        setIsCompact(currentY > lastY && currentY > 80);
        lastY = currentY;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className="absolute top-11 left-0 right-0 z-50 pointer-events-none bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
          <div className="flex items-center justify-center h-20 relative">
            {/* Left Navigation - Absolute positioned */}
            <div className="hidden lg:flex items-center space-x-8 absolute left-0">
              <Link
                to="/about"
                className="text-white hover:text-[#f5b706] transition-colors duration-300 text-sm font-medium"
              >
                About Us
              </Link>
              <Link
                to="/test-dates"
                className="text-white hover:text-[#f5b706] transition-colors duration-300 text-sm font-medium"
              >
                Test Dates
              </Link>
              <Link
                to="/mock-exam"
                className="text-white hover:text-[#f5b706] transition-colors duration-300 text-sm font-medium"
              >
                Mock Exam
              </Link>
            </div>

            {/* Center Logo */}
            <Link to="/" className="flex-shrink-0 mt-[10px]">
              <img src={logo} width={120} height={120} alt="Webster University Logo" />
            </Link>

            {/* Right Navigation - Absolute positioned */}
            <div className="hidden lg:flex items-center space-x-8 absolute right-0">
              <Link
                to="/contract"
                className="text-white hover:text-[#f5b706] transition-colors duration-300 text-sm font-medium"
              >
                Contract
              </Link>
              {isLoggedIn ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#024890', color: '#fff' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
              ) : (
                <button
                  onClick={onSignUpClick}
                  className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#024890', color: '#fff' }}
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden pointer-events-none">
        <div className={`bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 text-gray-400 rounded-2xl flex justify-between items-end px-2 py-2 shadow-2xl pointer-events-auto max-w-sm mx-auto relative h-[70px] origin-bottom transition-all duration-300 ease-out ${isCompact ? 'scale-[0.78] opacity-80 translate-y-2' : 'scale-100 opacity-100 translate-y-0'}`}>

          {/* Home */}
          <Link to="/" className={`flex flex-col items-center justify-center w-14 pb-1 transition-colors ${isActive('/') ? 'text-white' : 'hover:text-gray-200'}`}>
            <Home size={22} className={isActive('/') ? 'text-blue-500' : ''} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>

          {/* Mock Exam */}
          <Link to="/mock-exam" className={`flex flex-col items-center justify-center w-14 pb-1 transition-colors ${isActive('/mock-exam') ? 'text-white' : 'hover:text-gray-200'}`}>
            <img src={onlineexam} className="w-[22px] h-[22px]" alt="Exam" />
            <span className="text-[10px] mt-1 font-medium">Mock Exam</span>
          </Link>

          {/* Center Action Button (Floating) - Dates */}
          <div className="relative -top-6 mx-2">
            <Link
              to="/test-dates"
              className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)] border-[6px] border-[#1a1a1a] transform transition-transform hover:scale-105 active:scale-95"
            >
              <Calendar className="text-white w-6 h-6" />
            </Link>
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-white w-max">Test Dates</span>
          </div>

          {/* About */}
          <Link to="/about" className={`flex flex-col items-center justify-center w-14 pb-1 transition-colors ${isActive('/about') ? 'text-white' : 'hover:text-gray-200'}`}>
            <Info size={22} className={isActive('/about') ? 'text-blue-500' : ''} />
            <span className="text-[10px] mt-1 font-medium">About</span>
          </Link>

          {/* Profile */}
          {isLoggedIn ? (
            <Link to="/profile" className={`flex flex-col items-center justify-center w-14 pb-1 transition-colors ${isActive('/profile') ? 'text-white' : 'hover:text-gray-200'}`}>
              <User size={22} className={isActive('/profile') ? 'text-blue-500' : ''} />
              <span className="text-[10px] mt-1 font-medium">Profile</span>
            </Link>
          ) : (
            <button onClick={onSignUpClick} className={`flex flex-col items-center justify-center w-14 pb-1 transition-colors hover:text-gray-200`}>
              <User size={22} />
              <span className="text-[10px] mt-1 font-medium">Login</span>
            </button>
          )}

        </div>
      </div>
    </>
  );
};

export default Navbar;