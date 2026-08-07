require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversations');
const imageRoutes = require('./routes/image');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.MONGODB_URI) console.warn('\n[WARNING] MONGODB_URI is not set — accounts and chat history will not work.\n');
if (!process.env.JWT_SECRET) console.warn('\n[WARNING] JWT_SECRET is not set — logins will fail.\n');
if (!process.env.GEMINI_API_KEY) console.warn('\n[WARNING] GEMINI_API_KEY is not set — JARVIS will not respond.\n');

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/image', imageRoutes);

app.listen(PORT, () => {
  console.log(`JARVIS server online at http://localhost:${PORT}`);
});
