// API Configuration
// Update the BASE_URL with your actual Render backend URL

const API_CONFIG = {
  // Production (Render) - Update this with your actual backend URL
  BASE_URL: 'https://kavyaproman360-backend.onrender.com',
  
  // For local development, uncomment this line and comment the line above:
  // BASE_URL: 'http://localhost:3000',
  
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

// Helper function for fetch calls
function apiUrl(path) {
  return API_CONFIG.BASE_URL + path;
}

// Expose globally
window.API_CONFIG = API_CONFIG;
window.API_URL = API_URL;
window.apiUrl = apiUrl;
