// Brevo (Sendinblue) mailer utility for project assignment notifications
const axios = require('axios');

// Debug: Log API key status
if (process.env.BREVO_API_KEY) {
  const key = process.env.BREVO_API_KEY;
  console.log(`📧 Brevo API Key configured: ${key.substring(0, 10)}...${key.substring(key.length - 5)}`);
  console.log(`📧 Brevo From Email: ${process.env.BREVO_FROM_EMAIL}`);
} else {
  console.error('❌ BREVO_API_KEY not found in environment variables!');
}

async function sendProjectAssignmentMail(to, project) {
  try {
    const emailData = {
      sender: {
        email: process.env.BREVO_FROM_EMAIL,
        name: 'Kavu Proman'
      },
      to: [{ email: to }],
      subject: `🎯 You have been assigned to: ${project.title}`,
      htmlContent: `
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
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard.html" class="cta-button">
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

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    console.log(`✅ Email sent successfully to ${to} (Message ID: ${response.data.messageId})`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.response?.data || error.message);
    // Don't throw error - let project creation succeed even if email fails
    return { success: false, error: error.response?.data || error.message };
  }
}

async function sendEventNotificationMail(to, userName, eventDetails) {
  try {
    const emailData = {
      sender: {
        email: process.env.BREVO_FROM_EMAIL,
        name: 'Kavu Proman'
      },
      to: [{ email: to }],
      subject: `📅 New Event: ${eventDetails.title}`,
      htmlContent: `
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
              <h1>📅 New Event Notification</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have a new event scheduled</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #495057; margin-top: 0;">Hello ${userName},</p>
              <p style="font-size: 16px; color: #495057;">A new event has been added to your calendar in Kavu Proman:</p>
              
              <div class="event-info">
                <h2 style="margin-top: 0; color: #3b3b63; font-size: 22px;">${eventDetails.title}</h2>
                
                <div class="info-row">
                  <span class="info-label">📋 Description:</span>
                  <span class="info-value">${eventDetails.description || 'No description provided'}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">📅 Date:</span>
                  <span class="info-value">${eventDetails.start ? new Date(eventDetails.start).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">⏰ Time:</span>
                  <span class="info-value">${eventDetails.start ? new Date(eventDetails.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Not specified'}</span>
                </div>
              </div>
              
              <p style="font-size: 16px; color: #495057;">Please check your calendar for more details.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/calender.html" class="cta-button">
                  View Calendar →
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

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    console.log(`✅ Event notification email sent to ${to} (Message ID: ${response.data.messageId})`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error(`❌ Error sending event notification to ${to}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = {
  sendProjectAssignmentMail,
  sendEventNotificationMail
};
