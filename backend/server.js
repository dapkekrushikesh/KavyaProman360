require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect DB
connectDB();

// Middlewares
// CORS configuration - allows frontend to access backend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://kavyaproman360.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove undefined values
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make upload dir express-served
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use(`/${uploadDir}`, express.static(path.join(__dirname, uploadDir)));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/files', require('./routes/files'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));

// Serve frontend static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html for client-side routes
app.get('*', (req, res) => {
  // If the request starts with /api, return 404
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
