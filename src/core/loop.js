/**
 * @fileoverview Main perception-action loop for the agent
 */
import { chatWithLLM } from '../llm/llm.js';
import { Self } from '../self.js';
import { KeyboardSensor } from '../sensors/keyboard.js';
import { MemoryDB } from '../memory/db.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

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
    console.log('\n' + colors.fg.cyan + colors.bright + '🤖 AI Self-Aware Agent' + colors.reset);
    console.log(colors.dim + 'A minimal self-aware agent prototype' + colors.reset + '\n');
    
    // Display available commands
    console.log(colors.fg.yellow + 'Available Commands:' + colors.reset);
    console.log(colors.dim + '  :introspect  - Show current internal state' + colors.reset);
    console.log(colors.dim + '  :status     - Show current status' + colors.reset);
    console.log(colors.dim + '  :help       - Show this help message' + colors.reset);
    console.log(colors.dim + '  :stop       - Stop the agent' + colors.reset + '\n');
    
    this.updateStatusBar();
  }

  /**
   * Updates the status bar with current state
   * @private
   */
  updateStatusBar() {
    const state = this.self.getState();
    const energyColor = state.energy > 50 ? colors.fg.green : 
                       state.energy > 20 ? colors.fg.yellow : colors.fg.red;
    const moodEmoji = state.mood > 0.5 ? '😊' : 
                     state.mood < -0.5 ? '😔' : '😐';
    
    process.stdout.write('\r' + colors.dim + 'Status: ' + colors.reset);
    process.stdout.write(energyColor + `Energy: ${Math.round(state.energy)}% ` + colors.reset);
    process.stdout.write(colors.fg.blue + `Mood: ${moodEmoji} ` + colors.reset);
    process.stdout.write(colors.fg.magenta + `Confidence: ${Math.round(state.confidence * 100)}%` + colors.reset);
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
    
    console.log(colors.fg.green + '\n[Agent] Ready for interaction' + colors.reset);
    console.log(colors.dim + 'Type a message or use :help for commands' + colors.reset + '\n');
  }

  /**
   * Stops the agent's main loop
   */
  async stop() {
    this.isRunning = false;
    this.keyboard.stop();
    await this.memory.close();
    console.log(colors.fg.yellow + '\n[Agent] Stopped' + colors.reset);
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
          this.updateStatusBar();
        }

        // Small delay to prevent CPU overuse
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(colors.fg.red + '[Agent] Error in main loop:', error + colors.reset);
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
      console.error(colors.fg.red + '[Agent] Error handling input:', error + colors.reset);
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
        console.log('\n' + colors.fg.cyan + colors.bright + 'Current State:' + colors.reset);
        console.log(colors.dim + JSON.stringify(introspection, null, 2) + colors.reset + '\n');
        break;
        
      case 'status':
        this.updateStatusBar();
        console.log('\n');
        break;
        
      case 'help':
        console.log('\n' + colors.fg.yellow + 'Available Commands:' + colors.reset);
        console.log(colors.dim + '  :introspect  - Show current internal state' + colors.reset);
        console.log(colors.dim + '  :status     - Show current status' + colors.reset);
        console.log(colors.dim + '  :help       - Show this help message' + colors.reset);
        console.log(colors.dim + '  :stop       - Stop the agent' + colors.reset + '\n');
        break;
        
      case 'stop':
        await this.stop();
        break;
        
      default:
        console.log(colors.fg.red + '[Agent] Unknown command:', command + colors.reset);
        console.log(colors.dim + 'Type :help for available commands' + colors.reset + '\n');
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
    const llmResponse = await chatWithLLM(event.content);
    return {
      type: 'console',
      content: llmResponse,
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

    // Output the response with a newline before and after
    console.log('\n' + colors.fg.cyan + '[Agent] ' + colors.reset + response.content + '\n');
    
    // Update status bar after response
    this.updateStatusBar();
  }
} 