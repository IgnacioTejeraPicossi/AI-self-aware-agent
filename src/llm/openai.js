let openai = null;
let hasKey = !!process.env.OPENAI_API_KEY;

if (hasKey) {
  const OpenAI = (await import('openai')).default;
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('[Agent] Warning: OPENAI_API_KEY is missing. Falling back to rule-based responses.');
}

export async function chatWithGPT(prompt) {
  if (!hasKey) {
    // Fallback: simple echo or rule-based response
    return "I'm running in local mode. No OpenAI API key was found, so I can only give basic responses. Your message was: " + prompt;
  }
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200
  });
  return completion.choices[0].message.content.trim();
}