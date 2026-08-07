const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Pollinations.ai — free, keyless image generation, no billing account
// needed. Switched to this after Google's Gemini image model
// (gemini-2.5-flash-image) started returning "limit: 0" on the free tier
// for real accounts (a known issue as of 2026, not specific to this app).
// If Pollinations changes its API shape, check https://gen.pollinations.ai/docs.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // random seed so the same prompt doesn't always return a cached identical image
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1024&height=1024&nologo=true&seed=${seed}`;

    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      return res.status(imgRes.status).json({ error: 'Image generation failed' });
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.json({ image: `data:${contentType};base64,${base64}` });
  } catch (err) {
    console.error('Error in /api/image:', err);
    res.status(500).json({ error: 'Image generation failed', detail: err.message });
  }
});

module.exports = router;