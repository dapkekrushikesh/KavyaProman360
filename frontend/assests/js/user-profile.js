// Fetch and display user profile in the top bar
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'index.html';
      return;
    }

    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return;
      }
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    const user = data.user;

    // Update profile modal with user data
    const profileNameElements = document.querySelectorAll('.profile-user-name');
    const profileRoleElements = document.querySelectorAll('.profile-user-role');
    const profileEmailElements = document.querySelectorAll('.profile-user-email');

    profileNameElements.forEach(el => {
      el.textContent = user.name || user.email || 'User';
    });

    profileRoleElements.forEach(el => {
      el.textContent = formatRole(user.role);
    });

    profileEmailElements.forEach(el => {
      el.textContent = user.email;
    });

    // Store user data in sessionStorage for quick access
    sessionStorage.setItem('currentUser', JSON.stringify(user));

  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Format role for display
function formatRole(role) {
  if (!role) return 'User';
  
  // Convert role to proper case
  if (role === 'Admin') return 'Admin';
  if (role === 'Project Manager') return 'Project Manager';
  if (role === 'Team Member') return 'Team Member';
  
  // Fallback - capitalize first letter
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', loadUserProfile);
