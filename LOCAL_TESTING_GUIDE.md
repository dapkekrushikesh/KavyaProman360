# Local Testing Guide - KavyaProman360

## Prerequisites
- Node.js installed (v14 or higher)
- MongoDB connection (using your Atlas cluster)
- All dependencies installed

## Step 1: Install Dependencies (if not already done)

Open PowerShell and navigate to the backend folder:

```powershell
cd "c:\Users\Administrator\Downloads\Kavu_proman 1\backend"
npm install
```

## Step 2: Check Environment Variables

Make sure your `backend/.env` file exists with these settings:

```env
PORT=3000
MONGO_URI=mongodb+srv://dapkekrushikesh:Rushi12345@kavuproman.9c3k9ia.mongodb.net/
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Brevo Email Configuration
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=kavyainfowebtech@gmail.com
BREVO_SENDER_NAME=Kavya Proman

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

## Step 3: Start the Backend Server

In the backend directory, run:

```powershell
cd "c:\Users\Administrator\Downloads\Kavu_proman 1\backend"
npm start
```

You should see:
```
Server running on port 3000
MongoDB Connected
```

**Keep this terminal window open!** The server needs to keep running.

## Step 4: Update Frontend Config for Local Testing

Open a **new PowerShell window** and update the frontend config:

```powershell
cd "c:\Users\Administrator\Downloads\Kavu_proman 1\frontend\assests\js"
notepad config.js
```

Change the `BASE_URL` to point to localhost:

```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000'  // Change from production URL
};

console.log('✅ API Config loaded - Using:', API_CONFIG.BASE_URL);
window.API_CONFIG = API_CONFIG;

// ... rest of the file
```

## Step 5: Open Frontend in Browser

You have two options:

### Option A: Using Live Server Extension (Recommended)
1. Open VS Code
2. Navigate to `frontend/index.html`
3. Right-click → "Open with Live Server"
4. Browser opens at `http://127.0.0.1:5500/frontend/index.html`

### Option B: Direct File Open
1. Navigate to: `c:\Users\Administrator\Downloads\Kavu_proman 1\frontend`
2. Double-click `index.html`
3. Browser opens the login page

## Step 6: Test Login

### A. Create a Test Account (Signup)

1. On login page, click **"Sign Up"**
2. Fill in the form:
   - **Name**: Test User
   - **Email**: test@kavyainfoweb.com (must use this domain)
   - **Password**: Test123 (or any password)
   - **Role**: Select any role
3. Click **"Sign Up"**
4. If successful, you'll be redirected to dashboard

### B. Test Login with Existing Account

1. On login page, enter credentials:
   - **Email**: Your registered email
   - **Password**: Your password
2. Click **"Login"**
3. Should redirect to `dashboard.html`

## Step 7: What to Check

### ✅ Successful Login Checklist:
- [ ] No error messages on login page
- [ ] Redirected to dashboard.html
- [ ] Your name appears in the topbar (click profile icon)
- [ ] Token stored in browser (press F12 → Application → Local Storage → token exists)
- [ ] Profile modal shows your details

### ❌ If Login Fails:

Check browser console (F12 → Console) for errors:

**Common Error 1: "Server error" or "Network Error"**
- **Cause**: Backend not running or wrong URL
- **Fix**: Check backend terminal is running on port 3000
- **Fix**: Verify config.js has `http://localhost:3000`

**Common Error 2: "CORS Error"**
- **Cause**: CORS not configured for localhost
- **Fix**: Check backend server.js includes `http://localhost:3000` in CORS origins

**Common Error 3: "Invalid credentials"**
- **Cause**: Wrong email/password
- **Fix**: Try signing up a new account first

**Common Error 4: "Email must be @kavyainfoweb.com"**
- **Cause**: Email domain validation
- **Fix**: Use email ending with @kavyainfoweb.com

## Step 8: Verify Backend is Working

Test the backend directly using PowerShell:

### Check Health Endpoint:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-11-15T...",
  "environment": "development"
}
```

### Test Login API Directly:
```powershell
$body = @{
    email = "test@kavyainfoweb.com"
    password = "Test123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

Expected response (if credentials are correct):
```json
{
  "user": {
    "id": "...",
    "email": "test@kavyainfoweb.com",
    "name": "Test User",
    "role": "user",
    "avatar": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Step 9: Check Browser Developer Tools

Press **F12** in your browser and check:

### Console Tab:
- Should see: `✅ API Config loaded - Using: http://localhost:3000`
- No red error messages

### Network Tab:
1. Click "Network" tab
2. Try to login
3. Look for request to `http://localhost:3000/api/auth/login`
4. Click on it to see:
   - **Status**: Should be 200 (success)
   - **Response**: Should have user data and token
   - **Headers**: Should show CORS headers

### Application Tab:
1. Click "Application" tab
2. Expand "Local Storage" on left
3. Click on your site URL
4. Should see `token` key with JWT value

## Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
**Solution:**
1. Check backend terminal - is it running?
2. Look for "Server running on port 3000"
3. If not, restart: `npm start`

### Issue 2: "MongoDB connection failed"
**Solution:**
1. Check your internet connection
2. Verify MONGO_URI in .env is correct
3. Check MongoDB Atlas - is cluster running?

### Issue 3: "Token not saved"
**Solution:**
1. Check browser console for errors
2. Clear browser cache and local storage
3. Try in incognito/private mode

### Issue 4: "Redirects to production URL"
**Solution:**
1. Verify config.js has localhost URL
2. Hard refresh browser (Ctrl + Shift + R)
3. Clear browser cache

### Issue 5: "CORS policy error"
**Solution:**
1. Check backend server.js CORS configuration
2. Should include 'http://localhost:3000'
3. Restart backend after changes

## Step 10: Testing Other Features

Once login works, test:

### Profile Avatar Upload:
1. Go to Settings page
2. Upload a profile picture
3. Check if it appears in profile modal

### Forgot Password:
1. Click "Forgot Password?" on login page
2. Enter email
3. Check email for reset link (uses Brevo)

### Dashboard:
1. After login, should see dashboard
2. Check if projects load
3. Check if tasks load

## Useful Commands

### Check if port 3000 is in use:
```powershell
netstat -ano | findstr :3000
```

### Kill process on port 3000 (if needed):
```powershell
# First find PID from above command, then:
taskkill /PID <PID> /F
```

### Restart backend with auto-reload (development):
```powershell
cd backend
npm run dev  # Uses nodemon for auto-restart
```

## Success Indicators

✅ **Everything is working when:**
1. Backend shows "Server running" and "MongoDB Connected"
2. Browser console shows API config loaded
3. Login redirects to dashboard
4. Profile modal shows your name and email
5. No red errors in console
6. Token visible in Local Storage

## Next Steps

After confirming login works locally:
1. Test all other features (projects, tasks, etc.)
2. Test avatar upload
3. Test forgot password
4. Update config.js back to production URL when done
5. Commit and push changes

---

## Quick Test Script

Save this as `test-login.ps1` and run it:

```powershell
# Test Backend Health
Write-Host "Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    $health.Content
} catch {
    Write-Host "❌ Backend is not running. Start it with: npm start" -ForegroundColor Red
}

# Test Login API
Write-Host "`nTesting login API..." -ForegroundColor Yellow
$body = @{
    email = "test@kavyainfoweb.com"
    password = "Test123"
} | ConvertTo-Json

try {
    $login = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Login API works!" -ForegroundColor Green
    $login.Content
} catch {
    Write-Host "❌ Login failed. Check credentials or create account first." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
```

Run it with:
```powershell
powershell -ExecutionPolicy Bypass -File test-login.ps1
```

---

Need help? Check the error messages and follow the troubleshooting steps above!
