const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEAK_PASSWORDS = new Set([
  '123456', '12345678', 'password', 'password1', 'qwerty', 'abc123',
  '111111', '123123', 'letmein', 'iloveyou', '123456789', 'admin',
]);

function isRealEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

function passwordError(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number';
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'That password is too common, please pick another';
  }
  return null;
}

function signToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    picture: user.picture,
    provider: user.provider,
  };
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!isRealEmail(email)) return res.status(400).json({ error: 'Enter a valid email address' });

    const pwErr = passwordError(password);
    if (pwErr) return res.status(400).json({ error: pwErr });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      provider: 'email',
    });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', detail: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isRealEmail(email) || !password) {
      return res.status(400).json({ error: 'Enter a valid email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Same generic error whether the email doesn't exist or the password is
    // wrong — don't reveal which one, but never let a nonexistent/mismatched
    // account through.
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'No account matches that email and password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'No account matches that email and password' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'credential is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email.toLowerCase(),
        picture: payload.picture,
        provider: 'google',
      });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(401).json({ error: 'Google sign-in failed', detail: err.message });
  }
});

// --- Phone + OTP login ---
// Demo-mode: without a real SMS provider wired in, the code is returned in
// the response so the flow is fully testable without a paid SMS account.
// To go live, send `code` via a provider (e.g. Twilio) and stop returning
// devCode below.
const otpStore = new Map(); // phone -> { code, expiresAt, attempts }
const OTP_TTL_MS = 5 * 60 * 1000;

function normalizePhone(phone) {
  return typeof phone === 'string' ? phone.replace(/[^\d+]/g, '') : '';
}

router.post('/phone/request', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone || phone.length < 8) return res.status(400).json({ error: 'Enter a valid phone number' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  const smsConfigured = false; // flip this on once a real SMS provider is wired in
  if (smsConfigured) {
    res.json({ sent: true });
  } else {
    console.log(`[JARVIS] OTP for ${phone}: ${code} (demo mode, no SMS provider configured)`);
    res.json({ sent: true, devMode: true, devCode: code });
  }
});

router.post('/phone/verify', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { code, name } = req.body;

    const entry = otpStore.get(phone);
    if (!entry) return res.status(400).json({ error: 'Request a code first' });
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'Code expired, request a new one' });
    }
    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(phone);
      return res.status(429).json({ error: 'Too many attempts, request a new code' });
    }
    if (entry.code !== code) return res.status(400).json({ error: 'Incorrect code' });

    otpStore.delete(phone);

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ name: (name || 'JARVIS User').trim(), phone, provider: 'phone' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', detail: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

router.put('/me', requireAuth, async (req, res) => {
  const { name, picture } = req.body;
  const update = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    update.name = name.trim();
  }
  if (picture !== undefined) update.picture = picture;

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.provider !== 'email' || !user.passwordHash) {
      return res.status(400).json({ error: 'This account does not use a password (signed in via Google or phone)' });
    }

    const valid = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const pwErr = passwordError(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not update password', detail: err.message });
  }
});

module.exports = router;
