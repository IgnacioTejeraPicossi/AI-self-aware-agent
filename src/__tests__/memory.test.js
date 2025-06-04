/**
 * @fileoverview Tests for the MemoryDB class
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemoryDB } from '../memory/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(__dirname, '../../data/test_memory.db');

describe('MemoryDB', () => {
  let memory;

  beforeAll(async () => {
    // Ensure test directory exists
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    memory = new MemoryDB(testDbPath);
    await memory.initialize();
  });

  afterAll(async () => {
    await memory.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should store and retrieve episodic memories', async () => {
    const event = {
      type: 'test_event',
      timestamp: Date.now(),
      content: 'Test content',
      metadata: { test: true }
    };

    const id = await memory.storeEpisodicMemory(event);
    expect(id).toBeDefined();

    const memories = await memory.getRecentMemories(1);
    expect(memories).toHaveLength(1);
    expect(memories[0].event_type).toBe('test_event');
    expect(memories[0].content).toBe('Test content');
  });

  it('should store and retrieve semantic memories', async () => {
    const key = 'test_key';
    const value = { test: 'value' };
    const confidence = 0.8;

    await memory.storeSemanticMemory(key, value, confidence);
    const memory = await memory.getSemanticMemory(key);

    expect(memory).toBeDefined();
    expect(JSON.parse(memory.value)).toEqual(value);
    expect(memory.confidence).toBe(confidence);
  });

  it('should store and retrieve internal states', async () => {
    const state = {
      energy: 75,
      mood: 0.5,
      confidence: 0.8,
      recentEvents: ['test_event']
    };

    await memory.storeInternalState(state);
    const latestState = await memory.getLatestInternalState();

    expect(latestState).toBeDefined();
    expect(latestState.energy).toBe(state.energy);
    expect(latestState.mood).toBe(state.mood);
    expect(latestState.confidence).toBe(state.confidence);
    expect(JSON.parse(latestState.events)).toEqual(state.recentEvents);
  });

  it('should handle multiple episodic memories in order', async () => {
    const events = [
      {
        type: 'event1',
        timestamp: Date.now(),
        content: 'First event',
        metadata: {}
      },
      {
        type: 'event2',
        timestamp: Date.now() + 1000,
        content: 'Second event',
        metadata: {}
      }
    ];

    for (const event of events) {
      await memory.storeEpisodicMemory(event);
    }

    const memories = await memory.getRecentMemories(2);
    expect(memories).toHaveLength(2);
    expect(memories[0].event_type).toBe('event2');
    expect(memories[1].event_type).toBe('event1');
  });

  it('should update semantic memory confidence', async () => {
    const key = 'confidence_test';
    const value = { test: 'value' };

    // Store with initial confidence
    await memory.storeSemanticMemory(key, value, 0.5);
    
    // Update with new confidence
    await memory.storeSemanticMemory(key, value, 0.8);
    
    const memory = await memory.getSemanticMemory(key);
    expect(memory.confidence).toBe(0.8);
  });
}); 