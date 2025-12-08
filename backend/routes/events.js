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
    const { title, description, date, time, emails, project: projectId, notifyAll } = req.body;

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
    let allEmployees = [];
    
    if (projectId && projectId !== 'other') {
      const project = await Project.findById(projectId).populate('members', 'email name');
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      eventData.project = projectId;
      eventData.attendees = project.members.map(m => m._id);
      projectMembers = project.members;
    } else if (notifyAll || projectId === 'other') {
      // If "Other" is selected or notifyAll flag is true, get all registered employees
      allEmployees = await User.find({}).select('email name');
      console.log(`📧 "Other" selected - Will notify all ${allEmployees.length} registered employees`);
    }

    const event = new Event(eventData);
    await event.save();

    // Populate event data for response
    await event.populate('project', 'title');
    await event.populate('createdBy', 'name email');

    // Send email notifications to project members, all employees, and additional emails
    const additionalEmailsCount = (emails && Array.isArray(emails)) ? emails.length : 0;
    const emailNotifications = {
      sent: [],
      failed: [],
      total: projectMembers.length + allEmployees.length + additionalEmailsCount
    };

    // Send to project members
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

    // Send to all registered employees if "Other" is selected
    if (allEmployees.length > 0) {
      console.log(`📧 Sending event notifications to all ${allEmployees.length} employees...`);
      for (const employee of allEmployees) {
        // Don't send notification to the creator
        if (employee._id && req.user._id && employee._id.toString() === req.user._id.toString()) {
          console.log(`⏭️ Skipping creator: ${employee.email}`);
          continue;
        }

        try {
          await sendEventNotificationMail(
            employee.email,
            employee.name,
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
              projectTitle: 'General Event (All Employees)',
              createdBy: req.user.name || req.user.email
            }
          );
          emailNotifications.sent.push(employee.email);
          console.log(`✅ Sent to: ${employee.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${employee.email}:`, emailError);
          emailNotifications.failed.push({
            email: employee.email,
            error: emailError.message
          });
        }
      }
    }

    // Send to additional emails if provided
    if (emails && Array.isArray(emails) && emails.length > 0) {
      for (const email of emails) {
        if (!email || !email.trim()) continue;
        
        try {
          await sendEventNotificationMail(
            email,
            'Guest',
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
          emailNotifications.sent.push(email);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          emailNotifications.failed.push({
            email: email,
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
