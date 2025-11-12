const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/reports/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ projectCount, taskCount, tasksByStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
