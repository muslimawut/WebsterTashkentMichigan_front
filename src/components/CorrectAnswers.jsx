// Correct answers for the mock exam
// Update these values to match your actual test's correct answers

export const CORRECT_ANSWERS = {
  listening: {
    1: 'A',  // Update with actual correct answer
    2: 'B',  // Update with actual correct answer
    3: 'C',  // Update with actual correct answer
    4: 'A',  // Update with actual correct answer
    5: 'B'   // Update with actual correct answer
  },
  reading: {
    1: 'A',   // Update with actual correct answer
    2: 'C',   // Update with actual correct answer
    3: 'B',   // Update with actual correct answer
    4: 'C',   // Update with actual correct answer
    5: 'B',   // Update with actual correct answer
    6: 'A',   // Update with actual correct answer
    7: 'B',   // Update with actual correct answer
    8: 'A',   // Update with actual correct answer
    9: 'A',   // Update with actual correct answer
    10: 'C'   // Update with actual correct answer
  }
};

/**
 * Calculate score for a section
 * @param {Object} userAnswers - User's answers {questionId: answer}
 * @param {Object} correctAnswers - Correct answers {questionId: correctAnswer}
 * @returns {number} - Number of correct answers
 */
export const calculateScore = (userAnswers, correctAnswers) => {
  let score = 0;
  
  Object.keys(correctAnswers).forEach(questionId => {
    const userAnswer = userAnswers[questionId];
    const correctAnswer = correctAnswers[questionId];
    
    if (userAnswer && userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
      score++;
    }
  });
  
  return score;
};

/**
 * Get detailed results for a section
 * @param {Object} userAnswers - User's answers
 * @param {Object} correctAnswers - Correct answers
 * @returns {Object} - Detailed results with correct/incorrect breakdown
 */
export const getDetailedResults = (userAnswers, correctAnswers) => {
  const results = {
    correct: [],
    incorrect: [],
    skipped: []
  };
  
  Object.keys(correctAnswers).forEach(questionId => {
    const userAnswer = userAnswers[questionId];
    const correctAnswer = correctAnswers[questionId];
    
    if (!userAnswer) {
      results.skipped.push(parseInt(questionId));
    } else if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
      results.correct.push(parseInt(questionId));
    } else {
      results.incorrect.push({
        questionId: parseInt(questionId),
        userAnswer,
        correctAnswer
      });
    }
  });
  
  return results;
};