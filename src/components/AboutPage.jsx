import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Target, Globe, CheckCircle, Briefcase, BarChart3, GraduationCap } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Sahifa ochilganda yuqoriga scroll qilish
    window.scrollTo(0, 0);
    
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

  const metFeatures = [
    {
      icon: FileText,
      title: "Test Format",
      description: "Multiple-choice format assessing grammar, vocabulary, and reading comprehension and writing"
    },
    {
      icon: Clock,
      title: "Duration",
      description: "Approximately 120 minutes to complete all sections."
    },
    {
      icon: Target,
      title: "Levels",
      description: "Scores correspond to CEFR levels A1 (beginner) to C2 (proficient)."
    },
    {
      icon: Globe,
      title: "Recognition",
      description: "Developed by Michigan Language Assessment and recognized worldwide by academic institutions."
    }
  ];

  const testSections = [
    {
      title: "Grammar Section",
      description: "Assesses understanding of English grammar rules and structures, including:",
      items: [
       "Verb tenses and forms",
       "Sentence structure",
       "Parts of speech",
       "Subject–verb agreement"
      ]
    },
    {
      title: "Vocabulary Section",
      description: "Evaluates knowledge of English words and their usage, such as:",
      items: [
        "Word meanings in context",
        "Synonyms and antonyms",
        "Idiomatic expressions",
        "Collocations"
      ]
    },
    {
      title: "Reading Comprehension",
      description: "Tests ability to understand written English passages",
      items: [
        "Main idea identification",
        "Detail recognition",
        "Inference skills",
        "Author's purpose"
      ]
    },
    {
      title: "Writing Section",
      description: "Measures your ability to express ideas in written English:",
      items: [
        "Coherence and paragraph organization",
        "Grammar and sentence structure",
        "Vocabulary range and accuracy",
        "Clarity of argument or opinion"
      ]
    }
  ];

  const whyChooseMET = [
    {
      icon: CheckCircle,
      title: "Widely Accepted",
      description: "Recognized by universities, colleges, and institutions globally"
    },
    {
      icon: GraduationCap,
      title: "Academic Requirement",
      description: "Required for admission and placement at Webster University Tashkent and partner institutions."
    },
    {
      icon: BarChart3,
      title: "Accurate Assessment",
      description: "Provides a reliable measure of English proficiency."
    },
    {
      icon: Briefcase,
      title: "Career Opportunities",
      description: "Supports academic advancement and professional certification."
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 page-enter">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
            <h1 className="text-xl font-bold text-white">About MET</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
           Michigan English Placement Test (MEPT)
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            The Michigan English Placement Test (MEPT) is a standardized assessment used by Webster University Tashkent to evaluate applicants’ English proficiency for admissions and placement purposes.
          </p>
        </div>

        {/* What is MET Section */}
        <div 
          className={`bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">What is the Michigan English Placement Test?</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              The Michigan English Placement Test (MEPT) is an official English language assessment developed by Michigan Language Assessment.
            </p>
            <p>
              It measures grammar, vocabulary, and reading comprehension to determine a student’s current English level.
            </p>
            <p>
              At Webster University Tashkent, MEPT results are used to place applicants in the appropriate English course level and ensure readiness for academic success. The test is designed for non-native English speakers seeking to study in an English-medium environment.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div 
          className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.3s' }}
        >
          {metFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-500 transition-all hover:-translate-y-2"
              >
                <div className="mb-4">
                  <IconComponent className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Test Sections */}
        <div 
          className={`mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.4s' }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Test Sections</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {testSections.map((section, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-xl font-bold text-white mb-3">{section.title}</h3>
                <p className="text-gray-300 mb-4 text-sm">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose MET */}
        <div 
          className={`mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.5s' }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Choose the Michigan English Placement Test (MEPT)?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {whyChooseMET.map((reason, index) => {
              const IconComponent = reason.icon;
              return (
                <div 
                  key={index}
                  className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex items-start gap-4"
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{reason.title}</h3>
                    <p className="text-gray-300 text-sm">{reason.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scoring Section */}
        <div 
          className={`bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Scoring and Levels</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">A1-A2</h3>
              <p className="text-white font-semibold mb-2">Basic User</p>
              <p className="text-gray-300 text-sm">Elementary proficiency in English</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-green-400 mb-2">B1-B2</h3>
              <p className="text-white font-semibold mb-2">Independent User</p>
              <p className="text-gray-300 text-sm">Intermediate to upper-intermediate proficiency</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-blue-400 mb-2">C1-C2</h3>
              <p className="text-white font-semibold mb-2">Proficient User</p>
              <p className="text-gray-300 text-sm">Advanced to near-native proficiency</p>
            </div>
          </div>
        </div>

        {/* Preparation Tips */}
        <div 
          className={`bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.7s' }}
        >
          <h2 className="text-3xl font-bold text-white mb-1">How to Prepare for the Michigan English Placement Test (MEPT)</h2>
          <p className='text-white mb-6'>Prepare confidently for your MEPT at Webster University Tashkent by following these simple steps:</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Review Preparation Materials</h3>
                <p className="text-gray-300 text-sm">Access our official sample questions and writing task examples to understand the test format and question types. → These examples reflect the real MEPT style for grammar, vocabulary, reading, and writing.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Practice Regularly</h3>
                <p className="text-gray-300 text-sm">Dedicate time each day to study grammar rules, learn new vocabulary, and read English texts or short articles.
→ Consistent daily practice improves both speed and accuracy.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Study Writing Samples</h3>
                <p className="text-gray-300 text-sm">Read model essays and writing examples to understand structure, coherence, and word choice.
→ Practice writing short essays on common academic or personal topics.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Review Weak Areas</h3>
                <p className="text-gray-300 text-sm">Focus additional study time on topics where you need the most improvement — such as specific grammar points or reading comprehension.
→ Reviewing mistakes helps you progress faster.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div 
          className={`bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '0.8s' }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Take the Test?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Register for the Michigan English Test at Webster University and take the first step towards your academic goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/test-dates')}
              className="px-8 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: '#024890', color: '#fff' }}
            >
              View Test Dates
            </button>
            <a
              href="https://apply.webster.uz/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all hover:scale-105"
            >
              Apply to Webster
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;