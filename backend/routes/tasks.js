const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    
    let query = {};
    
    // Team Members only see tasks assigned to them or tasks in projects they're members of
    if (userRole !== 'Admin' && userRole !== 'Project Manager') {
      // Find projects where user is a member
      const Project = require('../models/Project');
      const userProjects = await Project.find({ members: userId }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      
      // Get tasks where user is assignee OR task belongs to user's projects
      query = {
        $or: [
          { assignee: userId },
          { project: { $in: projectIds } }
        ]
      };
    }
    
    const tasks = await Task.find(query)
      .populate('assignee', 'email name')
      .populate('project', 'title')
      .populate('comments.author', 'name email');
    
    // Add latest comment to each task
    const tasksWithLatestComment = tasks.map(task => {
      const taskObj = task.toObject();
      if (taskObj.comments && taskObj.comments.length > 0) {
        taskObj.latestComment = taskObj.comments[taskObj.comments.length - 1].text;
      }
      return taskObj;
    });
    
    res.json(tasksWithLatestComment);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, project, assignee, status, startDate, endDate, dueDate, priority } = req.body;
    const task = await Task.create({ 
      title, 
      description, 
      project, 
      assignee, 
      status: status || 'todo', 
      priority: priority || 'medium',
      startDate, 
      endDate, 
      dueDate,
      createdBy: req.user._id 
    });
    
    // Populate task with assignee and project details before returning
    await task.populate('assignee', 'email name');
    await task.populate('project', 'title');
    
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks/:id/comments - Add comment to task
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.comments.push({
      text,
      author: req.user._id,
      createdAt: new Date()
    });
    
    await task.save();
    await task.populate('comments.author', 'name email');
    
    res.status(201).json(task);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'email name')
      .populate('project', 'title')
      .populate('comments.author', 'name email');
    
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    const taskObj = task.toObject();
    if (taskObj.comments && taskObj.comments.length > 0) {
      taskObj.latestComment = taskObj.comments[taskObj.comments.length - 1].text;
    }
    
    res.json(taskObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'email name')
      .populate('project', 'title');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'email name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
