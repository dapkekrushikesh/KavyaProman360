const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users?search=...
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  if (!search) return res.json([]);
  // Search by email or name (case-insensitive)
  const users = await User.find({
    $or: [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ]
  });
  res.json(users);
});

// GET /api/users/settings - Get current user's settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences privacySettings');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return settings with defaults if not set
    const settings = {
      notificationPreferences: user.notificationPreferences || {
        emailAlerts: true,
        projectUpdates: false,
        weeklySummary: true
      },
      privacySettings: user.privacySettings || {
        profileVisible: true,
        dataSharing: false,
        twoFactor: false
      }
    };

    res.json(settings);
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/settings - Update current user's settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { notificationPreferences, privacySettings } = req.body;

    // Get current user with existing settings
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Merge notification preferences (don't overwrite all, just update provided fields)
    if (notificationPreferences) {
      currentUser.notificationPreferences = {
        ...currentUser.notificationPreferences,
        ...notificationPreferences
      };
    }
    
    // Merge privacy settings
    if (privacySettings) {
      currentUser.privacySettings = {
        ...currentUser.privacySettings,
        ...privacySettings
      };
    }

    // Save the updated user
    await currentUser.save();

    console.log(`✅ Settings updated for user: ${req.user.email}`);
    res.json({
      message: 'Settings updated successfully',
      settings: {
        notificationPreferences: currentUser.notificationPreferences,
        privacySettings: currentUser.privacySettings
      }
    });
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
