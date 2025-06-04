/**
 * @fileoverview Main perception-action loop for the agent
 */

import { Self } from '../self.js';
import { KeyboardSensor } from '../sensors/keyboard.js';
import { MemoryDB } from '../memory/db.js';

/**
 * Class representing the agent's main perception-action loop
 */
export class AgentLoop {
  /**
   * @param {Object} config - Configuration for the agent
   */
  constructor(config = {}) {
    this.self = new Self(config.self);
    this.memory = new MemoryDB(config.dbPath);
    this.keyboard = new KeyboardSensor(this.handleInput.bind(this));
    this.isRunning = false;
    this.lastStateUpdate = Date.now();
  }

  /**
   * Initializes the agent and its components
   */
  async initialize() {
    await this.memory.initialize();
    console.log('[Agent] Initializing...');
    console.log('[Agent] Internal state:', this.self.getState());
  }

  /**
   * Starts the agent's main loop
   */
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.keyboard.start();
    
    // Start the main loop
    this.loop();
    
    console.log('[Agent] Ready for interaction');
  }

  /**
   * Stops the agent's main loop
   */
  async stop() {
    this.isRunning = false;
    this.keyboard.stop();
    await this.memory.close();
    console.log('[Agent] Stopped');
  }

  /**
   * Main perception-action loop
   * @private
   */
  async loop() {
    while (this.isRunning) {
      try {
        // Update internal state
        const now = Date.now();
        if (now - this.lastStateUpdate >= 1000) { // Update every second
          const state = this.self.update();
          await this.memory.storeInternalState(state);
          this.lastStateUpdate = now;
        }

        // Small delay to prevent CPU overuse
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('[Agent] Error in main loop:', error);
      }
    }
  }

  /**
   * Handles input from the keyboard sensor
   * @param {Object} event - Input event
   * @private
   */
  async handleInput(event) {
    try {
      // Store the input in episodic memory
      await this.memory.storeEpisodicMemory(event);

      // Process special commands
      if (event.content.startsWith(':')) {
        await this.handleCommand(event.content.slice(1));
        return;
      }

      // Update internal state with the new event
      this.self.update([`input_${event.type}`]);

      // Generate and execute response
      const response = await this.generateResponse(event);
      await this.executeResponse(response);

    } catch (error) {
      console.error('[Agent] Error handling input:', error);
    }
  }

  /**
   * Handles special commands
   * @param {string} command - Command to handle
   * @private
   */
  async handleCommand(command) {
    switch (command) {
      case 'introspect':
        const introspection = this.self.introspect();
        console.log('[Agent] Current state:', JSON.stringify(introspection, null, 2));
        break;
        
      case 'stop':
        await this.stop();
        break;
        
      default:
        console.log('[Agent] Unknown command:', command);
    }
  }

  /**
   * Generates a response based on input and current state
   * @param {Object} event - Input event
   * @returns {Promise<Object>} Response to execute
   * @private
   */
  async generateResponse(event) {
    const state = this.self.getState();
    
    // Check if agent can respond
    if (!this.self.canPerformAction('respond')) {
      return {
        type: 'console',
        content: "I'm feeling a bit low on energy. I need to recharge.",
        metadata: { energy: state.energy }
      };
    }

    // Simple response generation based on input content
    const content = event.content.toLowerCase();
    let response;

    if (content.includes('hello') || content.includes('hi')) {
      response = "Hi there! How can I help you today?";
    } else if (content.includes('how are you')) {
      response = `I'm feeling ${state.mood > 0.5 ? 'great' : 
                 state.mood < -0.5 ? 'not so good' : 'okay'}. 
                 My energy level is at ${Math.round(state.energy)}%.`;
    } else if (content.includes('tired')) {
      response = `I notice you mentioned feeling tired. My energy level is at ${Math.round(state.energy)}%. Would you like to take a break?`;
    } else {
      response = "I'm processing what you said. Could you tell me more?";
    }

    return {
      type: 'console',
      content: response,
      metadata: {
        energy: state.energy,
        mood: state.mood,
        confidence: state.confidence
      }
    };
  }

  /**
   * Executes a response
   * @param {Object} response - Response to execute
   * @private
   */
  async executeResponse(response) {
    // Record the action in memory
    await this.memory.storeEpisodicMemory({
      type: 'response',
      timestamp: Date.now(),
      content: response.content,
      metadata: response.metadata
    });

    // Update internal state
    this.self.recordActionImpact('respond', true);

    // Output the response
    console.log(`[Agent] ${response.content}`);
  }
} 