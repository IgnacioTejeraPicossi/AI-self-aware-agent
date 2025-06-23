import OpenAI from 'openai';

let deepseekClient = null;

export function isDeepseekConfigured() {
  return !!process.env.DEEPSEEK_API_KEY;
}

export function getDeepseekClient() {
  if (!deepseekClient && isDeepseekConfigured()) {
    deepseekClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });
  }
  return deepseekClient;
}

export async function deepseekChat(self, userInput, textAnalysis) {
  if (!isDeepseekConfigured()) {
    throw new Error('DeepSeek API key not configured');
  }

  const client = getDeepseekClient();
  
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
    { role: 'system', content: systemPrompt },
    ...self.getRecentConversationHistory(),
    { role: 'user', content: userInput },
  ];
  
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    return `I apologize, but I'm having trouble connecting to the DeepSeek API. The API key might be invalid or there could be a network issue. Please check the server console for details.`;
  }
}

export async function deepseekStreaming(self, userInput, textAnalysis, onChunk) {
  if (!isDeepseekConfigured()) {
    throw new Error('DeepSeek API key not configured');
  }

  const client = getDeepseekClient();

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
    { role: 'system', content: systemPrompt },
    ...self.getRecentConversationHistory(),
    { role: 'user', content: userInput },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('DeepSeek Streaming Error:', error.message);
    // In a streaming context, we can send an error message through the chunk callback
    onChunk(`\n\n[Error: Could not connect to DeepSeek API. Please check the server console.]`);
  }
} 