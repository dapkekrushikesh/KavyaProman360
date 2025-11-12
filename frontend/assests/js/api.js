// API Helper utilities for making authenticated requests to backend

const API_BASE_URL = window.location.origin;

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Check if user is logged in
function isLoggedIn() {
  return !!getToken();
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Logout user
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/index.html';
}

// Make authenticated API call
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired or invalid
      logout();
      return null;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// API methods
const API = {
  // Auth
  login: (email, password) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  signup: (name, email, password) => apiCall('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  }),

  // Projects
  getProjects: () => apiCall('/api/projects'),
  
  createProject: (project) => apiCall('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project)
  }),
  
  getProject: (id) => apiCall(`/api/projects/${id}`),
  
  updateProject: (id, project) => apiCall(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project)
  }),
  
  deleteProject: (id) => apiCall(`/api/projects/${id}`, {
    method: 'DELETE'
  }),

  // Tasks
  getTasks: () => apiCall('/api/tasks'),
  
  createTask: (task) => apiCall('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  }),
  
  getTask: (id) => apiCall(`/api/tasks/${id}`),
  
  updateTask: (id, task) => apiCall(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task)
  }),
  
  deleteTask: (id) => apiCall(`/api/tasks/${id}`, {
    method: 'DELETE'
  }),

  // Files
  getFiles: () => apiCall('/api/files'),
  
  uploadFile: async (formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.status === 401) {
      logout();
      return null;
    }
    
    return response.json();
  },

  // Reports
  getReportsSummary: () => apiCall('/api/reports/summary'),

  // Settings
  getSettings: () => apiCall('/api/settings'),
  
  saveSettings: (settings) => apiCall('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  })
};
