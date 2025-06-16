import OpenAI from 'openai';

let qwenClient = null;

export function isQwenConfigured() {
  return !!process.env.DASHSCOPE_API_KEY;
}

export function getQwenClient() {
  if (!qwenClient && isQwenConfigured()) {
    qwenClient = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
    });
  }
  return qwenClient;
}

export async function qwenChat(messages) {
  if (!isQwenConfigured()) {
    throw new Error('Qwen API key not configured');
  }

  const client = getQwenClient();
  try {
    const response = await client.chat.completions.create({
      model: 'qwen-2.5',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Qwen API Error:', error);
    throw error;
  }
}

export async function qwenStreaming(messages, onChunk) {
  if (!isQwenConfigured()) {
    throw new Error('Qwen API key not configured');
  }

  const client = getQwenClient();
  try {
    const stream = await client.chat.completions.create({
      model: 'qwen-2.5',
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
    console.error('Qwen Streaming Error:', error);
    throw error;
  }
} 