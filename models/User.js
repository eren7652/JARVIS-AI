const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String }, // only set for email/password accounts
  provider: { type: String, enum: ['email', 'google', 'phone'], default: 'email' },
  picture: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
