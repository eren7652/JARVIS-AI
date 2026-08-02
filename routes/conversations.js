const express = require('express');
const Conversation = require('../models/Conversation');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const conversations = await Conversation.find({ userId: req.userId })
    .sort({ updatedAt: -1 })
    .limit(50);
  res.json(conversations);
});

router.post('/', async (req, res) => {
  const conversation = await Conversation.create({ userId: req.userId, title: 'New conversation', messages: [] });
  res.json(conversation);
});

router.put('/:id', async (req, res) => {
  const { title, messages } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (messages !== undefined) update.messages = messages;

  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    update,
    { new: true }
  );
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conversation);
});

router.delete('/:id', async (req, res) => {
  await Conversation.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
