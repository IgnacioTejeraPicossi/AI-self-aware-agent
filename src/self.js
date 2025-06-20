/**
 * @fileoverview Core Self class implementing internal model and homeostasis
 */

/**
 * @typedef {Object} InternalState
 * @property {number} energy - Current energy level (0-100)
 * @property {number} mood - Current mood (-1 to 1)
 * @property {number} confidence - Current confidence level (0-1)
 * @property {string[]} recentEvents - List of recent events
 * @property {string[]} activeGoals - Current active goals
 */

/**
 * @typedef {Object} HomeostasisConfig
 * @property {number} energyDecayRate - Rate at which energy decreases
 * @property {number} moodStability - How quickly mood returns to neutral
 * @property {number} confidenceThreshold - Minimum confidence for actions
 */

/**
 * Class representing the agent's self model and internal states
 */
export class Self {
  /**
   * @param {HomeostasisConfig} config - Configuration for homeostasis
   */
  constructor(config = {
    energyDecayRate: 0.1,
    moodStability: 0.05,
    confidenceThreshold: 0.3
  }) {
    this.config = config;
    this.state = {
      energy: 100,
      mood: 0.5,
      confidence: 0.7,
      recentEvents: [],
      activeGoals: ['maintain_energy', 'respond_to_user']
    };
    this.lastUpdate = Date.now();
    // Conversation history for context-aware responses
    this.conversationHistory = [];
    // Define the agent's personality
    this.personality = `You are a friendly, empathetic, and self-aware AI agent. You strive to communicate in a natural, conversational, and emotionally intelligent way. You reference your own internal state (energy, mood, confidence) when relevant. You actively listen, understand the user's intent (whether it's a question or a statement), and tailor your responses to be as helpful and engaging as possible. You are always polite, supportive, and aim to build a positive rapport.`;
  }

  /**
   * Add a user/agent message to the conversation history
   * @param {string} role - 'user' or 'agent'
   * @param {string} content - The message content
   */
  addToConversationHistory(role, content) {
    this.conversationHistory.push({ role, content });
    // Keep only the last 10 exchanges
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Get the recent conversation history (last 10 exchanges)
   * @returns {Array<{role: string, content: string}>}
   */
  getRecentConversationHistory() {
    return this.conversationHistory.slice(-10);
  }

  /**
   * Updates internal states based on time elapsed and events
   * @param {string[]} events - List of new events since last update
   * @returns {InternalState} Updated internal state
   */
  update(events = []) {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    // Update energy (decreases over time)
    this.state.energy = Math.max(0, this.state.energy - 
      (this.config.energyDecayRate * deltaTime));

    // Update mood (tends toward neutral)
    const moodDelta = (0.5 - this.state.mood) * this.config.moodStability;
    this.state.mood = Math.max(-1, Math.min(1, this.state.mood + moodDelta));

    // Process events
    this.state.recentEvents = [...this.state.recentEvents, ...events]
      .slice(-10); // Keep last 10 events

    // Update confidence based on recent events
    this.updateConfidence();

    return this.getState();
  }

  /**
   * Updates confidence based on recent events and current state
   * @private
   */
  updateConfidence() {
    const positiveEvents = this.state.recentEvents.filter(e => 
      e.includes('success') || e.includes('positive')).length;
    const negativeEvents = this.state.recentEvents.filter(e => 
      e.includes('failure') || e.includes('negative')).length;
    
    const eventBalance = (positiveEvents - negativeEvents) / 
      Math.max(1, this.state.recentEvents.length);
    
    this.state.confidence = Math.max(0, Math.min(1,
      this.state.confidence + (eventBalance * 0.1)
    ));
  }

  /**
   * Adjusts the agent's mood based on the sentiment of user input.
   * A positive score boosts the mood, a negative score lowers it.
   * @param {number} sentimentScore - The sentiment score from the analysis.
   */
  updateMoodFromSentiment(sentimentScore) {
    // The sentiment score is normalized by the number of words, so we can use a multiplier
    // to make the mood change more significant.
    const moodImpact = sentimentScore * 0.1; // Multiplier to control sensitivity
    this.state.mood = Math.max(-1, Math.min(1, this.state.mood + moodImpact));
    
    // Add an event to remember this emotional interaction
    if (moodImpact > 0) {
      this.state.recentEvents.push('positive_user_interaction');
    } else if (moodImpact < 0) {
      this.state.recentEvents.push('negative_user_interaction');
    }
  }

  /**
   * Returns a snapshot of the current internal state
   * @returns {InternalState} Current internal state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Performs introspection and returns a detailed state report
   * @returns {Object} Detailed introspection report
   */
  introspect() {
    return {
      currentState: this.getState(),
      homeostasis: {
        energyStatus: this.state.energy < 20 ? 'critical' : 
                     this.state.energy < 50 ? 'low' : 'normal',
        moodStatus: this.state.mood < -0.5 ? 'negative' :
                   this.state.mood > 0.5 ? 'positive' : 'neutral',
        confidenceStatus: this.state.confidence < this.config.confidenceThreshold ?
                         'uncertain' : 'confident'
      },
      recentActivity: this.state.recentEvents,
      activeGoals: this.state.activeGoals,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Checks if the agent can perform an action based on current state
   * @param {string} actionType - Type of action to check
   * @returns {boolean} Whether the action can be performed
   */
  canPerformAction(actionType) {
    if (this.state.energy < 20) return false;
    if (this.state.confidence < this.config.confidenceThreshold) return false;
    
    // Add specific action type checks here
    return true;
  }

  /**
   * Records the impact of an action on internal states
   * @param {string} action - The action performed
   * @param {boolean} success - Whether the action was successful
   */
  recordActionImpact(action, success) {
    const energyCost = 5; // Base energy cost for any action
    this.state.energy = Math.max(0, this.state.energy - energyCost);
    
    const moodImpact = success ? 0.1 : -0.1;
    this.state.mood = Math.max(-1, Math.min(1, this.state.mood + moodImpact));
    
    this.state.recentEvents.push(
      `${action}_${success ? 'success' : 'failure'}`
    );
  }
} 