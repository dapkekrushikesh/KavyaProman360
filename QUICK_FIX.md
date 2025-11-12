# ⚡ QUICK FIX FOR RENDER DEPLOYMENT

## ✅ What I've Done:

1. ✅ Updated `backend/server.js` - Added CORS for your frontend URL (`https://kavyaproman360.onrender.com`)
2. ✅ Created `frontend/assests/js/config.js` - API configuration file
3. ✅ Updated `frontend/assests/js/script.js` - Login/signup now use backend URL
4. ✅ Added config.js to `frontend/index.html`

## 🔧 What YOU Need to Do:

### Step 1: Find Your Backend URL
1. Go to https://render.com/dashboard
2. Click on your **backend** service (kavyaproman360-backend or similar)
3. Copy the URL at the top (looks like: `https://kavyaproman360-something.onrender.com`)

### Step 2: Update config.js
Open: `frontend/assests/js/config.js`

Replace line 6 with YOUR actual backend URL:
```javascript
BASE_URL: 'https://YOUR-ACTUAL-BACKEND-URL.onrender.com',
```

### Step 3: Add config.js to ALL HTML pages

Add this line BEFORE other script tags in these files:
```html
<script src="assests/js/config.js"></script>
```

Files to update:
- ✅ frontend/index.html (DONE)
- ❌ frontend/signup.html
- ❌ frontend/dashboard.html  
- ❌ frontend/project.html
- ❌ frontend/task.html
- ❌ frontend/calender.html
- ❌ frontend/reports.html
- ❌ frontend/setting.html
- ❌ frontend/project-details.html

### Step 4: Push to GitHub
```bash
git add .
git commit -m "Fix API URLs for Render deployment"
git push origin main
```

### Step 5: Wait for Render to Redeploy
- Frontend: ~2 minutes
- Backend: ~5 minutes

### Step 6: Test
Go to: https://kavyaproman360.onrender.com
Try logging in!

## 🐛 If Still Not Working:

1. Check Render backend logs for errors
2. Check browser console (F12) for errors
3. Verify backend URL is correct in config.js
4. Make sure MongoDB Atlas allows all IPs (0.0.0.0/0)

## 📞 Backend Environment Variables

Make sure these are set in Render:
```
FRONTEND_URL=https://kavyaproman360.onrender.com
MONGO_URI=(your MongoDB connection string)
BREVO_API_KEY=(your Brevo API key)
JWT_SECRET=(any random string)
```

---

**Quick Answer:** The main issue is that your frontend needs to know where your backend is deployed. Update `config.js` with your actual Render backend URL and push!
