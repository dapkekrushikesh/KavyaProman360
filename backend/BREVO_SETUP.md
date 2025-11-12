# Brevo Email Setup Guide

## ✅ Migration Complete!

Your backend has been successfully migrated from SendGrid to Brevo (Sendinblue).

## 📧 Why Brevo?

- ✅ **300 emails/day FREE** (vs 100 with SendGrid)
- ✅ **Easier setup** - No complex sender verification
- ✅ **No credit card required**
- ✅ **Professional and reliable**

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Brevo Account (1 minute)

1. Go to https://app.brevo.com/account/register
2. Enter your email and create a password
3. Verify your email address

### Step 2: Get Your API Key (30 seconds)

1. Log in to Brevo dashboard
2. Go to **Settings** → **SMTP & API** → **API Keys**
3. Click **"Generate a new API key"**
4. Give it a name (e.g., "Kavu Proman")
5. Copy the API key (starts with "xkeysib-...")

### Step 3: Configure Your Backend (30 seconds)

1. Open `backend/.env` file
2. Update these two lines:

```env
BREVO_API_KEY=xkeysib-your-actual-api-key-here
BREVO_FROM_EMAIL=your.email@example.com
```

**Important:**
- Replace `xkeysib-your-actual-api-key-here` with your real API key from Step 2
- Replace `your.email@example.com` with the email you verified in Brevo

### Step 4: Restart Your Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it:
cd backend
npm start
```

## 📝 What Was Changed?

### Files Updated:
1. ✅ `backend/utils/mailer-brevo.js` - New Brevo email utility
2. ✅ `backend/routes/projects.js` - Uses Brevo for project notifications
3. ✅ `backend/routes/events.js` - Uses Brevo for calendar notifications
4. ✅ `backend/.env` - Updated config for Brevo
5. ✅ `backend/package.json` - Added @getbrevo/brevo package

### Features Working:
- ✅ **Project Assignment Emails** - Users get notified when assigned to projects
- ✅ **Calendar Event Emails** - Team members get event notifications
- ✅ **Beautiful HTML Templates** - Professional email design
- ✅ **Graceful Error Handling** - App works even if emails fail

## 📧 Email Features

### Project Assignment Email Includes:
- 🎯 Project name
- 📋 Description
- 📅 Start date
- ⏰ Due date
- 📊 Status
- 🔗 Link to dashboard

### Calendar Event Email Includes:
- 📅 Event title
- 📋 Description
- 📅 Date
- ⏰ Time
- 📁 Related project
- 🔗 Link to calendar

## 🧪 Testing Your Setup

1. Make sure your `.env` file is configured
2. Restart your backend server
3. Create a new project from the frontend
4. Add an assignee email (use a real email you can check)
5. Check the inbox for the notification email!

## ⚠️ Troubleshooting

### Problem: Emails not sending
**Solution:** 
- Check that `BREVO_API_KEY` is correct in `.env`
- Check that `BREVO_FROM_EMAIL` matches your verified email in Brevo
- Check backend console for error messages

### Problem: "Invalid API key" error
**Solution:**
- Make sure you copied the full API key from Brevo
- API key should start with "xkeysib-"
- No extra spaces in the `.env` file

### Problem: Emails go to spam
**Solution:**
- In Brevo, complete sender authentication (SPF/DKIM)
- Go to Settings → Senders & IPs → Domains

## 📊 Free Tier Limits

- **300 emails per day**
- **9,000 emails per month**
- Perfect for small to medium projects!

## 💰 Need More Emails?

Brevo Paid Plans:
- **Lite**: $25/month - 20,000 emails/month
- **Standard**: $65/month - 40,000 emails/month
- **Premium**: Custom pricing

## 🔄 Old SendGrid Files

The old SendGrid file is still in your project:
- `backend/utils/mailer-sendgrid.js`

You can keep it as a backup or delete it. It's no longer being used.

## ✨ Next Steps

1. ✅ Create Brevo account
2. ✅ Get API key
3. ✅ Update `.env` file
4. ✅ Restart server
5. ✅ Test by creating a project!

---

**Need help?** Check out:
- Brevo Docs: https://developers.brevo.com/
- Brevo Support: https://www.brevo.com/support/

**Your email notifications are ready to go!** 🚀
