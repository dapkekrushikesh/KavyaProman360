const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendTaskAssignmentMail, sendTaskUpdateMail } = require('../utils/mailer-brevo');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const { projectId } = req.query; // Get projectId filter from query params
    
    let query = {};
    
    // Filter by specific project if projectId is provided
    if (projectId) {
      query.project = projectId;
    }
    
    // Team Members only see tasks assigned to them or tasks in projects they're members of
    if (userRole !== 'Admin' && userRole !== 'Team Lead' && userRole !== 'Project Manager') {
      // Find projects where user is a member
      const Project = require('../models/Project');
      const userProjects = await Project.find({ members: userId }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      
      // Get tasks where user is assignee OR task belongs to user's projects
      const roleBasedQuery = {
        $or: [
          { assignee: userId },
          { project: { $in: projectIds } }
        ]
      };
      
      // Combine with projectId filter if it exists
      if (projectId) {
        query = { $and: [{ project: projectId }, roleBasedQuery] };
      } else {
        query = roleBasedQuery;
      }
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
    
    // Convert empty string to null for assignee
    const assigneeId = assignee && assignee !== '' ? assignee : null;
    
    const task = await Task.create({ 
      title, 
      description, 
      project, 
      assignee: assigneeId, 
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
    
    // Send email notification to assignee if task is assigned
    let emailNotification = { sent: false };
    if (assigneeId) {
      try {
        const assignedUser = await User.findById(assigneeId);
        if (assignedUser && assignedUser.email) {
          // Don't send email if user is assigning to themselves
          if (assignedUser._id.toString() !== req.user._id.toString()) {
            await sendTaskAssignmentMail(
              assignedUser.email,
              assignedUser.name,
              {
                title: task.title,
                description: task.description || 'No description provided',
                projectTitle: task.project?.title || 'General Task',
                dueDate: task.dueDate,
                priority: task.priority || 'Medium',
                status: task.status || 'To Do'
              }
            );
            emailNotification = { sent: true, email: assignedUser.email };
            console.log(`✅ Task assignment email sent to ${assignedUser.email}`);
          }
        }
      } catch (emailError) {
        console.error('Failed to send task assignment email:', emailError);
        emailNotification = { sent: false, error: emailError.message };
      }
    }
    
    res.status(201).json({ task, emailNotification });
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
    // Get the existing task to compare changes
    const existingTask = await Task.findById(req.params.id)
      .populate('assignee', 'email name')
      .populate('project', 'title');
    
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Track changes
    const changes = {};
    const fieldsToTrack = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      dueDate: 'Due Date'
    };
    
    Object.keys(fieldsToTrack).forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== existingTask[field]) {
        let oldValue = existingTask[field];
        let newValue = req.body[field];
        
        // Format dates
        if (field === 'dueDate') {
          oldValue = oldValue ? new Date(oldValue).toLocaleDateString() : 'Not set';
          newValue = newValue ? new Date(newValue).toLocaleDateString() : 'Not set';
        }
        
        changes[fieldsToTrack[field]] = { old: oldValue, new: newValue };
      }
    });
    
    // Check if assignee changed
    const assigneeChanged = req.body.assignee && 
                           req.body.assignee !== existingTask.assignee?._id?.toString();
    
    // Update the task
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'email name')
      .populate('project', 'title');
    
    // Send email notifications
    let emailNotifications = { sent: [], failed: [] };
    
    // If assignee changed, send assignment email to new assignee
    if (assigneeChanged && req.body.assignee) {
      try {
        const newAssignee = await User.findById(req.body.assignee);
        if (newAssignee && newAssignee.email && newAssignee._id.toString() !== req.user._id.toString()) {
          await sendTaskAssignmentMail(
            newAssignee.email,
            newAssignee.name,
            {
              title: task.title,
              description: task.description || 'No description provided',
              projectTitle: task.project?.title || 'General Task',
              dueDate: task.dueDate,
              priority: task.priority || 'Medium',
              status: task.status || 'To Do'
            }
          );
          emailNotifications.sent.push({ email: newAssignee.email, type: 'assignment' });
          console.log(`✅ Task assignment email sent to ${newAssignee.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send task assignment email:', emailError);
        emailNotifications.failed.push({ email: req.body.assignee, error: emailError.message });
      }
    }
    
    // If task was updated (not just assigned), send update email to existing assignee
    if (Object.keys(changes).length > 0 && existingTask.assignee && existingTask.assignee.email) {
      // Don't send update email if user is updating their own task
      if (existingTask.assignee._id.toString() !== req.user._id.toString()) {
        try {
          await sendTaskUpdateMail(
            existingTask.assignee.email,
            existingTask.assignee.name,
            {
              title: task.title,
              projectTitle: task.project?.title || 'General Task',
              dueDate: task.dueDate,
              priority: task.priority || 'Medium'
            },
            changes
          );
          emailNotifications.sent.push({ email: existingTask.assignee.email, type: 'update' });
          console.log(`✅ Task update email sent to ${existingTask.assignee.email}`);
        } catch (emailError) {
          console.error('Failed to send task update email:', emailError);
          emailNotifications.failed.push({ email: existingTask.assignee.email, error: emailError.message });
        }
      }
    }

    // If status changed, send notification to Admin, Project Manager, and Team Lead
    if (changes['Status']) {
      try {
        // Find all users with roles: Admin, Project Manager, or Team Lead
        const managementUsers = await User.find({
          role: { $in: ['Admin', 'Project Manager', 'Team Lead'] }
        });

        // If task has a project, get the project creator to include them
        let projectCreator = null;
        if (task.project && task.project._id) {
          const Project = require('../models/Project');
          const projectDetails = await Project.findById(task.project._id).populate('createdBy', 'email name role');
          projectCreator = projectDetails?.createdBy;
        }

        // Create a set of unique emails to notify (avoid duplicates)
        const emailsToNotify = new Set();
        
        // Add management users
        managementUsers.forEach(user => {
          // Don't notify the user who made the change
          if (user._id.toString() !== req.user._id.toString() && user.email) {
            emailsToNotify.add(JSON.stringify({ email: user.email, name: user.name, role: user.role }));
          }
        });

        // Add project creator if they exist and aren't already included
        if (projectCreator && projectCreator.email && projectCreator._id.toString() !== req.user._id.toString()) {
          emailsToNotify.add(JSON.stringify({ email: projectCreator.email, name: projectCreator.name, role: projectCreator.role }));
        }

        // Send notifications to all relevant users
        for (const userStr of emailsToNotify) {
          const user = JSON.parse(userStr);
          try {
            await sendTaskUpdateMail(
              user.email,
              user.name,
              {
                title: task.title,
                projectTitle: task.project?.title || 'General Task',
                dueDate: task.dueDate,
                priority: task.priority || 'Medium',
                assignee: task.assignee?.name || 'Unassigned'
              },
              changes
            );
            emailNotifications.sent.push({ email: user.email, type: 'status_change_notification', role: user.role });
            console.log(`✅ Status change notification sent to ${user.role}: ${user.email}`);
          } catch (emailError) {
            console.error(`Failed to send status notification to ${user.email}:`, emailError);
            emailNotifications.failed.push({ email: user.email, error: emailError.message });
          }
        }
      } catch (error) {
        console.error('Error sending status change notifications:', error);
      }
    }
    
    res.json({ 
      task, 
      emailNotifications: {
        sent: emailNotifications.sent.length,
        failed: emailNotifications.failed.length,
        details: emailNotifications
      }
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
