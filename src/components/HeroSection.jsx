import React from 'react';
import { useNavigate } from 'react-router-dom';
import webster from "../../webster.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Background Image */}
        <img
          src={webster}
          alt="Webster University"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Heading with Animation */}
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-8 leading-tight opacity-0 tracking-tight"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
            lineHeight: '1.2'
          }}
        >
          Webster University in Tashkent Internal Exam Portal
        </h1>

        {/* Description with Animation */}
        <p
          className="text-lg sm:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed opacity-0"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.4s forwards'
          }}
        >
          Official registration and payment platform for the Michigan English Placement Test (MEPT) at Webster University Tashkent.
          Register, pay, and check your results — all in one place.
        </p>

        {/* CTA Buttons with Animation */}
        <div
          className="relative z-40 flex flex-row gap-3 justify-center items-center opacity-0 w-full sm:w-auto"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.6s forwards'
          }}
        >
          <a
            href="https://webster.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4 py-3 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-lg font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-2xl flex items-center justify-center text-center whitespace-nowrap"
            style={{ backgroundColor: '#024890', color: '#fff' }}
          >
            START ENROLLMENT
          </a>
          <button
            onClick={() => navigate('/about')}
            className="flex-1 sm:flex-none px-4 py-3 sm:px-8 sm:py-4 bg-transparent border-2 border-white text-white rounded-lg text-sm sm:text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 hover:scale-105 transform shadow-lg text-center whitespace-nowrap"
          >
            LEARN MORE
          </button>
        </div>

        {/* Bottom Indicator with Animation */}
        <div
          className="absolute bottom-[-80px] left-1/2 transform -translate-x-1/2 opacity-0"
          style={{
            animation: 'fadeIn 1s ease-out 0.8s forwards'
          }}
        >
          <div className="flex flex-col items-center">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-white rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;