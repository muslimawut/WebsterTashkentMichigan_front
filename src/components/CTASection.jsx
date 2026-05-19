import React from 'react';

const CTASection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#024890]">
      <div className="max-w-[1440px] mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of successful test takers and achieve your certification goals today.
        </p>
        <button className="bg-white hover:bg-gray-100 text-[#024890] px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
          Create Your Account
        </button>
      </div>
    </section>
  );
};

export default CTASection;