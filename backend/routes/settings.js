const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// simple settings storage per user (in-memory placeholder)
const userSettings = {}; // replace with DB model for production

router.get('/', auth, (req, res) => {
  res.json(userSettings[req.user._id] || {});
});

router.post('/', auth, (req, res) => {
  userSettings[req.user._id] = req.body;
  res.json({ success: true, settings: userSettings[req.user._id] });
});

module.exports = router;
