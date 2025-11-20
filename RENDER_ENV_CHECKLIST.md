# Render Backend Environment Variables Checklist

## Required Environment Variables for Production

Add these to your **Backend Service** on Render (https://dashboard.render.com/):

### 1. Database
```
MONGO_URI=mongodb+srv://dapkekrushikesh:Rushi12345@kavuproman.9c3k9ia.mongodb.net/
```

### 2. Authentication
```
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

### 3. Brevo Email Service
```
BREVO_API_KEY=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
BREVO_FROM_EMAIL=dapkekrushikesh@gmail.com
```

### 4. Frontend URL (CRITICAL for password reset!)
```
FRONTEND_URL=https://kavyaproman360.onrender.com
```

### 5. Server Port
```
PORT=10000
```

---

## How to Add on Render:

1. Go to: https://dashboard.render.com/
2. Click on your **Backend Service** (kavyaproman-backend)
3. Click **"Environment"** in the left sidebar
4. For each variable:
   - Click **"Add Environment Variable"**
   - Enter **Key** and **Value**
   - Click **"Save Changes"**
5. Backend will automatically redeploy

---

## Verification:

After adding all variables and redeployment completes:

✅ Check backend logs for: `📧 Brevo From Email: dapkekrushikesh@gmail.com`
✅ Test forgot password: https://kavyaproman360.onrender.com/forgotpass.html
✅ Should see green success message
✅ Email should arrive from: Kavyainfoweb <dapkekrushikesh@gmail.com>

---

## Current Status:

- ✅ BREVO_API_KEY - Already added
- ✅ BREVO_FROM_EMAIL - Already added  
- ❌ **FRONTEND_URL - MISSING! ADD THIS NOW!**
- ❓ MONGO_URI - Check if added
- ❓ JWT_SECRET - Check if added
- ❓ PORT - Check if added

---

## Why FRONTEND_URL is Critical:

Without `FRONTEND_URL`, the password reset email will have an incorrect reset link like:
```
undefined/resetpass.html?token=abc123
```

With `FRONTEND_URL` set correctly, the reset link will be:
```
https://kavyaproman360.onrender.com/resetpass.html?token=abc123
```

The email will still send, but the reset link won't work if `FRONTEND_URL` is missing!
