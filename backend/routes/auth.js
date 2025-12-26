const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const auth = require('../middleware/auth');
const { sendPasswordResetMail, sendOTPMail, sendSignupOTPMail } = require('../utils/mailer-brevo');

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp.ext
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    // Email validation (simple regex)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hash, role: role || 'user' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/request-signup-otp - Request OTP for signup
router.post('/request-signup-otp', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp
    });

    // Send OTP via email using signup-specific template with red heading
    await sendSignupOTPMail(email, name, otp);

    res.json({ 
      message: 'OTP sent to your email. Please check your inbox to complete registration.',
      email: email 
    });
  } catch (err) {
    console.error('Error in request-signup-otp:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-signup-otp - Verify OTP and complete signup
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { name, email, role, password, otp } = req.body;

    // Validate input
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'All fields and OTP required' });
    }

    // Find OTP in database
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      otp: otp 
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if user already exists (double check)
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password: hash, 
      role: role || 'Team Member' 
    });

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        avatar: user.avatar 
      }, 
      token,
      message: 'Registration successful! Welcome to KavyaProman360.' 
    });
  } catch (err) {
    console.error('Error in verify-signup-otp:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/request-otp - Request OTP for login
router.post('/request-otp', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp
    });

    // Send OTP via email
    await sendOTPMail(email, user.name, otp);

    res.json({ 
      message: 'OTP sent to your email. Please check your inbox.',
      email: email 
    });
  } catch (err) {
    console.error('Error in request-otp:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp - Verify OTP and complete login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    // Find OTP in database
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      otp: otp 
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is valid, find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        avatar: user.avatar 
      }, 
      token 
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: { 
      id: req.user._id, 
      email: req.user.email, 
      name: req.user.name, 
      role: req.user.role,
      avatar: req.user.avatar 
    } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save hashed token and expiry to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpass.html?token=${resetToken}`;

    // Send email
    try {
      await sendPasswordResetMail(email, user.name, resetUrl, resetToken);
      res.json({ message: 'Password reset link sent to your email' });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Clear the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
    }

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token from request
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login with your new password.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/upload-avatar - Upload user avatar
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar file if exists
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar path
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });

  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/delete-avatar - Remove user avatar
router.delete('/delete-avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete avatar file if exists
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Clear avatar field
    user.avatar = null;
    await user.save();

    res.json({ message: 'Avatar deleted successfully' });

  } catch (err) {
    console.error('Avatar delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/update-profile - Update user profile (name, phone)
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.name = name.trim();
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    await user.save();

    // Generate new token with updated info
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      },
      token
    });

  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check password requirements
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasNumber) {
      return res.status(400).json({ 
        message: 'Password must contain at least one uppercase letter and one number' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/delete-account - Delete user account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete avatar file if exists
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Delete user's projects, tasks, comments, etc.
    // This should cascade delete or you can implement manual deletion
    const Project = require('../models/Project');
    const Task = require('../models/Task');
    
    // Delete projects created by user
    await Project.deleteMany({ createdBy: userId });
    
    // Delete tasks assigned to user or created by user
    await Task.deleteMany({ $or: [{ assignedTo: userId }, { createdBy: userId }] });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });

  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/update-user-role - Update user role (Admin/Project Manager/Team Lead only)
router.put('/update-user-role', auth, async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    // Check if current user has permission
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Only Admin, Project Manager, or Team Lead can change roles
    const allowedRoles = ['Admin', 'Project Manager', 'Team Lead'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({ 
        message: 'Only Admin, Project Manager, or Team Lead can change user roles' 
      });
    }

    // Validate new role
    const validRoles = ['Admin', 'Project Manager', 'Team Lead', 'Team Member'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Find and update target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Role hierarchy check:
    // - Only Admin can assign/change Admin, Project Manager, and Team Lead roles
    // - Project Manager and Team Lead can only change Team Member roles
    const privilegedRoles = ['Admin', 'Project Manager', 'Team Lead'];
    
    if (currentUser.role !== 'Admin') {
      // Non-admin users cannot change privileged roles
      if (privilegedRoles.includes(targetUser.role)) {
        return res.status(403).json({ 
          message: 'Only Admin can change roles of Admin, Project Manager, or Team Lead' 
        });
      }
      
      // Non-admin users cannot assign privileged roles
      if (privilegedRoles.includes(newRole)) {
        return res.status(403).json({ 
          message: 'Only Admin can assign Admin, Project Manager, or Team Lead roles' 
        });
      }
    }

    // Update role
    targetUser.role = newRole;
    await targetUser.save();

    // Generate new token for the target user with updated role
    const newToken = jwt.sign(
      { id: targetUser._id, email: targetUser.email, name: targetUser.name, role: targetUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'User role updated successfully',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      token: newToken // Return new token for the updated user
    });

  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
