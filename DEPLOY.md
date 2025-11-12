# Quick Render Deployment Checklist

## ✅ Pre-Deployment Checklist

- [x] `.gitignore` created (sensitive files excluded)
- [x] `.env.example` created (template for others)
- [x] Health check endpoint added (`/health`)
- [x] CORS configured for production
- [x] API config file created (`frontend/assests/js/config.js`)
- [x] Deployment guide created (`RENDER_DEPLOYMENT.md`)

## 🚀 Quick Start

### 1. Push to GitHub (if not already done)

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy Backend (5 minutes)

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub repo: `dapkekrushikesh/KavyaProman360`
4. Settings:
   - Name: `kavyaproman360-backend`
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`
   - Plan: **Free**
5. Add environment variables (click "Advanced"):
   ```
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://dapkekrushikesh:Rushi12345@kavuproman.9c3k9ia.mongodb.net/?appName=KavuProman
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   UPLOAD_DIR=uploads
   BREVO_API_KEY=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
   BREVO_FROM_EMAIL=dapkekrushikesh@gmail.com
   FRONTEND_URL=https://kavyaproman360-frontend.onrender.com
   ```
6. Click "Create Web Service"
7. **Copy your backend URL** (e.g., `https://kavyaproman360-backend.onrender.com`)

### 3. Update MongoDB Atlas

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Save

### 4. Deploy Frontend (2 minutes)

1. From Render dashboard, click "New +" → "Static Site"
2. Connect same repo: `dapkekrushikesh/KavyaProman360`
3. Settings:
   - Name: `kavyaproman360-frontend`
   - Build: `echo "No build needed"`
   - Publish: `frontend`
   - Plan: **Free**
4. Click "Create Static Site"
5. **Copy your frontend URL** (e.g., `https://kavyaproman360-frontend.onrender.com`)

### 5. Update Frontend Config

Edit `frontend/assests/js/config.js`:

```javascript
const API_CONFIG = {
  // Production (use your actual backend URL)
  BASE_URL: 'https://kavyaproman360-backend.onrender.com',
  // ...
};
```

### 6. Final Push

```bash
git add frontend/assests/js/config.js
git commit -m "Update API URL for production"
git push origin main
```

Render will automatically redeploy!

## 🎉 Done!

- **Frontend:** https://kavyaproman360-frontend.onrender.com
- **Backend:** https://kavyaproman360-backend.onrender.com

## ⚠️ Important Notes

1. **Cold Starts:** Free tier spins down after 15 minutes. First request takes 30-60s.
2. **Keep Alive:** Use UptimeRobot (free) to ping backend every 5 minutes
3. **HTTPS:** Automatic on Render - all traffic is secure
4. **Auto Deploy:** Every `git push` triggers automatic deployment

## 🔍 Testing

Test your backend health:
```
https://kavyaproman360-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-11-12T...",
  "environment": "production"
}
```

## 📚 Full Documentation

See `RENDER_DEPLOYMENT.md` for detailed instructions and troubleshooting.

---

Happy deploying! 🚀
