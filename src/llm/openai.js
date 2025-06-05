import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function chatWithGPT(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200
  });
  return completion.choices[0].message.content.trim();
}