// Fetch and display user profile in the top bar
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'index.html';
      return;
    }

    const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
    const response = await fetch(`${API_URL}/api/auth/me`, {
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

    // Update avatar images
    const avatarElements = document.querySelectorAll('img[alt="User Avatar"]');
    if (user.avatar) {
      const avatarUrl = `${API_URL}${user.avatar}`;
      avatarElements.forEach(el => {
        el.src = avatarUrl;
      });
    } else {
      // Use default avatar if none is set
      avatarElements.forEach(el => {
        el.src = 'assests/img/profileavatar.png';
      });
    }

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
  if (role === 'Team Lead') return 'Team Lead';
  if (role === 'Project Manager') return 'Project Manager';
  if (role === 'Team Member') return 'Team Member';
  
  // Fallback - capitalize first letter
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', loadUserProfile);

// Function to show role update banner
function showRoleUpdateBanner(newRole) {
  // Remove any existing banner
  const existingBanner = document.getElementById('roleUpdateBanner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  // Create banner
  const banner = document.createElement('div');
  banner.id = 'roleUpdateBanner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    z-index: 9999;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideDown 0.3s ease-out;
  `;
  
  banner.innerHTML = `
    <i class="fa-solid fa-info-circle me-2"></i>
    Your role has been updated to <strong>${newRole}</strong>. Changes will reflect shortly.
    <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 12px; border-radius: 4px; margin-left: 15px; cursor: pointer;">
      Dismiss
    </button>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (banner && banner.parentElement) {
      banner.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => banner.remove(), 300);
    }
  }, 10000);
}

// Enhanced storage listener with banner notification
window.addEventListener('storage', (event) => {
  if (event.key === 'roleUpdateNotification') {
    try {
      const notification = JSON.parse(event.newValue);
      const token = localStorage.getItem('token');
      
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // If the current user's role was updated
        if (payload.id === notification.userId) {
          console.log('Role updated for current user, reloading profile...');
          
          // Show banner notification
          showRoleUpdateBanner(notification.newRole);
          
          // Small delay to ensure token is updated
          setTimeout(() => {
            loadUserProfile();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error processing role update notification:', error);
    }
  }
});

// Expose loadUserProfile globally so it can be called from other scripts
window.loadUserProfile = loadUserProfile;
window.showRoleUpdateBanner = showRoleUpdateBanner;
