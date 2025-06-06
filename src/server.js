/**
 * @fileoverview Web server for the AI Self-Aware Agent
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AgentLoop } from './core/loop.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize agent
const agent = new AgentLoop();
await agent.initialize();

// WebSocket for real-time communication
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state
  const state = agent.self.getState();
  ws.send(JSON.stringify({
    type: 'state',
    data: {
      energy: state.energy,
      mood: state.mood,
      confidence: state.confidence
    }
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'input') {
        // Handle user input
        const response = await agent.generateResponse({
          type: 'keyboard_input',
          timestamp: Date.now(),
          content: data.content,
          metadata: {
            length: data.content.length,
            hasSpecialChars: /[^a-zA-Z0-9\s]/.test(data.content)
          }
        });

        // Send response back to client
        ws.send(JSON.stringify({
          type: 'response',
          data: resp|onse
        }));

        // Update state
        const newState = agent.self.getState();
        ws.send(JSON.stringify({
          type: 'state',
          data: {
            energy: newState.energy,
            mood: newState.mood,
            confidence: newState.confidence
          }
        }));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error processing message' }
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

console.log('Loaded OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '[HIDDEN]' : '[NOT FOUND]'); 