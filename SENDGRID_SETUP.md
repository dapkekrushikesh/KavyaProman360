# SendGrid Email Notification Setup Guide

## Overview
Kavu Proman now supports email notifications when team members are assigned to projects. This guide will help you set up SendGrid to enable this feature.

## Features Implemented
✅ **Automatic Email Notifications** when a project is assigned to users
✅ **Professional HTML Email Template** with project details
✅ **Email Status Tracking** - See which emails were sent successfully
✅ **Error Handling** - Project creation succeeds even if email fails
✅ **Multiple Recipients** - Send notifications to multiple team members at once

## Setup Instructions

### Step 1: Create a SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com/)
2. Click "Start for Free" or "Sign Up"
3. Complete the registration process
4. Verify your email address

### Step 2: Get Your API Key
1. Log in to your SendGrid account
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Choose **"Full Access"** or select specific permissions:
   - **Mail Send**: Full Access (required)
5. Give it a name like "Kavu Proman Email Service"
6. Click **"Create & View"**
7. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again!)

### Step 3: Verify Your Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Choose one of these options:

   **Option A: Single Sender Verification** (Easiest for testing)
   - Click **"Verify a Single Sender"**
   - Fill in your details:
     - From Name: "Kavu Proman"
     - From Email Address: Your email (e.g., admin@yourcompany.com)
     - Reply To: Same as above
     - Company Address, City, State, Zip, Country
   - Click **"Create"**
   - Check your email and click the verification link

   **Option B: Domain Authentication** (Better for production)
   - Click **"Authenticate Your Domain"**
   - Follow the DNS setup instructions
   - Wait for DNS propagation (can take up to 48 hours)

### Step 4: Configure Your Backend
1. Open `backend/.env` file
2. Update these variables with your SendGrid details:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=your_verified_sender_email@example.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5500
```

**Example:**
```env
SENDGRID_API_KEY=SG.X1YzabCDEF2GHIjklMNO3PqRs-TUVwxYZ4AbcdEF5GhIj_KlmnOpQrstUvWxYz
SENDGRID_FROM_EMAIL=admin@kavuproman.com
FRONTEND_URL=http://localhost:5500
```

### Step 5: Restart Your Backend Server
1. Stop the current backend server (Ctrl+C in the terminal)
2. Restart it:
```bash
cd backend
npm start
```

### Step 6: Test the Email Functionality
1. Open your frontend application
2. Log in as an admin
3. Create a new project:
   - Click **"New Project"**
   - Fill in the project details
   - In **"Assignee Emails"** field, enter one or more email addresses (comma-separated):
     ```
     user1@example.com, user2@example.com
     ```
   - Click **"Save Project"**
4. Check the email inbox of the assigned users
5. You should see a professional email with project details

## Email Template Features

The notification email includes:
- 📧 Professional branded header
- 📋 Project title and description
- 📅 Start date and due date
- 📊 Project status
- 🔗 Direct link to dashboard
- 📱 Mobile-responsive design

## Troubleshooting

### Issue: "Email could not be sent"
**Possible causes:**
1. Invalid API key → Check if you copied it correctly
2. Unverified sender email → Complete Step 3
3. SendGrid account suspended → Check your SendGrid dashboard
4. API key doesn't have Mail Send permission → Create a new key with proper permissions

### Issue: "Project created but no email received"
**Check:**
1. Spam/Junk folder in recipient's email
2. Backend console logs for error messages
3. SendGrid Activity Feed:
   - Go to **Activity** in SendGrid dashboard
   - Check if emails were sent and their status

### Issue: Backend error when creating project
**Solutions:**
1. Check if `@sendgrid/mail` package is installed:
   ```bash
   cd backend
   npm install @sendgrid/mail
   ```
2. Verify `.env` file has correct format (no quotes around values)
3. Check backend console for specific error messages

## SendGrid Free Tier Limits
- **100 emails per day** for free
- Perfect for testing and small teams
- Upgrade to paid plan for higher limits

## Security Best Practices
⚠️ **Never commit your `.env` file to version control!**
- The `.env` file is already in `.gitignore`
- Keep your API key secret
- Don't share screenshots containing your API key
- Rotate keys regularly from SendGrid dashboard

## Support Resources
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
- [SendGrid Support](https://support.sendgrid.com/)

## Alternative: Using Gmail (For Development Only)
If you prefer to use Gmail for testing (not recommended for production):
1. The system also has a Nodemailer setup in `backend/utils/mailer.js`
2. Update `.env`:
   ```env
   EMAIL_USER=your.gmail@gmail.com
   EMAIL_PASS=your_app_specific_password
   ```
3. Generate Gmail App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Create password for "Mail"

However, SendGrid is recommended because:
- ✅ Better deliverability
- ✅ Professional email templates
- ✅ Detailed analytics
- ✅ No daily limits issues
- ✅ Spam folder avoidance

---

## Testing Checklist
- [ ] SendGrid account created
- [ ] API key generated and saved
- [ ] Sender email verified
- [ ] `.env` file updated with credentials
- [ ] Backend server restarted
- [ ] Test project created with email recipient
- [ ] Email received in inbox
- [ ] Email links work correctly
- [ ] Multiple recipients tested

**Need help?** Check the backend console logs for detailed error messages!
