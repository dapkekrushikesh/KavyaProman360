document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function() {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Theme change interactive
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', function() {
      if(this.value === 'dark'){
        document.body.style.background = '#1e1e2d';
        document.body.style.color = '#fff';
      } else {
        document.body.style.background = 'linear-gradient(to right, #f6f7fb, #f3f4f9)';
        document.body.style.color = '#000';
      }
    });
  }

  // Show toast message on save
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      const toast = document.getElementById('toastMsg');
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2000);
    });
  }

  // Load current avatar on page load
  loadCurrentAvatar();

  // Avatar upload functionality
  const avatarInput = document.getElementById('avatarInput');
  const uploadBtn = document.getElementById('uploadAvatarBtn');
  const deleteBtn = document.getElementById('deleteAvatarBtn');
  const currentAvatarImg = document.getElementById('currentAvatar');
  const avatarMessage = document.getElementById('avatarMessage');

  // Enable upload button when file is selected
  if (avatarInput) {
    avatarInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          showMessage('Please select a valid image file (JPEG, JPG, PNG, or GIF)', 'danger');
          avatarInput.value = '';
          uploadBtn.disabled = true;
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showMessage('File size must be less than 5MB', 'danger');
          avatarInput.value = '';
          uploadBtn.disabled = true;
          return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
          currentAvatarImg.src = e.target.result;
        };
        reader.readAsDataURL(file);

        uploadBtn.disabled = false;
      } else {
        uploadBtn.disabled = true;
      }
    });
  }

  // Upload avatar
  if (uploadBtn) {
    uploadBtn.addEventListener('click', async function() {
      const file = avatarInput.files[0];
      if (!file) {
        showMessage('Please select a file first', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Uploading...';

        const token = localStorage.getItem('token');
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
        
        const response = await fetch(`${API_URL}/api/auth/upload-avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          showMessage('Avatar uploaded successfully!', 'success');
          avatarInput.value = '';
          uploadBtn.disabled = true;
          uploadBtn.innerHTML = '<i class="fa-solid fa-upload me-2"></i>Upload Avatar';
          
          // Update avatar across all pages by triggering profile reload
          if (window.loadUserProfile) {
            await loadUserProfile();
          }
          
          // Reload to update all avatars
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        showMessage(error.message || 'Failed to upload avatar', 'danger');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fa-solid fa-upload me-2"></i>Upload Avatar';
      }
    });
  }

  // Delete avatar
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async function() {
      if (!confirm('Are you sure you want to remove your avatar?')) {
        return;
      }

      try {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Removing...';

        const token = localStorage.getItem('token');
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
        
        const response = await fetch(`${API_URL}/api/auth/delete-avatar`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          showMessage('Avatar removed successfully!', 'success');
          currentAvatarImg.src = 'assests/img/profileavatar.png';
          
          // Reload to update all avatars
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          throw new Error(data.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Avatar delete error:', error);
        showMessage(error.message || 'Failed to remove avatar', 'danger');
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash me-2"></i>Remove Avatar';
      }
    });
  }

  function showMessage(message, type) {
    avatarMessage.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  }

  async function loadCurrentAvatar() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user.avatar) {
          currentAvatarImg.src = `${API_URL}${data.user.avatar}`;
        }
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  }

  // ===== Account Settings Functions =====
  
  // Load user profile data
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
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      
      const data = await response.json();
      const user = data.user;
      
      // Populate profile form if elements exist
      const profileName = document.getElementById('profileName');
      const profileEmail = document.getElementById('profileEmail');
      const profileRole = document.getElementById('profileRole');
      const profilePhone = document.getElementById('profilePhone');
      
      if (profileName) profileName.value = user.name || '';
      if (profileEmail) profileEmail.value = user.email || '';
      if (profileRole) profileRole.value = user.role || '';
      if (profilePhone) profilePhone.value = user.phone || '';
      
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile data', 'error');
    }
  }
  
  // Update Profile
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('profileName').value.trim();
      const phone = document.getElementById('profilePhone').value.trim();
      
      if (!name) {
        showToast('Name is required', 'error');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
        
        const response = await fetch(`${API_URL}/api/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, phone })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update profile');
        }
        
        const result = await response.json();
        showToast('Profile updated successfully!', 'success');
        
        // Update token if returned
        if (result.token) {
          localStorage.setItem('token', result.token);
        }
        
        // Update display name if exists
        if (result.user && result.user.name) {
          localStorage.setItem('userName', result.user.name);
        }
        
      } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message, 'error');
      }
    });
  }
  
  // Change Password
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Validate passwords
      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
      }
      
      if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      
      // Check password requirements
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      
      if (!hasUpperCase || !hasNumber) {
        showToast('Password must contain at least one uppercase letter and one number', 'error');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
        
        const response = await fetch(`${API_URL}/api/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to change password');
        }
        
        showToast('Password changed successfully!', 'success');
        
        // Clear form
        changePasswordForm.reset();
        
      } catch (error) {
        console.error('Error changing password:', error);
        showToast(error.message, 'error');
      }
    });
  }
  
  // Email confirmation for delete account
  const deleteEmailInput = document.getElementById('deleteConfirmEmail');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteError = document.getElementById('deleteEmailError');
  const profileEmail = document.getElementById('profileEmail');
  
  if (deleteEmailInput && confirmDeleteBtn) {
    deleteEmailInput.addEventListener('input', () => {
      const userEmail = profileEmail?.value || '';
      const enteredEmail = deleteEmailInput.value.trim();
      
      if (enteredEmail === userEmail) {
        confirmDeleteBtn.disabled = false;
        if (deleteError) deleteError.style.display = 'none';
      } else {
        confirmDeleteBtn.disabled = true;
        if (enteredEmail.length > 0 && deleteError) {
          deleteError.textContent = 'Email does not match';
          deleteError.style.display = 'block';
        } else if (deleteError) {
          deleteError.style.display = 'none';
        }
      }
    });
  }
  
  // Delete Account
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      const userEmail = profileEmail?.value || '';
      const enteredEmail = deleteEmailInput.value.trim();
      
      if (enteredEmail !== userEmail) {
        showToast('Email confirmation does not match', 'error');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
        
        const response = await fetch(`${API_URL}/api/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete account');
        }
        
        // Clear local storage
        localStorage.clear();
        
        // Show success message and redirect
        showToast('Account deleted successfully. Redirecting to login...', 'success');
        
        // Close modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
        if (deleteModal) deleteModal.hide();
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
        
      } catch (error) {
        console.error('Error deleting account:', error);
        showToast(error.message, 'error');
      }
    });
  }
  
  // Toast notification function
  function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000
    });
    bsToast.show();
    
    // Remove from DOM after hidden
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }
  
  // Load profile data on page load
  loadUserProfile();
  
  // ===== User Management Functions (Admin/Project Manager/Team Lead Only) =====
  
  let currentRoleChangeUserId = null;
  
  // Check if current user can manage roles
  async function checkRoleManagementPermission() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const allowedRoles = ['Admin', 'Project Manager', 'Team Lead'];
      
      if (allowedRoles.includes(payload.role)) {
        // Show user management section
        const userMgmtSection = document.getElementById('userManagementSection');
        if (userMgmtSection) {
          userMgmtSection.style.display = 'block';
          loadAllUsers();
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }
  
  // Load all users for role management
  async function loadAllUsers() {
    try {
      const token = localStorage.getItem('token');
      const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
      
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const users = await response.json();
      const userListTable = document.getElementById('userListTable');
      
      if (!userListTable) return;
      
      // Get current user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.id;
      const currentUserRole = payload.role;
      const isAdmin = currentUserRole === 'Admin';
      
      // Filter users based on permission:
      // - Admin can see and change all users
      // - Project Manager/Team Lead can only change Team Members
      const privilegedRoles = ['Admin', 'Project Manager', 'Team Lead'];
      
      userListTable.innerHTML = users.map(user => {
        const canChangeRole = user._id !== currentUserId && 
          (isAdmin || !privilegedRoles.includes(user.role));
        
        return `
          <tr>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email}</td>
            <td><span class="badge bg-info">${user.role || 'Team Member'}</span></td>
            <td>
              ${user._id === currentUserId ? 
                '<span class="text-muted">Current User</span>' : 
                canChangeRole ? `
                  <button class="btn btn-sm btn-primary" onclick="openRoleChangeModal('${user._id}', '${user.name}', '${user.email}', '${user.role}', '${currentUserRole}')">
                    <i class="fa-solid fa-user-tag me-1"></i>Change Role
                  </button>
                ` : `
                  <span class="text-muted" title="Only Admin can change this role">
                    <i class="fa-solid fa-lock me-1"></i>Restricted
                  </span>
                `
              }
            </td>
          </tr>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    }
  }
  
  // Open role change modal
  window.openRoleChangeModal = function(userId, userName, userEmail, currentRole, currentUserRole) {
    currentRoleChangeUserId = userId;
    
    document.getElementById('roleChangeUserName').textContent = userName;
    document.getElementById('roleChangeUserEmail').textContent = userEmail;
    document.getElementById('roleChangeCurrentRole').textContent = currentRole;
    
    // Populate role dropdown based on current user's permissions
    const newRoleSelect = document.getElementById('newRoleSelect');
    const isAdmin = currentUserRole === 'Admin';
    
    if (isAdmin) {
      // Admin can assign any role
      newRoleSelect.innerHTML = `
        <option value="">Select new role</option>
        <option value="Admin">Admin</option>
        <option value="Project Manager">Project Manager</option>
        <option value="Team Lead">Team Lead</option>
        <option value="Team Member">Team Member</option>
      `;
    } else {
      // Project Manager and Team Lead can only assign Team Member role
      newRoleSelect.innerHTML = `
        <option value="">Select new role</option>
        <option value="Team Member">Team Member</option>
      `;
    }
    
    const roleError = document.getElementById('roleChangeError');
    if (roleError) roleError.style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('changeRoleModal'));
    modal.show();
  };
  
  // Confirm role change
  const confirmRoleChangeBtn = document.getElementById('confirmRoleChangeBtn');
  if (confirmRoleChangeBtn) {
    confirmRoleChangeBtn.addEventListener('click', async () => {
      const newRole = document.getElementById('newRoleSelect').value;
      const roleError = document.getElementById('roleChangeError');
      
      if (!newRole) {
        roleError.textContent = 'Please select a new role';
        roleError.style.display = 'block';
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';
        
        const response = await fetch(`${API_URL}/api/auth/update-user-role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: currentRoleChangeUserId,
            newRole: newRole
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update role');
        }
        
        const result = await response.json();
        showToast('User role updated successfully!', 'success');
        
        // Check if the updated user is viewing the page
        // If so, update their token and trigger profile reload
        const currentUserPayload = JSON.parse(atob(token.split('.')[1]));
        if (currentUserPayload.id === currentRoleChangeUserId && result.token) {
          // Update the token for the user whose role was changed
          localStorage.setItem('token', result.token);
          
          // Notify all open tabs/windows to refresh profile
          localStorage.setItem('roleUpdateNotification', JSON.stringify({
            userId: currentRoleChangeUserId,
            newRole: newRole,
            timestamp: Date.now()
          }));
          
          // Remove the notification after a brief moment to allow other tabs to pick it up
          setTimeout(() => {
            localStorage.removeItem('roleUpdateNotification');
          }, 1000);
          
          // Refresh profile on current page
          if (typeof loadUserProfile === 'function') {
            await loadUserProfile();
          }
          
          // Show banner notification on current page
          if (typeof showRoleUpdateBanner === 'function') {
            showRoleUpdateBanner(newRole);
          }
        } else {
          // Different user was updated - just notify via storage event
          // This will be picked up by the affected user's open tabs
          localStorage.setItem('roleUpdateNotification', JSON.stringify({
            userId: currentRoleChangeUserId,
            newRole: newRole,
            timestamp: Date.now()
          }));
          
          setTimeout(() => {
            localStorage.removeItem('roleUpdateNotification');
          }, 1000);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeRoleModal'));
        if (modal) modal.hide();
        
        // Reload user list to show updated role
        loadAllUsers();
        
      } catch (error) {
        console.error('Error updating role:', error);
        roleError.textContent = error.message;
        roleError.style.display = 'block';
      }
    });
  }
  
  // Initialize role management on page load
  checkRoleManagementPermission();
});