// API Configuration
// Update the BASE_URL after deploying backend to Render

const API_CONFIG = {
  // Local development
  // BASE_URL: 'http://localhost:3000',
  
  // Production (Render) - Uncomment after deployment
  BASE_URL: 'https://kavyaproman360-backend.onrender.com',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/api/auth',
    PROJECTS: '/api/projects',
    TASKS: '/api/tasks',
    USERS: '/api/users',
    EVENTS: '/api/events',
    FILES: '/api/files',
    REPORTS: '/api/reports',
    SETTINGS: '/api/settings'
  },
  
  // Helper function to get full URL
  getURL: function(endpoint) {
    return this.BASE_URL + endpoint;
  }
};

// For backward compatibility with existing code
const API_URL = API_CONFIG.BASE_URL;
