/**
 * @fileoverview SQLite-based memory storage for the agent
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Class representing the agent's persistent memory storage
 */
export class MemoryDB {
  /**
   * @param {string} dbPath - Path to the SQLite database file
   */
  constructor(dbPath = path.join(__dirname, '../../data/agent_memory.db')) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initializes the database and creates necessary tables
   */
  async initialize() {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    await this.createTables();
    console.log('[Memory] Database initialized');
  }

  /**
   * Creates necessary database tables if they don't exist
   * @private
   */
  async createTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS episodic_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS semantic_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS internal_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        energy REAL NOT NULL,
        mood REAL NOT NULL,
        confidence REAL NOT NULL,
        events TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * Stores an episodic memory event
   * @param {Object} event - Event to store
   * @returns {Promise<number>} ID of the stored event
   */
  async storeEpisodicMemory(event) {
    const { timestamp, type, content, metadata } = event;
    const result = await this.db.run(
      `INSERT INTO episodic_memory (timestamp, event_type, content, metadata)
       VALUES (?, ?, ?, ?)`,
      [timestamp, type, content, JSON.stringify(metadata)]
    );
    return result.lastID;
  }

  /**
   * Retrieves recent episodic memories
   * @param {number} limit - Maximum number of memories to retrieve
   * @returns {Promise<Array>} Array of recent memories
   */
  async getRecentMemories(limit = 10) {
    return this.db.all(
      `SELECT * FROM episodic_memory 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Stores or updates a semantic memory
   * @param {string} key - Memory key
   * @param {any} value - Memory value
   * @param {number} confidence - Confidence in the memory (0-1)
   */
  async storeSemanticMemory(key, value, confidence = 1.0) {
    await this.db.run(
      `INSERT INTO semantic_memory (key, value, confidence)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       confidence = excluded.confidence,
       last_updated = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value), confidence]
    );
  }

  /**
   * Retrieves a semantic memory
   * @param {string} key - Memory key
   * @returns {Promise<Object>} Memory value and metadata
   */
  async getSemanticMemory(key) {
    return this.db.get(
      'SELECT * FROM semantic_memory WHERE key = ?',
      [key]
    );
  }

  /**
   * Stores the current internal state
   * @param {Object} state - Current internal state
   */
  async storeInternalState(state) {
    const { energy, mood, confidence, recentEvents } = state;
    await this.db.run(
      `INSERT INTO internal_states 
       (timestamp, energy, mood, confidence, events)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Date.now(),
        energy,
        mood,
        confidence,
        JSON.stringify(recentEvents)
      ]
    );
  }

  /**
   * Retrieves the most recent internal state
   * @returns {Promise<Object>} Most recent internal state
   */
  async getLatestInternalState() {
    return this.db.get(
      `SELECT * FROM internal_states 
       ORDER BY timestamp DESC 
       LIMIT 1`
    );
  }

  /**
   * Closes the database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      console.log('[Memory] Database connection closed');
    }
  }
} 