const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: null }, // URL or path to avatar image
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
