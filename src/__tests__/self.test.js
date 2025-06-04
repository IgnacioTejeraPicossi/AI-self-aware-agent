/**
 * @fileoverview Tests for the Self class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Self } from '../self.js';

describe('Self', () => {
  let self;

  beforeEach(() => {
    self = new Self();
  });

  it('should initialize with default state', () => {
    const state = self.getState();
    expect(state.energy).toBe(100);
    expect(state.mood).toBe(0.5);
    expect(state.confidence).toBe(0.7);
    expect(Array.isArray(state.recentEvents)).toBe(true);
    expect(Array.isArray(state.activeGoals)).toBe(true);
  });

  it('should update internal states over time', async () => {
    // Simulate time passing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = self.update();
    expect(state.energy).toBeLessThan(100);
    expect(state.mood).toBeDefined();
    expect(state.confidence).toBeDefined();
  });

  it('should record action impacts', () => {
    self.recordActionImpact('test_action', true);
    const state = self.getState();
    
    expect(state.energy).toBeLessThan(100);
    expect(state.recentEvents).toContain('test_action_success');
  });

  it('should provide introspection data', () => {
    const introspection = self.introspect();
    
    expect(introspection).toHaveProperty('currentState');
    expect(introspection).toHaveProperty('homeostasis');
    expect(introspection).toHaveProperty('recentActivity');
    expect(introspection).toHaveProperty('activeGoals');
    expect(introspection).toHaveProperty('timestamp');
  });

  it('should check if actions can be performed', () => {
    // Test with normal state
    expect(self.canPerformAction('test')).toBe(true);
    
    // Test with low energy
    self.state.energy = 10;
    expect(self.canPerformAction('test')).toBe(false);
    
    // Test with low confidence
    self.state.energy = 100;
    self.state.confidence = 0.1;
    expect(self.canPerformAction('test')).toBe(false);
  });
}); 