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

export async function chatWithLLM(self, userInput, textAnalysis) {
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
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userInput },
  ];

  // Try OpenAI first
  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // or your preferred model
        messages: messages,
        max_tokens: 250
      });
      return completion.choices[0].message.content.trim();
    } catch (err) {
      console.warn('[Agent] OpenAI error:', err.message);
      // Don't return here, fall through to the next model
    }
  }

  // Try Gemini if available
  if (gemini && process.env.GEMINI_API_KEY) {
    try {
      // For Gemini, we need to format the prompt differently
      const geminiPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nuser: ${userInput}`;
      const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(geminiPrompt);
      return result.response.text();
    } catch (err) {
      console.warn('[Agent] Gemini error:', err.message);
      // Don't return here, fall through to the fallback
    }
  }

  // Fallback message if all API-based models fail
  let fallbackMessage = "I'm currently running in local mode. ";
  if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
    fallbackMessage += "I tried to connect to the configured AI services (OpenAI, Gemini), but it seems the keys are invalid or the services are unreachable. Please check the server console for specific errors.";
  } else {
    fallbackMessage += "No LLM API key was found, so I can only give basic responses.";
  }
  fallbackMessage += ` Your message was: ${userInput}`;
  return fallbackMessage;
}
