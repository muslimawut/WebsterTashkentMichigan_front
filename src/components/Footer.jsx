import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../logowhitewebster.png';
const Footer = () => {
  const navigate = useNavigate();
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center md:text-left">
          {/* Brand/Logo Section */}
          <div className="flex flex-col items-center md:items-start">
            {/* <h3 className="text-white font-semibold text-lg mb-4">Webster University</h3> */}
            <img
              src={logo}
              width={200}
              height={200}
              alt="Webster University Logo"
              className="mb-4 md:mb-0 opacity-90 hover:opacity-100 transition-opacity"
            />
            <p className="text-sm text-gray-400 max-w-xs mx-auto md:mx-0 mt-4 leading-relaxed">
              Official Michigan English Placement Test Center providing quality language assessment services for students.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-12 h-1 bg-[#024890] rounded-full"></span>
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/test-dates"
                  className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Test Dates
                </Link>
              </li>
              <li>
                <Link
                  to="/mock-exam"
                  className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Mock Exam
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => scrollToSection('preparation-materials'), 100);
                  }}
                  className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Preparation Materials
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-12 h-1 bg-[#f5b706] rounded-full"></span>
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col items-center md:items-start gap-1">
                <span className="text-gray-500 font-medium">Email Support</span>
                <a href="mailto:skuzimurodov@webster.edu" className="text-white hover:text-[#f5b706] transition-colors font-medium">
                  skuzimurodov@webster.edu
                </a>
              </li>
              <li className="flex flex-col items-center md:items-start gap-1">
                <span className="text-gray-500 font-medium">Phone Number</span>
                <a href="tel:+998555030066" className="text-white hover:text-[#f5b706] transition-colors font-medium">
                  +998 55 503 00 66
                </a>
              </li>
              <li className="flex flex-col items-center md:items-start gap-1">
                <span className="text-gray-500 font-medium">Location</span>
                <a
                  href="https://maps.google.com/?q=13+Navoi+Avenue,+Tashkent+100011+Uzbekistan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#f5b706] transition-colors font-medium hover:underline max-w-xs mx-auto md:mx-0"
                >
                  13 Navoi Avenue, Tashkent 100011 Uzbekistan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Webster University Tashkent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;