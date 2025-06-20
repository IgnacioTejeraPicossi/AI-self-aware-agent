import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Send a message to Claude and get a response
 * @param {string} message - The message to send to Claude
 * @returns {Promise<string>} The response from Claude
 */
export async function claudeWithSDK(self, userInput) {
    try {
        const conversationHistory = self.getRecentConversationHistory();
        const messages = [
            ...conversationHistory,
            { role: "user", content: userInput }
        ];

        const response = await claude.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1000,
            system: self.personality,
            messages: messages
        });
        return response.content[0].text;
    } catch (error) {
        console.error("Claude API Error:", error);
        return null;
    }
}

/**
 * Stream a response from Claude
 * @param {string} message - The message to send to Claude
 * @param {Function} onChunk - Callback function to handle each chunk of the response
 * @returns {Promise<void>}
 */
export async function claudeStreaming(self, userInput, onChunk) {
    try {
        const conversationHistory = self.getRecentConversationHistory();
        const messages = [
            ...conversationHistory,
            { role: "user", content: userInput }
        ];

        const stream = await claude.messages.stream({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1000,
            system: self.personality,
            messages: messages
        });

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
                onChunk(chunk.delta.text);
            }
        }
    } catch (error) {
        console.error("Claude Streaming Error:", error);
    }
}

/**
 * Check if Claude API key is configured
 * @returns {boolean}
 */
export function isClaudeConfigured() {
    return !!process.env.ANTHROPIC_API_KEY;
} 