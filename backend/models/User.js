const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: null }, // URL or path to avatar image
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  // Notification preferences
  notificationPreferences: {
    emailAlerts: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: false },
    weeklySummary: { type: Boolean, default: true }
  },
  // Privacy settings
  privacySettings: {
    profileVisible: { type: Boolean, default: true },
    dataSharing: { type: Boolean, default: false },
    twoFactor: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
