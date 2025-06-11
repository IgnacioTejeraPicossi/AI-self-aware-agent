import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { claudeWithSDK, claudeStreaming, isClaudeConfigured } from '../claude.js';

describe('Claude Integration', () => {
    let originalApiKey;

    beforeAll(() => {
        // Store original API key
        originalApiKey = process.env.ANTHROPIC_API_KEY;
        
        // Check if API key is configured
        if (!isClaudeConfigured()) {
            console.warn('ANTHROPIC_API_KEY not found in environment variables. Tests may fail.');
        }
    });

    afterEach(() => {
        // Restore original API key after each test
        process.env.ANTHROPIC_API_KEY = originalApiKey;
    });

    it('should be configured with API key', () => {
        expect(isClaudeConfigured()).toBe(true);
    });

    it('should get a response from Claude', async () => {
        const response = await claudeWithSDK('Hello! Please respond with a short greeting.');
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
    }, 30000); // Increased timeout for API call

    it('should handle streaming responses', async () => {
        const chunks = [];
        await claudeStreaming('Say "Hello" in 3 words.', (chunk) => {
            chunks.push(chunk);
        });
        
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks.join('')).toContain('Hello');
    }, 30000); // Increased timeout for API call

    it('should handle errors gracefully', async () => {
        // Store current API key
        const currentKey = process.env.ANTHROPIC_API_KEY;
        
        try {
            // Test with invalid API key
            process.env.ANTHROPIC_API_KEY = 'invalid_key';
            const response = await claudeWithSDK('Hello');
            expect(response).toBeNull();
        } finally {
            // Restore original API key
            process.env.ANTHROPIC_API_KEY = currentKey;
        }
    });
}); 