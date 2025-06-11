import 'dotenv/config';

let openai = null;
let gemini = null;
let OpenAIError = null;
let GeminiError = null;

async function setupOpenAI() {
  try {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    OpenAIError = (await import('openai')).OpenAIError;
  } catch (e) {
    openai = null;
  }
}

async function setupGemini() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (e) {
    gemini = null;
  }
}

await setupOpenAI();
await setupGemini();

export async function chatWithLLM(prompt) {
  // Try OpenAI first
  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // or your preferred model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      });
      return completion.choices[0].message.content.trim();
    } catch (err) {
      // If OpenAI fails, fall through to Gemini
      console.warn('[Agent] OpenAI error:', err.message);
    }
  }

  // Try Gemini if available
  if (gemini && process.env.GEMINI_API_KEY) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn('[Agent] Gemini error:', err.message);
    }
  }

  // Fallback
  return `I'm running in local mode. No valid LLM API key was found, so I can only give basic responses. Your message was: ${prompt}`;
}
