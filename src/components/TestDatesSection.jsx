import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/api';

const TestDatesSection = ({ onDateSelect }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [testDates, setTestDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);

  // Fetch test dates from API
  useEffect(() => {
    const fetchDates = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getDates();

        // Transform API data to match our component format
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const formattedDates = response.map(date => {
          const dateObj = new Date(date.date);
          const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];

          return {
            id: date.id,
            month: monthNames[dateObj.getMonth()],
            day: dateObj.getDate().toString(),
            year: dateObj.getFullYear().toString(),
            available: date.spots_left,
            isFull: date.is_full,
            maxSpots: date.max_spots,
            time: date.time,
            location: date.location,
            originalDate: date.date,
            address: 'Webster University',
            dateObj
          };
        }).filter(date => date.dateObj >= today && !date.isFull).slice(0, 4);

        setTestDates(formattedDates);
        setError(null);
      } catch (err) {
        console.error('Error fetching dates:', err);
        setError('Failed to load test dates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      id="test-dates"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Title with Animation */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            style={{ transitionDelay: '0.2s' }}
          >
            Upcoming Test Dates
          </h2>
          <p
            className={`text-xl text-gray-300 max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            style={{ transitionDelay: '0.4s' }}
          >
            Choose a date that works best for you and register now
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-300 text-lg">{error}</p>
          </div>
        )}

        {/* Test Dates Grid with Animation */}
        {/* Mobile Test Dates Grid (Cards) */}
        {!loading && !error && testDates.length > 0 && (
          <>
            {/* Mobile Test Dates List (Horizontal Cards) */}
            <div className="flex flex-col gap-3 md:hidden">
              {testDates.map((date, index) => (
                <div
                  key={date.id}
                  onClick={() => !date.isFull && onDateSelect(date)}
                  className={`bg-[#1f2937]/90 backdrop-blur-sm rounded-2xl border border-white/10 p-4 flex items-center justify-between active:scale-95 transition-all duration-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${0.1 + (index * 0.1)}s` }}
                >
                  {/* Left: Date */}
                  <div className="flex items-center gap-2 min-w-[30%]">
                    <span className="text-4xl font-bold text-white">{date.day}</span>
                    <span className="text-[#f5b706] text-xs font-bold uppercase mt-1">{date.month.substring(0, 3)}</span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-10 bg-white/10 mx-2"></div>

                  {/* Middle: Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className={`flex items-center gap-2 text-xs mb-1 ${date.time && date.time.length > 10 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      <svg className={`w-3.5 h-3.5 ${date.time && date.time.length > 10 ? 'text-yellow-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {date.time && date.time.length > 10 ? 'To be announced' : (date.time || '09:00')}
                    </div>
                    {date.location && (
                      <div className="flex items-center gap-1.5 bg-[#f5b706]/10 border border-[#f5b706]/30 rounded-md px-2 py-1 w-fit mb-1">
                        <svg className="w-3.5 h-3.5 text-[#f5b706] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[#f5b706] text-xs font-semibold capitalize">{date.location}</span>
                      </div>
                    )}
                    {date.isFull ? (
                      <span className="flex items-center gap-1 text-red-400 text-[10px] font-medium bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Full
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-400 text-[10px] font-medium bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {date.available} Places Left
                      </span>
                    )}
                  </div>

                  {/* Right: Action Button */}
                  <div className="ml-2">
                    <button
                      disabled={date.isFull}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${date.isFull ? 'bg-gray-700 text-gray-400' : 'bg-[#024890] text-white hover:bg-[#023e7d]'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Test Dates Grid (4 Cols) */}
            <div className="hidden md:grid grid-cols-4 gap-6">
              {testDates.map((date, index) => (
                <div
                  key={date.id}
                  className={`bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-200 ease-in-out group cursor-pointer overflow-hidden flex flex-col ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    } ${date.isFull ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/20 hover:-translate-y-2 hover:shadow-2xl'}`}
                  style={{ transitionDelay: `${0.6 + (index * 0.1)}s` }}
                  onClick={() => !date.isFull && onDateSelect(date)}
                >
                  <div className="flex flex-col items-center p-6 gap-4 h-full text-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-5xl font-bold text-white tracking-tighter">
                        {date.day}
                      </span>
                      <span className="text-[#f5b706] font-bold text-base uppercase tracking-wider">
                        {date.month.substring(0, 3)}
                      </span>
                    </div>

                    <div className="w-full h-px bg-white/10 my-2"></div>

                    <div className="flex flex-col items-center gap-2.5 flex-1">
                      {date.time && (
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${date.time.length > 10 ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {date.time.length > 10 ? 'To be announced' : date.time}
                        </div>
                      )}
                      {date.isFull ? (
                        <span className="inline-flex items-center gap-1.5 text-red-400 text-sm font-semibold bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          Full
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-semibold bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          {date.available} Places Left
                        </span>
                      )}
                      {date.location && (
                        <div className="flex items-center gap-1.5 bg-[#f5b706]/10 border border-[#f5b706]/30 rounded-lg px-3 py-1.5 mt-1">
                          <svg className="w-4 h-4 text-[#f5b706] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[#f5b706] text-sm font-semibold capitalize">{date.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Register Button */}
                    <div className="w-full mt-auto pt-4 hidden md:block">
                      <button
                        disabled={date.isFull}
                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center ${date.isFull
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-[#024890] hover:bg-[#023e7d] text-white hover:scale-105'
                          }`}
                      >
                        {date.isFull ? 'Full' : 'Register'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}


        {/* No dates available */}
        {!loading && !error && testDates.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-yellow-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-yellow-300 text-lg">No test dates available at the moment. Please check back later.</p>
          </div>
        )}

        {/* Bottom Info with Animation */}
        {!loading && !error && testDates.length > 0 && (
          <div
            className={`text-center mt-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            style={{ transitionDelay: '1s' }}
          >
            <button
              onClick={() => navigate('/test-dates')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl mb-6"
              style={{ backgroundColor: '#024890', color: '#fff' }}
            >
              View All Test Dates
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-gray-400 mb-4">
              Can't find a suitable date? Contact us for more options.
            </p>
            <a
              href="mailto:skuzimurod@webster.edu"
              className="inline-flex items-center gap-2 text-[#f5b706] hover:text-[#d49a05] transition-colors font-semibold"
            >
              Contact Support
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestDatesSection;