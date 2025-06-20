import Sentiment from 'sentiment';

/**
 * Analyzes the sentiment of a given text.
 * @param {string} text - The text to analyze.
 * @returns {Object} An object containing the sentiment score.
 *                   - score: The overall sentiment score.
 *                   - comparative: The comparative score per word.
 *                   - positive: List of positive words found.
 *                   - negative: List of negative words found.
 */
export function analyzeSentiment(text) {
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);
  return result;
} 