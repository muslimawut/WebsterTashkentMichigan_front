import React, { useState, useEffect, useRef } from 'react';
import webstermaterials from "../../Reading.pdf";
import webstermaterials2 from "../../EPT.pdf";
import writing from "../../writingicon.png";
import test from "../../test.png";

const PreparationSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sectionRef = useRef(null);

  const materials = [
    {
      id: 1,
      title: "The Writing Placement Test",
      description: "Complete grammar rules and exercises for M-EPT preparation",
      icon: writing,
      pdfUrl: webstermaterials
    },
    {
      id: 2,
      title: "Examples of Michigan English Placement Test Items",
      description: "Sample questions and mock tests with answer keys",
      icon: test,
      pdfUrl: webstermaterials2
    }
  ];

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

  const openPDF = (material) => {
    setSelectedPDF(material);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPDF(null), 300);
  };

  return (
    <>
      <section
        id="preparation-materials"
        ref={sectionRef}
        className="relative md:min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto w-full">
          {/* Title with Animation */}
          <div className="text-center mb-10 sm:mb-16">
            <h2
              className={`text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: '0.2s' }}
            >
              Preparation Materials
            </h2>
            <p
              className={`text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: '0.4s' }}
            >
              Download comprehensive study materials to prepare for your Michigan Test
            </p>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-8 mb-8 sm:mb-12">
            {materials.map((material, index) => (
              <div
                key={material.id}
                className={`bg-white/10 backdrop-blur-sm p-4 sm:p-8 rounded-2xl border border-white/20 transition-all duration-200 ease-in-out group cursor-pointer flex flex-col items-center justify-between h-full ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  } hover:bg-white/20 hover:-translate-y-1 sm:hover:-translate-y-4 hover:shadow-xl active:scale-95 sm:active:scale-100`}
                style={{ transitionDelay: `${0.6 + (index * 0.2)}s` }}
                onClick={() => openPDF(material)}
              >
                <div className="flex flex-col items-center w-full">
                  {/* Icon */}
                  <div className="mb-3 sm:mb-6 flex justify-center text-center transition-transform duration-200 ease-in-out group-hover:scale-110">
                    <img src={material.icon} alt="" className="w-12 h-12 sm:w-20 sm:h-20 object-contain" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-2 sm:mb-4 text-center group-hover:text-[#f5b706] transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-0">
                    {material.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-300 text-xs sm:text-base text-center mb-4 sm:mb-6 leading-relaxed line-clamp-3">
                    {material.description}
                  </p>
                </div>

                {/* Button */}
                <button
                  className="w-full py-2 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-base transition-all duration-200 ease-in-out shadow-lg text-white hover:scale-105 hover:shadow-xl active:scale-95 mt-auto"
                  style={{ backgroundColor: '#024890' }}
                >
                  View PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PDF Viewer Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-6xl h-[85vh] sm:h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white gap-4 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img src={selectedPDF?.icon} alt="" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
                <div className="flex-1">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{selectedPDF?.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-1">{selectedPDF?.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Download Button */}
                <a
                  href={selectedPDF?.pdfUrl}
                  download
                  className="flex-1 sm:flex-none justify-center px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg text-white flex items-center gap-2 text-sm sm:text-base"
                  style={{ backgroundColor: '#024890' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </a>

                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors bg-gray-50 sm:bg-transparent"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-grow bg-gray-100 overflow-hidden relative">
              <iframe
                src={selectedPDF?.pdfUrl}
                className="w-full h-full border-0 block"
                title={selectedPDF?.title}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreparationSection;