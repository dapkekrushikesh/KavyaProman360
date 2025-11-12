const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendProjectAssignmentMail(to, project) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `You have been assigned a new project: ${project.title}`,
    html: `<h3>Project Assignment</h3>
      <p><b>Project:</b> ${project.title}</p>
      <p><b>Description:</b> ${project.description || 'N/A'}</p>
      <p><b>Start Date:</b> ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
      <p><b>End Date:</b> ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
      <p>You have been assigned to this project. Please check your dashboard for more details.</p>`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendProjectAssignmentMail };
