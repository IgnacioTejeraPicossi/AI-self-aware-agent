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

export async function deepseekChat(messages) {
  if (!isDeepseekConfigured()) {
    throw new Error('DeepSeek API key not configured');
  }

  const client = getDeepseekClient();
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
}

export async function deepseekStreaming(messages, onChunk) {
  if (!isDeepseekConfigured()) {
    throw new Error('DeepSeek API key not configured');
  }

  const client = getDeepseekClient();
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
    console.error('DeepSeek Streaming Error:', error);
    throw error;
  }
} 