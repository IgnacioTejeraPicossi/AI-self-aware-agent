/**
 * @fileoverview Keyboard sensor module for handling user input
 */

import readline from 'readline';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m'
  }
};

/**
 * Class representing the keyboard input sensor
 */
export class KeyboardSensor {
  /**
   * @param {Function} onInput - Callback for handling input
   */
  constructor(onInput) {
    this.onInput = onInput;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.isListening = false;
  }

  /**
   * Starts listening for keyboard input
   */
  start() {
    if (this.isListening) return;
    
    this.isListening = true;
    this.rl.on('line', (input) => {
      if (input.trim() === '') return;
      
      const event = {
        type: 'keyboard_input',
        timestamp: Date.now(),
        content: input.trim(),
        metadata: {
          length: input.length,
          hasSpecialChars: /[^a-zA-Z0-9\s]/.test(input)
        }
      };

      this.onInput(event);
      this.prompt();
    });

    this.prompt();
  }

  /**
   * Displays the input prompt
   * @private
   */
  prompt() {
    this.rl.setPrompt(colors.fg.green + '> ' + colors.reset);
    this.rl.prompt();
  }

  /**
   * Stops listening for keyboard input
   */
  stop() {
    if (!this.isListening) return;
    
    this.isListening = false;
    this.rl.close();
    console.log(colors.fg.yellow + '[Keyboard] Stopped listening.' + colors.reset);
  }

  /**
   * Simulates keyboard input (useful for testing)
   * @param {string} input - Input to simulate
   */
  simulateInput(input) {
    const event = {
      type: 'keyboard_input',
      timestamp: Date.now(),
      content: input.trim(),
      metadata: {
        length: input.length,
        hasSpecialChars: /[^a-zA-Z0-9\s]/.test(input),
        simulated: true
      }
    };

    this.onInput(event);
  }
} 