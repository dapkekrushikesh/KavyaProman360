# 🚀 Deploy KavyaProman360 to Render

This guide will help you deploy both frontend and backend to Render's free tier.

## 📋 Prerequisites

1. GitHub account with your code pushed
2. Render account (sign up at https://render.com)
3. MongoDB Atlas database (already have this)
4. Brevo API key (already have this)

## 🎯 Deployment Steps

### Step 1: Sign Up/Login to Render

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easier deployment)
4. Authorize Render to access your repositories

### Step 2: Deploy Backend API

#### A. Create New Web Service

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `dapkekrushikesh/KavyaProman360`
3. Configure the service:

**Basic Settings:**
- **Name:** `kavyaproman360-backend`
- **Region:** Choose closest to your users (e.g., Oregon, Frankfurt)
- **Branch:** `main`
- **Root Directory:** Leave empty (or set to `backend` if it doesn't work)
- **Runtime:** `Node`
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`

**Plan:**
- Select **Free** (includes 750 hours/month)

#### B. Set Environment Variables

Click **"Advanced"** and add these environment variables:

```bash
# Required - Add these values
NODE_ENV=production
PORT=3000

# MongoDB - Use your existing Atlas URI
MONGO_URI=mongodb+srv://dapkekrushikesh:Rushi12345@kavuproman.9c3k9ia.mongodb.net/?appName=KavuProman

# JWT - Generate new secret or use existing
JWT_SECRET=your_jwt_secret_here_use_a_long_random_string
JWT_EXPIRES_IN=7d

# File uploads
UPLOAD_DIR=uploads

# Brevo Email - Use your existing credentials
BREVO_API_KEY=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
BREVO_FROM_EMAIL=dapkekrushikesh@gmail.com

# Frontend URL - Will update this after frontend deployment
FRONTEND_URL=https://kavyaproman360-frontend.onrender.com
```

#### C. Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes first time)
3. Copy your backend URL: `https://kavyaproman360-backend.onrender.com`

### Step 3: Update MongoDB Atlas Network Access

1. Go to MongoDB Atlas → Network Access
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Or add Render's specific IPs if you prefer tighter security

### Step 4: Deploy Frontend

#### A. Create New Static Site

1. From Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same repository: `dapkekrushikesh/KavyaProman360`

**Basic Settings:**
- **Name:** `kavyaproman360-frontend`
- **Branch:** `main`
- **Root Directory:** Leave empty
- **Build Command:** `echo "No build needed"`
- **Publish Directory:** `frontend`

**Plan:**
- Select **Free** (100 GB bandwidth/month)

#### B. Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL: `https://kavyaproman360-frontend.onrender.com`

### Step 5: Update Frontend API URLs

After deployment, update all frontend JavaScript files to use your backend URL:

**Files to update:**
- `frontend/assests/js/project-api.js`
- `frontend/assests/js/dashboard.js`
- `frontend/assests/js/task.js`
- `frontend/assests/js/setting.js`
- `frontend/assests/js/script.js`
- Any other files with API calls

**Find and replace:**
```javascript
// OLD (localhost)
const API_URL = 'http://localhost:3000';

// NEW (Render backend URL)
const API_URL = 'https://kavyaproman360-backend.onrender.com';
```

**Quick way to update all files:**

Create a new file `frontend/assests/js/config.js`:
```javascript
// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://kavyaproman360-backend.onrender.com',
  ENDPOINTS: {
    AUTH: '/api/auth',
    PROJECTS: '/api/projects',
    TASKS: '/api/tasks',
    USERS: '/api/users',
    EVENTS: '/api/events'
  }
};
```

Then import this in your HTML files before other scripts:
```html
<script src="assests/js/config.js"></script>
```

### Step 6: Update Backend CORS Settings

Update `backend/server.js` to allow your frontend domain:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://kavyaproman360-frontend.onrender.com'
  ],
  credentials: true
}));
```

### Step 7: Update Environment Variables

Go back to your backend service on Render and update:

```bash
FRONTEND_URL=https://kavyaproman360-frontend.onrender.com
```

### Step 8: Commit and Push Changes

```bash
cd "c:\Users\Administrator\Downloads\Kavu_proman 1"
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

Render will automatically redeploy when you push changes!

## 🎉 Your App is Live!

- **Frontend:** https://kavyaproman360-frontend.onrender.com
- **Backend API:** https://kavyaproman360-backend.onrender.com

## ⚠️ Important Notes

### Free Tier Limitations

**Backend (Web Service):**
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold starts take 30-60 seconds
- ✅ Automatic HTTPS

**Frontend (Static Site):**
- ✅ 100 GB bandwidth/month
- ✅ Always on (no cold starts)
- ✅ CDN included
- ✅ Automatic HTTPS

### Wake Up Cold Backend

If the backend has been inactive, the first request will be slow. Solutions:

1. **UptimeRobot** (free): Ping your backend every 5 minutes
   - Sign up at https://uptimerobot.com
   - Add monitor: `https://kavyaproman360-backend.onrender.com/api/auth/health`
   - Check interval: 5 minutes

2. **Show loading state** in frontend during cold starts

## 🔧 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Check MongoDB Atlas allows Render IPs

### Frontend can't connect to backend
- Verify API_URL points to Render backend URL
- Check CORS settings in backend
- Open browser console for errors

### Database connection fails
- Verify MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- Check MONGO_URI is correct in Render environment variables
- Test connection from local with same URI

### Emails not sending
- Verify Brevo API key in Render environment variables
- Check Brevo account is active
- Review backend logs for email errors

## 📊 Monitoring Your App

1. **Render Dashboard:** Monitor deployments, logs, and metrics
2. **MongoDB Atlas:** Monitor database performance
3. **Brevo Dashboard:** Track email delivery

## 🔄 Continuous Deployment

Render automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Build your app
# 3. Deploy new version
# 4. No downtime!
```

## 💰 Cost Breakdown

**Current Setup (Free Tier):**
- Backend: $0/month (750 hours free)
- Frontend: $0/month (100 GB bandwidth)
- MongoDB Atlas: $0/month (512 MB free)
- Brevo: $0/month (300 emails/day)

**Total: $0/month** 🎉

## 🚀 Upgrade Options (if needed later)

**Render Paid Plans:**
- Starter: $7/month (no cold starts, more resources)
- Standard: $25/month (dedicated resources)

**MongoDB Atlas:**
- M10 Cluster: $0.08/hour (shared cluster)

## 📞 Support

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Brevo Docs: https://developers.brevo.com

---

Good luck with your deployment! 🚀
