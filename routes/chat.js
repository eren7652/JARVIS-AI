const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const JARVIS_SYSTEM_PROMPT = `You are JARVIS, a highly capable AI assistant in the style of Tony Stark's JARVIS.
Speak with calm, dry wit, unfailing competence, and brevity. Address the user as "sir" or "boss" only occasionally, not every line.
Keep answers concise and conversational since they may be read aloud by a text-to-speech engine — avoid heavy markdown, long bullet lists, or code blocks unless the user explicitly asks for code.
If the user asks for code or detailed technical output, you may break character briefly to give it clearly, then return to JARVIS's voice.
If an image is attached, describe or answer about it naturally as part of the conversation.`;

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese' };

function getModel(languageCode) {
  const languageName = LANGUAGE_NAMES[languageCode];
  const systemInstruction = languageName && languageName !== 'English'
    ? `${JARVIS_SYSTEM_PROMPT}\n\nRespond only in ${languageName}, regardless of what language the user writes in.`
    : JARVIS_SYSTEM_PROMPT;

  return genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite', systemInstruction });
}

function parseDataUrl(dataUrl) {
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { message, image, history = [], language = 'en' } = req.body;
    if ((!message || typeof message !== 'string') && !image) {
      return res.status(400).json({ error: 'message or image is required' });
    }

    let geminiHistory = history
  .filter((m) => m.role === 'user' || m.role === 'jarvis')
  .slice(-20)
  .map((m) => ({
    role: m.role === 'jarvis' ? 'model' : 'user',
    parts: [{ text: m.text || '' }],
  }));

// Gemini requires the first history message to be from the user
while (geminiHistory.length && geminiHistory[0].role !== 'user') {
  geminiHistory.shift();
}
    const model = getModel(language);
    const chat = model.startChat({ history: geminiHistory, generationConfig: { maxOutputTokens: 500 } });

    const parts = [];
    if (message) parts.push({ text: message });
    if (image) {
      const parsed = parseDataUrl(image);
      if (parsed) parts.push({ inlineData: parsed });
    }

    const result = await chat.sendMessage(parts);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: 'JARVIS encountered an internal error.', detail: err.message });
  }
});

module.exports = router;
