const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendEventNotificationMail } = require('../utils/mailer-brevo');

// GET all events for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { createdBy: req.user._id },
        { attendees: req.user._id }
      ]
    }).populate('project', 'title')
      .populate('createdBy', 'name email')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date, time, project: projectId } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const eventData = {
      title,
      description,
      date: new Date(date),
      time,
      createdBy: req.user._id
    };

    // If project is specified, add it and get members
    let projectMembers = [];
    if (projectId) {
      const project = await Project.findById(projectId).populate('members', 'email name');
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      eventData.project = projectId;
      eventData.attendees = project.members.map(m => m._id);
      projectMembers = project.members;
    }

    const event = new Event(eventData);
    await event.save();

    // Populate event data for response
    await event.populate('project', 'title');
    await event.populate('createdBy', 'name email');

    // Send email notifications to project members
    const emailNotifications = {
      sent: [],
      failed: [],
      total: projectMembers.length
    };

    if (projectMembers.length > 0) {
      for (const member of projectMembers) {
        // Don't send notification to the creator
        if (member._id && req.user._id && member._id.toString() === req.user._id.toString()) continue;

        try {
          await sendEventNotificationMail(
            member.email,
            member.name,
            {
              title: event.title,
              description: event.description || 'No description provided',
              date: new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              time: event.time || 'All day',
              projectTitle: event.project?.title || 'General',
              createdBy: req.user.name || req.user.email
            }
          );
          emailNotifications.sent.push(member.email);
        } catch (emailError) {
          console.error(`Failed to send email to ${member.email}:`, emailError);
          emailNotifications.failed.push({
            email: member.email,
            error: emailError.message
          });
        }
      }
    }

    res.status(201).json({ 
      event, 
      message: 'Event created successfully',
      emailNotifications 
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE an event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only creator can delete
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
