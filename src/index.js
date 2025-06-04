/**
 * @fileoverview Main entry point for the self-aware agent
 */

import { AgentLoop } from './core/loop.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const isSimulation = args.includes('--simulate');

// Create data directory if it doesn't exist
import fs from 'fs';
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Agent configuration
const config = {
  self: {
    energyDecayRate: 0.1,
    moodStability: 0.05,
    confidenceThreshold: 0.3
  },
  dbPath: path.join(dataDir, 'agent_memory.db')
};

// Create and start the agent
const agent = new AgentLoop(config);

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n[Agent] Shutting down...');
  await agent.stop();
  process.exit(0);
});

// Start the agent
(async () => {
  try {
    await agent.initialize();
    await agent.start();
  } catch (error) {
    console.error('[Agent] Error starting agent:', error);
    process.exit(1);
  }
})(); 