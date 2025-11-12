// SendGrid mailer utility for project assignment notifications
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendProjectAssignmentMail(to, project) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // Must be verified in SendGrid
    subject: `🎯 You have been assigned to: ${project.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b3b63 0%, #52528c 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px 20px; }
          .project-info { background-color: #f8f9fa; border-left: 4px solid #52528c; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #3b3b63; width: 140px; }
          .info-value { color: #495057; flex: 1; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #3b3b63 0%, #52528c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; text-align: center; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Project Assignment</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been assigned to a new project</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #495057; margin-top: 0;">Hello,</p>
            <p style="font-size: 16px; color: #495057;">You have been assigned to work on a new project in Kavu Proman. Here are the project details:</p>
            
            <div class="project-info">
              <h2 style="margin-top: 0; color: #3b3b63; font-size: 22px;">${project.title}</h2>
              
              <div class="info-row">
                <span class="info-label">📋 Description:</span>
                <span class="info-value">${project.description || 'No description provided'}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">📅 Start Date:</span>
                <span class="info-value">${project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">⏰ Due Date:</span>
                <span class="info-value">${project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">📊 Status:</span>
                <span class="info-value">${project.status || 'Pending'}</span>
              </div>
            </div>
            
            <p style="font-size: 16px; color: #495057;">Please log in to your dashboard to view more details and start working on your tasks.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/dashboard.html" class="cta-button">
                View Dashboard →
              </a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated notification from <strong>Kavu Proman</strong></p>
            <p style="margin: 10px 0 0 0;">If you have any questions, please contact your project administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    // Don't throw error - let project creation succeed even if email fails
    return { success: false, error: error.message };
  }
}

async function sendEventNotificationMail(to, userName, eventDetails) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `📅 New Event: ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b3b63 0%, #52528c 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px 20px; }
          .event-info { background-color: #f8f9fa; border-left: 4px solid #52528c; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #3b3b63; width: 140px; }
          .info-value { color: #495057; flex: 1; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #3b3b63 0%, #52528c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; text-align: center; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Event Scheduled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to an event</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #495057; margin-top: 0;">Hello ${userName},</p>
            <p style="font-size: 16px; color: #495057;">A new event has been scheduled for project <strong>${eventDetails.projectTitle}</strong>. Here are the event details:</p>
            
            <div class="event-info">
              <h2 style="margin-top: 0; color: #3b3b63; font-size: 22px;">${eventDetails.title}</h2>
              
              <div class="info-row">
                <span class="info-label">📋 Description:</span>
                <span class="info-value">${eventDetails.description}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">📅 Date:</span>
                <span class="info-value">${eventDetails.date}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">⏰ Time:</span>
                <span class="info-value">${eventDetails.time}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">📁 Project:</span>
                <span class="info-value">${eventDetails.projectTitle}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">👤 Created by:</span>
                <span class="info-value">${eventDetails.createdBy}</span>
              </div>
            </div>
            
            <p style="font-size: 16px; color: #495057;">Please mark your calendar and join the event at the scheduled time.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/calender.html" class="cta-button">
                View Calendar →
              </a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated notification from <strong>Kavu Proman</strong></p>
            <p style="margin: 10px 0 0 0;">If you have any questions, please contact the event organizer.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await sgMail.send(msg);
    console.log(`✅ Event notification email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending event notification to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendProjectAssignmentMail, sendEventNotificationMail };