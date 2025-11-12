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

module.exports = router;
