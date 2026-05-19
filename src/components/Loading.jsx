import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8 animate-bounce">
          <div className="w-24 h-24 bg-[#024890] rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-white font-bold text-5xl">W</span>
          </div>
        </div>

        {/* University Name */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Webster University Tashkent</h1>
        {/* <p className="text-lg text-gray-600 mb-8">Michigan Test Center</p> */}

        {/* Loading Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-500 text-sm mb-12">Loading, please wait...</p>

        {/* Creator Credit */}
        <div className="pt-8 border-t border-gray-300">
          {/* <p className="text-gray-600 text-sm">
            Created by <span className="text-[#024890] font-semibold">Muslima Ikramovna</span>
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default Loading;