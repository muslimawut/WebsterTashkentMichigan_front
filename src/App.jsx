import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import VideoSection from './components/VideoSection';
import TestDatesSection from './components/TestDatesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import PaymentModal from './components/PaymentModal';
import Loading from './components/Loading';
import AuthPage from './components/AuthPage';
import PreparationMaterials from './components/PreparationMaterials';
import ProfilePage from './components/ProfilePage';
import ContractPage from './components/ContractPage';
import AboutPage from './components/AboutPage';
import TestDatesPage from './components/TestDatesPage';
import MockExamPage from './components/MockExamPage';
import ListeningTest from './components/ListeningTest';
import ReadingInstructions from './components/ReadingInstructions';
import ReadingTest from './components/ReadingTest';
import WritingInstructions from './components/WritingInstructions';
import WritingTest from './components/WritingTest';
import WritingExam from './components/WritingExam';
import Results from './components/ResultsPage';
import Chatbot from './components/Chatbot';

// Home Page Component
const HomePage = ({ onSignUpClick, isLoggedIn }) => {
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDateModal(true);
  };

  return (
    <>
      {/* Navbar faqat home page da */}
      <Navbar
        onSignUpClick={onSignUpClick}
        isLoggedIn={isLoggedIn}
      />
      <HeroSection />
      <VideoSection />
      <PreparationMaterials />
      <TestDatesSection
        onDateSelect={handleDateSelect}
      />
      {/* <CTASection /> */}
      <Footer />

      <PaymentModal
        isOpen={showDateModal}
        selectedDate={selectedDate}
        onClose={() => setShowDateModal(false)}
      />
    </>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);

      // Check if user is logged in
      const userLoggedIn = localStorage.getItem('userLoggedIn');
      if (userLoggedIn === 'true') {
        setIsLoggedIn(true);
      }

      // Check if user came back from Webster website
      const applicationStarted = localStorage.getItem('websterApplicationStarted');
      if (applicationStarted === 'true') {
        // Clear the flag after using it
        localStorage.removeItem('websterApplicationStarted');
      }
    }, 2000); // 2 seconds loading

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Home Route */}
          <Route
            path="/"
            element={
              <HomePage
                onSignUpClick={() => window.location.href = '/auth?tab=signup'}
                isLoggedIn={isLoggedIn}
              />
            }
          />

          {/* Auth Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              isLoggedIn ? <ProfilePage /> : <Navigate to="/auth" replace />
            }
          />

          {/* Contract Route */}
          <Route path="/contract" element={<ContractPage />} />

          {/* About Route */}
          <Route path="/about" element={<AboutPage />} />

          {/* Test Dates Route */}
          <Route
            path="/test-dates"
            element={<TestDatesPage />}
          />

          {/* Mock Exam Route */}
          <Route
            path="/mock-exam"
            element={<MockExamPage />}
          />

          {/* Listening Test Route */}
          <Route
            path="/mock-exam/listening"
            element={<ListeningTest />}
          />

          {/* Reading Instructions Route */}
          <Route
            path="/mock-exam/reading-instructions"
            element={<ReadingInstructions />}
          />

          {/* Reading Test Route */}
          <Route
            path="/mock-exam/reading"
            element={<ReadingTest />}
          />

          {/* Writing Instructions Route */}
          <Route
            path="/mock-exam/writing-instructions"
            element={<WritingInstructions />}
          />

          {/* Writing Test Route */}
          <Route
            path="/mock-exam/writing"
            element={<WritingTest />}
          />

          {/* New Writing Exam Route */}
          <Route
            path="/writing-exam"
            element={<WritingInstructions />}
          />

          {/* Results Route */}
          <Route
            path="/mock-exam/results"
            element={<Results />}
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Chatbot />
        <ToastContainer />
      </div>
    </Router>
  );
}