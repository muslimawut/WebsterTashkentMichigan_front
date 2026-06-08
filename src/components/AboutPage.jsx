import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Target, Globe, CheckCircle, BarChart3, GraduationCap, BookOpen, Headphones, PenTool, Layers } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setIsVisible(true), 80);
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
      description: "Scores correspond to CEFR levels A1 (beginner) to C1 (advanced)."
    },
    {
      icon: Globe,
      title: "Recognition",
      description: "Developed by Michigan Language Assessment and recognized worldwide by academic institutions."
    }
  ];

  const testSections = [
    {
      icon: BookOpen,
      accent: {
        glow: 'from-blue-500/20 via-cyan-400/10 to-transparent',
        badge: 'bg-blue-500/15 text-blue-100 ring-blue-300/20',
        stat: 'border-blue-400/20 bg-blue-500/10 text-blue-50',
        title: 'text-blue-100',
        subtitle: 'text-blue-200',
        subsection: 'border-blue-400/10 bg-slate-900/60 hover:border-blue-300/30 hover:bg-slate-900/80',
        skill: 'border-blue-400/20 bg-blue-500/10 text-blue-50'
      },
      groupTitle: "Reading & Language Use",
      groupDescription: "The Reading & Language Use section evaluates grammar, vocabulary, and reading comprehension skills.",
      meta: { questions: 55, time: "35 minutes" },
      subsections: [
        {
          title: "Grammar",
          description: "There are 20 grammar questions. Each question presents a short conversation between two speakers with part of the exchange omitted. Test takers select the correct word or phrase from four answer choices to complete the conversation.",
          skills: ["Verb tenses and forms", "Sentence structure", "Parts of speech", "Subject–verb agreement"]
        },
        {
          title: "Vocabulary",
          description: "The Vocabulary section contains 20 sentences, each with one missing word. Test takers complete each sentence by selecting the correct answer from four options.",
          skills: ["Word meanings in context", "Synonyms and antonyms", "Idiomatic expressions", "Collocations"]
        },
        {
          title: "Reading Comprehension",
          description: "There are 15 reading comprehension questions. The first 5 questions assess sentence-level reading comprehension. The remaining 10 questions are based on two reading passages of different lengths.",
          skills: ["Main idea identification", "Detail recognition", "Inference skills", "Author's purpose"]
        }
      ]
    },
    {
      icon: Headphones,
      accent: {
        glow: 'from-emerald-500/20 via-teal-400/10 to-transparent',
        badge: 'bg-emerald-500/15 text-emerald-100 ring-emerald-300/20',
        stat: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-50',
        title: 'text-emerald-100',
        subtitle: 'text-emerald-200',
        subsection: 'border-emerald-400/10 bg-slate-900/60 hover:border-emerald-300/30 hover:bg-slate-900/80',
        skill: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-50'
      },
      groupTitle: "Listening Section",
      groupDescription: "The Listening Section consists of two parts with a total of 25 questions. Audio for each question is played once.",
      meta: { questions: 25, time: "25 minutes" },
      subsections: [
        {
          title: "Part 1",
          description: "Test takers hear a question or statement that requires a response. They choose the correct answer from three options.",
          skills: []
        },
        {
          title: "Part 2",
          description: "Test takers listen to a conversation between two people and answer a question about the conversation by selecting the correct answer from three options.",
          skills: []
        }
      ]
    },
    {
      icon: PenTool,
      accent: {
        glow: 'from-amber-500/20 via-orange-400/10 to-transparent',
        badge: 'bg-amber-500/15 text-amber-100 ring-amber-300/20',
        stat: 'border-amber-400/20 bg-amber-500/10 text-amber-50',
        title: 'text-amber-100',
        subtitle: 'text-amber-200',
        subsection: 'border-amber-400/10 bg-slate-900/60 hover:border-amber-300/30 hover:bg-slate-900/80',
        skill: 'border-amber-400/20 bg-amber-500/10 text-amber-50'
      },
      groupTitle: "Writing Section",
      groupDescription: "The Writing Section evaluates the ability to analyze, summarize, and express ideas effectively in written English. Test takers are provided with a reading passage and are required to write a well-organized analytical summary based on the text.",
      meta: { questions: null, time: "60 minutes", wordLimit: "~300 words", task: "Analytical Summary Writing" },
      subsections: [
        {
          title: "Skills assessed",
          description: "",
          skills: ["Analytical and critical thinking", "Summary writing", "Coherence and organization", "Grammar and sentence structure", "Vocabulary range and accuracy", "Clarity of expression"]
        }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
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
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-8 sm:px-8 sm:py-10 mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(45,212,191,0.12),_transparent_30%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 mb-4">
                <Layers className="w-4 h-4 text-cyan-300" />
                Section breakdown
              </div>
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Test Sections</h2>
                  <p className="text-slate-300 leading-relaxed">
                    Each section focuses on a different academic English skill, so applicants can understand the test flow, timing, and expectations before exam day.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <div className="w-[118px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-white">3</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sections</p>
                  </div>
                  <div className="w-[118px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-white">80</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Questions</p>
                  </div>
                  <div className="w-[118px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-white">120</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Minutes</p>
                  </div>
                  <div className="w-[118px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-white">C1</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Top Level</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {testSections.map((group, gi) => {
              const statCards = [
                group.meta.questions ? { value: group.meta.questions, label: 'Questions' } : null,
                { value: group.meta.time, label: 'Duration' },
                group.meta.wordLimit ? { value: group.meta.wordLimit, label: 'Word Limit' } : null,
                group.meta.task ? { value: group.meta.task, label: 'Task Type', wide: true } : null
              ].filter(Boolean);

              return (
                <div
                  key={gi}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_24px_80px_rgba(2,6,23,0.35)] transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="relative px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
                    <div className={`absolute inset-0 bg-gradient-to-r ${group.accent.glow}`} />
                    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="min-w-0 lg:pr-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 backdrop-blur-sm ${group.accent.badge}`}>
                            <group.icon className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                              Section {gi + 1}
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-bold text-white">{group.groupTitle}</h3>
                          </div>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed text-slate-300">
                          {group.groupDescription}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 lg:max-w-[560px] lg:justify-end">
                        {statCards.map((stat, index) => (
                          <div
                            key={`${stat.label}-${index}`}
                            className={`rounded-2xl border px-4 py-3 ${group.accent.stat} ${
                              stat.wide ? 'w-[180px] sm:w-[210px] lg:w-[220px]' : 'w-[140px] sm:w-[156px]'
                            }`}
                          >
                            <p className={`${stat.wide ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold leading-snug`}>
                              {stat.value}
                            </p>
                            <p className="text-xs uppercase tracking-[0.18em] opacity-80 mt-1">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`grid gap-4 px-6 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4 ${
                  group.subsections.length === 1 ? 'grid-cols-1' :
                  group.subsections.length === 2 ? 'md:grid-cols-2' :
                  'md:grid-cols-2 xl:grid-cols-3'
                }`}>
                  {group.subsections.map((sub, si) => (
                    <div
                      key={si}
                      className={`rounded-3xl border p-5 transition-all duration-300 ${group.accent.subsection}`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h4 className={`text-lg font-semibold ${group.accent.title}`}>{sub.title}</h4>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ring-1 ${group.accent.badge}`}>
                          Focus
                        </span>
                      </div>
                      {sub.description && (
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">{sub.description}</p>
                      )}
                      {sub.skills.length > 0 && (
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.18em] mb-3 ${group.accent.subtitle}`}>
                            Key skills
                          </p>
                          <ul className="flex flex-wrap gap-2">
                            {sub.skills.map((skill, idx) => (
                              <li
                                key={idx}
                                className={`rounded-full border px-3 py-2 text-sm leading-tight ${group.accent.skill}`}
                              >
                                {skill}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>
              );
            })}
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
              <h3 className="text-2xl font-bold text-blue-400 mb-2">C1</h3>
              <p className="text-white font-semibold mb-2">Advanced User</p>
              <p className="text-gray-300 text-sm">Advanced proficiency in English</p>
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
