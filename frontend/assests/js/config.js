// API Configuration
// Backend URL for Render deployment

const API_CONFIG = {
  // Production (Render) - Your actual backend URL
  BASE_URL: 'https://kavyaproman-backend.onrender.com',
  
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

// Helper function for fetch calls - automatically prepends backend URL
function apiUrl(path) {
  // If path already starts with http, return as is
  if (path.startsWith('http')) return path;
  // Otherwise prepend the BASE_URL
  return API_CONFIG.BASE_URL + path;
}

// Override fetch to automatically use backend URL for relative paths
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // If URL starts with /api/, prepend the backend URL
  if (typeof url === 'string' && url.startsWith('/api/')) {
    url = API_CONFIG.BASE_URL + url;
  }
  return originalFetch(url, options);
};

// Expose globally
window.API_CONFIG = API_CONFIG;
window.API_URL = API_URL;
window.apiUrl = apiUrl;

console.log('✅ API Config loaded. Backend URL:', API_CONFIG.BASE_URL);
