/**
 * @fileoverview Web server for the AI Self-Aware Agent
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AgentLoop } from './core/loop.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { claudeWithSDK, claudeStreaming, isClaudeConfigured } from './claude.js';
import { deepseekChat, deepseekStreaming, isDeepseekConfigured } from './deepseek.js';
import { qwenChat, qwenStreaming, isQwenConfigured } from './qwen.js';
import { analyzeSentiment } from './analysis/sentiment.js';
import { analyzeText } from './analysis/text.js';

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
        // Analyze sentiment and update agent's mood
        const sentiment = analyzeSentiment(data.content);
        agent.self.updateMoodFromSentiment(sentiment.score);

        let response;
        
        // Add user message to history
        agent.self.addToConversationHistory('user', data.content);
        
        // Analyze text for more context
        const textAnalysis = analyzeText(data.content);

        // Choose AI model based on request
        if (data.model === 'claude') {
          response = await claudeWithSDK(agent.self, data.content, textAnalysis);
        } else {
          // Default to existing Gemini model
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          response = await agent.generateResponse({
            type: 'keyboard_input',
            timestamp: Date.now(),
            content: data.content,
            metadata: {
              length: data.content.length,
              hasSpecialChars: /[^a-zA-Z0-9\s]/.test(data.content)
            }
          });
        }

        // Send response back to client
        ws.send(JSON.stringify({
          type: 'response',
          data: response
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

// Add Claude endpoints
app.post('/api/claude/chat', async (req, res) => {
  try {
    if (!isClaudeConfigured()) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // For API endpoints, we don't have long-term history, but can still use personality
    const textAnalysis = analyzeText(message);
    const response = await claudeWithSDK(agent.self, message, textAnalysis);
    res.json({ response });
  } catch (error) {
    console.error('Claude API Error:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

app.post('/api/claude/stream', async (req, res) => {
  try {
    if (!isClaudeConfigured()) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // For API endpoints, we don't have long-term history, but can still use personality
    const textAnalysis = analyzeText(message);
    await claudeStreaming(agent.self, message, textAnalysis, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.end();
  } catch (error) {
    console.error('Claude Streaming Error:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Add new API endpoints for DeepSeek
app.post('/api/deepseek/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await deepseekChat(messages);
    res.json({ response });
  } catch (error) {
    console.error('DeepSeek chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deepseek/stream', async (req, res) => {
  try {
    const { messages } = req.body;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await deepseekStreaming(messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.end();
  } catch (error) {
    console.error('DeepSeek streaming error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new API endpoints for Qwen
app.post('/api/qwen/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await qwenChat(messages);
    res.json({ response });
  } catch (error) {
    console.error('Qwen chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/qwen/stream', async (req, res) => {
  try {
    const { messages } = req.body;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await qwenStreaming(messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.end();
  } catch (error) {
    console.error('Qwen streaming error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

console.log('Loaded OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '[HIDDEN]' : '[NOT FOUND]');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
console.log('Gemini model initialized');

// Update the model selection logic in the generateResponse function
async function generateResponse(input) {
  let response;
  try {
    // Try each model in order of preference
    if (isOpenAIConfigured()) {
      response = await chatGPT(input);
    } else if (isClaudeConfigured()) {
      response = await claudeWithSDK(agent.self, input);
    } else if (isDeepseekConfigured()) {
      response = await deepseekChat([{ role: 'user', content: input }]);
    } else if (isQwenConfigured()) {
      response = await qwenChat([{ role: 'user', content: input }]);
    } else {
      // Fallback to local response
      response = `I understand you said: "${input}"`;
    }
  } catch (error) {
    console.error('Error generating response:', error);
    response = `I encountered an error: ${error.message}`;
  }
  return response;
} 