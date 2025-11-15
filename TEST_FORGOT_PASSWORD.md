# 🧪 Test Forgot Password Functionality

## Quick Test Checklist:

### ✅ Step 1: Test Forgot Password Page

1. Go to: `https://kavyaproman360.onrender.com/forgotpass.html`
2. Try entering invalid email: `test@gmail.com`
   - ❌ Should show error: "Email must end with @kavyainfoweb.com"
3. Try leaving email empty
   - ❌ Should show error: "Email is required."
4. Enter valid email: `admin@kavyainfoweb.com` (or any test user)
   - ✅ Should show success: "Reset link sent to your email!"
5. Check email inbox for reset link

### ✅ Step 2: Test Email

1. Open email from KavyaProman360
2. Subject: "🔐 Password Reset Request"
3. Email should have:
   - Nice HTML design
   - Warning about 10-minute expiry
   - "Reset Password" button
   - Full reset URL link

### ✅ Step 3: Test Reset Password Page

1. Click "Reset Password" button in email
2. Should open: `https://kavyaproman360.onrender.com/resetpass.html?token=XXXXX`
3. Page should show:
   - Password requirements box
   - Two password fields
   - "Reset Password" button

### ✅ Step 4: Test Password Validation

1. Try weak password: `test`
   - ❌ Should show error: "Password must be at least 6 characters."
2. Try password without uppercase: `test123`
   - ❌ Should show error: "Password must contain at least one uppercase letter."
3. Try password without number: `TestPass`
   - ❌ Should show error: "Password must contain at least one number."
4. Try mismatched passwords: `TestPass123` and `TestPass456`
   - ❌ Should show error: "Passwords do not match."
5. Enter valid password: `TestPass123` (both fields)
   - ✅ Should show success: "Password reset successful!"
   - ✅ Should redirect to login after 3 seconds

### ✅ Step 5: Test New Password

1. Go to login page
2. Try old password
   - ❌ Should fail
3. Try new password: `TestPass123`
   - ✅ Should login successfully

### ✅ Step 6: Test Token Expiry

1. Request another reset link
2. Wait 11 minutes (or modify expiry to 1 minute for testing)
3. Click the old reset link
4. Try to reset password
   - ❌ Should show error: "Invalid or expired reset token"

### ✅ Step 7: Test Invalid Token

1. Manually go to: `https://kavyaproman360.onrender.com/resetpass.html?token=invalid123`
2. Try to reset password
   - ❌ Should show error: "Invalid or expired reset token"

### ✅ Step 8: Test No Token

1. Go to: `https://kavyaproman360.onrender.com/resetpass.html` (no token parameter)
2. Should show error: "Invalid or missing reset token..."
3. Form should be hidden

## 🐛 Common Issues & Solutions:

### Issue: "Server error" when requesting reset
**Solution:**
- Check Render backend logs
- Verify BREVO_API_KEY is set
- Verify FRONTEND_URL is correct

### Issue: Email not received
**Solution:**
- Check spam folder
- Verify BREVO_FROM_EMAIL is verified in Brevo account
- Check Brevo dashboard for failed emails
- Check backend logs for email errors

### Issue: "Invalid or expired reset token"
**Solution:**
- Token expires after 10 minutes
- Request a new reset link
- Don't use the same token twice

### Issue: Can't access reset page
**Solution:**
- Make sure you deployed the new `resetpass.html` file
- Check that frontend URL is correct

## 📊 Test Users:

Use these existing users for testing:

1. **Admin User:**
   - Email: `admin@kavuproman.com`
   - (Reset password to test)

2. **Regular User:**
   - Email: `bhagyashri@kavyainfoweb.com`
   - (Reset password to test)

3. **Another User:**
   - Email: `rushikesh@kavyainfoweb.com`
   - (Reset password to test)

## 🔍 Debugging Commands:

### Check backend health:
```bash
curl https://kavyaproman-backend.onrender.com/health
```

### Test forgot password API:
```bash
curl -X POST https://kavyaproman-backend.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kavuproman.com"}'
```

### Check Render backend logs:
1. Go to https://render.com/dashboard
2. Click on backend service
3. Click "Logs" tab
4. Look for email sending confirmations or errors

## ✅ Success Criteria:

- [ ] Can access forgot password page
- [ ] Email validation works
- [ ] Email is received with reset link
- [ ] Reset password page loads with token
- [ ] Password validation works
- [ ] Password reset successful
- [ ] Can login with new password
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] Email has professional design

---

**When all checkboxes are ✅, the feature is working perfectly!**
