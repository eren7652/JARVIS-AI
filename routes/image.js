const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Uses the same free Gemini API key already configured for chat — no extra
// signup needed. Model name/response format for image generation moves fast
// on Google's end (same story as the chat model rename we hit before), so
// if this starts 404ing, check https://ai.google.dev/gemini-api/docs/models
// for the current image-capable model name.
const IMAGE_MODEL = 'gemini-2.5-flash-image';

router.post('/', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    );

    const data = await apiRes.json();
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data.error?.message || 'Image generation failed' });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart) {
      return res.status(502).json({ error: 'JARVIS did not return an image for that prompt' });
    }

    const { mimeType, data: base64 } = imagePart.inlineData;
    res.json({ image: `data:${mimeType};base64,${base64}` });
  } catch (err) {
    console.error('Error in /api/image:', err);
    res.status(500).json({ error: 'Image generation failed', detail: err.message });
  }
});

module.exports = router;