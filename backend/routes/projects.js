const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const theBrevoMailer = require('../utils/mailer-brevo');

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const userRole = req.user.role; // Get user role from auth middleware
    const userId = req.user._id;
    
    let projects;
    
    // Admin and Project Manager can see all projects
    if (userRole === 'Admin' || userRole === 'Project Manager') {
      projects = await Project.find().populate('members', 'email name role');
    } 
    // Team Members only see projects they're assigned to
    else {
      projects = await Project.find({ members: userId }).populate('members', 'email name role');
    }
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assigneeEmails, startDate, endDate } = req.body;
    
    // Only Admin and Project Manager can create projects
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ 
        message: 'Access denied. Only Admin and Project Manager can create projects.' 
      });
    }
    
    // Check for duplicate project name (case-insensitive) across ALL projects
    // No one can create a project with a duplicate name
    const existingProject = await Project.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });
    
    if (existingProject) {
      return res.status(400).json({ 
        message: 'A project with this name already exists. Please choose a different name.' 
      });
    }
    
    let members = [];
    const notFoundEmails = [];
    
    if (Array.isArray(assigneeEmails) && assigneeEmails.length > 0) {
      // Clean and normalize email addresses
      const cleanEmails = assigneeEmails.map(e => e.trim().toLowerCase()).filter(Boolean);
      
      // Find users by email (case-insensitive)
      const users = await User.find({ 
        email: { 
          $in: cleanEmails.map(e => new RegExp(`^${e}$`, 'i')) 
        } 
      });
      
      members = users.map(u => u._id);
      
      // Check which emails were not found
      cleanEmails.forEach(email => {
        if (!users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          notFoundEmails.push(email);
        }
      });
    }
    
    const project = await Project.create({ title, description, members, startDate, endDate, createdBy: req.user._id });
    
    // Populate members field before returning
    await project.populate('members', 'email name role');
    
    // Send email notifications to all assignees
    const emailResults = [];
    if (Array.isArray(assigneeEmails) && assigneeEmails.length > 0) {
      for (const email of assigneeEmails) {
        try {
          const result = await theBrevoMailer.sendProjectAssignmentMail(email, project);
          emailResults.push({ email, success: result.success });
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error.message);
          emailResults.push({ email, success: false, error: error.message });
        }
      }
    }
    
    // Return project with email notification status
    res.json({ 
      project, 
      emailNotifications: {
        sent: emailResults.filter(r => r.success).length,
        failed: emailResults.filter(r => !r.success).length,
        total: emailResults.length,
        details: emailResults
      },
      warnings: notFoundEmails.length > 0 ? {
        message: `${notFoundEmails.length} email(s) not found in the system. These users must register first.`,
        emails: notFoundEmails
      } : null
    });
  } catch (err) {
    console.error('Project creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'email name role');
    if (!project) return res.status(404).json({ message: 'Not found' });
    
    res.json(project);
  } catch (err) {
    console.error('Error fetching project by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    // Only Admin and Project Manager can edit projects
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ 
        message: 'Access denied. Only Admin and Project Manager can edit projects.' 
      });
    }
    
    const { title, description, members, startDate, endDate, status } = req.body;
    
    const updateData = {
      title,
      description,
      members,
      startDate,
      endDate,
      status
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const project = await Project.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('members', 'email name role');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only Admin and Project Manager can delete projects
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ 
        message: 'Access denied. Only Admin and Project Manager can delete projects.' 
      });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/tasks - Get all tasks for a specific project
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee', 'email name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching project tasks:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
