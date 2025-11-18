# Forgot Password - 500 Error Fix

## Problem
When users click "Send Reset Link" on the forgot password page, they receive a **500 Internal Server Error** instead of getting the password reset email.

## Root Cause
The error occurs because of missing or incorrect environment variables in the backend `.env` file for the Brevo email service.

## Solution

### Step 1: Check Your `.env` File

Open `backend/.env` and make sure it has these variables configured:

```env
# Brevo Email Service Configuration
BREVO_API_KEY=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
BREVO_FROM_EMAIL=kavyainfowebtech@gmail.com
BREVO_SENDER_NAME=KavyaProman360

# Frontend URL (IMPORTANT for reset links)
FRONTEND_URL=https://kavyaproman360.onrender.com
```

### Step 2: Verify Environment Variables Names

The code uses these exact variable names:
- ✅ `BREVO_API_KEY` - Your Brevo API key
- ✅ `BREVO_FROM_EMAIL` - The verified sender email in Brevo
- ✅ `FRONTEND_URL` - Your frontend URL (for reset link)

**Common mistake:** Using `BREVO_SENDER_EMAIL` instead of `BREVO_FROM_EMAIL`

### Step 3: Verify Email is Verified in Brevo

1. Log in to [Brevo Dashboard](https://app.brevo.com/)
2. Go to **Settings** → **Senders & IP**
3. Make sure `kavyainfowebtech@gmail.com` is in the list and **verified** (green checkmark)
4. If not verified, add it and verify it

### Step 4: Test Brevo API Key

Check if your API key is valid:

```powershell
# PowerShell command to test Brevo API
$headers = @{
    "api-key" = "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"
    "Content-Type" = "application/json"
}

$body = @{
    sender = @{
        email = "kavyainfowebtech@gmail.com"
        name = "KavyaProman360"
    }
    to = @(
        @{ email = "test@kavyainfoweb.com" }
    )
    subject = "Test Email"
    htmlContent = "<html><body><h1>Test</h1></body></html>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $body
```

If this works, you'll get a response with `messageId`. If it fails, check:
- API key is correct
- Sender email is verified in Brevo
- You haven't exceeded daily limit (300 emails/day on free tier)

### Step 5: Check Backend Logs

When you start the backend server, you should see:

```
📧 Brevo API Key configured: xkeysib-6a...e68d-j71Ua
📧 Brevo From Email: kavyainfowebtech@gmail.com
```

If you see:
```
❌ BREVO_API_KEY not found in environment variables!
```

Then your .env file is not being loaded properly.

### Step 6: Restart Backend Server

After updating `.env`, **restart the backend server**:

```powershell
# Stop the running server (Ctrl+C)
# Then restart:
cd backend
npm start
```

### Step 7: Test Forgot Password Again

1. Open `http://localhost:3000/forgotpass.html` (or your deployed URL)
2. Enter a registered email: `test@kavyainfoweb.com`
3. Click "Send Reset Link"
4. Should see: ✅ "Reset link sent to your email!"
5. Check the email inbox

## Common Errors and Solutions

### Error 1: "500 Internal Server Error"
**Cause:** Missing environment variables or wrong variable names
**Solution:** 
- Check `.env` has `BREVO_FROM_EMAIL` (not `BREVO_SENDER_EMAIL`)
- Restart backend server after changes

### Error 2: "Email could not be sent"
**Cause:** Brevo API error (usually sender not verified or API key invalid)
**Solution:**
- Verify sender email in Brevo dashboard
- Check API key is correct and active
- Check you haven't exceeded 300 emails/day limit

### Error 3: "User not found" (but shows success message)
**Cause:** Security feature - doesn't reveal if email exists
**Solution:** This is normal behavior. Email will only send if user exists in database.

### Error 4: Reset link shows "Invalid or expired token"
**Cause:** Token expired (10 minutes) or FRONTEND_URL not configured
**Solution:**
- Request new reset link
- Check `FRONTEND_URL` in .env matches your actual frontend URL
- Make sure token is being passed correctly in URL

## Debugging Checklist

Run through this checklist:

- [ ] `.env` file exists in `backend/` directory
- [ ] `BREVO_API_KEY` is set correctly in `.env`
- [ ] `BREVO_FROM_EMAIL` is set (NOT `BREVO_SENDER_EMAIL`)
- [ ] `FRONTEND_URL` is set to your frontend URL
- [ ] Sender email is verified in Brevo dashboard
- [ ] Backend server restarted after `.env` changes
- [ ] Test email exists in database (`test@kavyainfoweb.com`)
- [ ] Check backend console logs for email sending confirmation

## Testing Locally vs Production

### Local Testing:
```env
FRONTEND_URL=http://localhost:3000
# or if using Live Server:
FRONTEND_URL=http://127.0.0.1:5500
```

### Production (Render):
```env
FRONTEND_URL=https://kavyaproman360.onrender.com
```

**Important:** Reset links will use `FRONTEND_URL` to construct the link, so make sure it matches where your frontend is hosted!

## Verify Reset Password Flow

Complete end-to-end test:

1. **Request Reset:**
   - Go to forgot password page
   - Enter email: `test@kavyainfoweb.com`
   - Click "Send Reset Link"
   - Should see success message

2. **Check Email:**
   - Open email inbox
   - Look for email from "KavyaProman360"
   - Subject: "🔐 Password Reset Request"

3. **Click Reset Link:**
   - Click "Reset Password" button in email
   - Should open `resetpass.html?token=...`
   - Token should be in URL

4. **Reset Password:**
   - Enter new password (6+ chars, uppercase, number)
   - Confirm password
   - Click "Reset Password"
   - Should see success message

5. **Test Login:**
   - Go to login page
   - Login with email and NEW password
   - Should successfully log in

## Backend Code Reference

The forgot password endpoint is in `backend/routes/auth.js`:

```javascript
router.post('/forgot-password', async (req, res) => {
  // 1. Validates email exists
  // 2. Generates reset token
  // 3. Saves hashed token to database
  // 4. Sends email via Brevo
  // 5. Returns success message
});
```

The email is sent via `backend/utils/mailer-brevo.js`:

```javascript
async function sendPasswordResetMail(to, userName, resetUrl, resetToken) {
  // Uses BREVO_API_KEY and BREVO_FROM_EMAIL
  // Sends professional HTML email
  // Returns success/error
}
```

## Need More Help?

If forgot password still doesn't work after following this guide:

1. **Check backend console logs** - Look for error messages
2. **Check browser console** - Press F12, look for network errors
3. **Test Brevo API directly** - Use the PowerShell command above
4. **Check Brevo dashboard** - View email sending statistics
5. **Verify user exists** - Make sure test email is in database

## Quick Fix Command

If you just need to update the .env file quickly:

```powershell
# Add or update these lines in backend/.env
Add-Content -Path "backend\.env" -Value "`nBREVO_FROM_EMAIL=kavyainfowebtech@gmail.com"
Add-Content -Path "backend\.env" -Value "FRONTEND_URL=https://kavyaproman360.onrender.com"

# Then restart server
cd backend
npm start
```

---

## Summary

✅ **Make sure your `.env` has:**
- `BREVO_API_KEY` = your Brevo API key
- `BREVO_FROM_EMAIL` = verified sender email
- `FRONTEND_URL` = your frontend URL

✅ **Restart backend server after changes**

✅ **Verify sender email is verified in Brevo**

✅ **Test with a registered email that exists in your database**

The 500 error should be fixed after these steps! 🎉
