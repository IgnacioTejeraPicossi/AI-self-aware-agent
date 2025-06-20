import nlp from 'compromise';

/**
 * Analyzes user input to extract key information like topics and sentence type.
 * @param {string} text - The user's input text.
 * @returns {Object} An object containing the analysis.
 *                   - topics: An array of main topics/nouns.
 *                   - isQuestion: A boolean indicating if the input is a question.
 */
export function analyzeText(text) {
  const doc = nlp(text);
  
  // Extract main nouns/topics
  const topics = doc.nouns().out('array');
  
  // Check if the input is a question
  const isQuestion = doc.questions().out('array').length > 0;
  
  return {
    topics: topics.slice(0, 3), // Return up to 3 main topics
    isQuestion,
  };
} 