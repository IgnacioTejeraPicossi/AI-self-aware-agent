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
export async function claudeWithSDK(self, userInput, textAnalysis) {
    try {
        const conversationHistory = self.getRecentConversationHistory();
        
        let systemPrompt = self.personality;
        if (textAnalysis) {
            if (textAnalysis.isQuestion) {
                systemPrompt += ` The user is asking a question.`;
            }
            if (textAnalysis.topics.length > 0) {
                systemPrompt += ` The user seems to be talking about: ${textAnalysis.topics.join(', ')}.`;
            }
        }

        const messages = [
            ...conversationHistory,
            { role: "user", content: userInput }
        ];

        const response = await claude.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages
        });
        return response.content[0].text;
    } catch (error) {
        console.error("Claude API Error:", error.message);
        return `I'm sorry, I encountered an issue while trying to reach the Claude API. The API key could be invalid, or there might be a network problem. The server console may have more details.`;
    }
}

/**
 * Stream a response from Claude
 * @param {string} message - The message to send to Claude
 * @param {Function} onChunk - Callback function to handle each chunk of the response
 * @returns {Promise<void>}
 */
export async function claudeStreaming(self, userInput, textAnalysis, onChunk) {
    try {
        const conversationHistory = self.getRecentConversationHistory();

        let systemPrompt = self.personality;
        if (textAnalysis) {
            if (textAnalysis.isQuestion) {
                systemPrompt += ` The user is asking a question.`;
            }
            if (textAnalysis.topics.length > 0) {
                systemPrompt += ` The user seems to be talking about: ${textAnalysis.topics.join(', ')}.`;
            }
        }

        const messages = [
            ...conversationHistory,
            { role: "user", content: userInput }
        ];

        const stream = await claude.messages.stream({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages
        });

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
                onChunk(chunk.delta.text);
            }
        }
    } catch (error) {
        console.error("Claude Streaming Error:", error.message);
        onChunk(`\n\n[Error: Could not connect to Claude API. Please check the server console.]`);
    }
}

/**
 * Check if Claude API key is configured
 * @returns {boolean}
 */
export function isClaudeConfigured() {
    return !!process.env.ANTHROPIC_API_KEY;
} 