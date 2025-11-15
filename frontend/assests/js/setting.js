 // Theme change interactive
  document.getElementById('themeSelect').addEventListener('change', function() {
    if(this.value === 'dark'){
      document.body.style.background = '#1e1e2d';
      document.body.style.color = '#fff';
    } else {
      document.body.style.background = 'linear-gradient(to right, #f6f7fb, #f3f4f9)';
      document.body.style.color = '#000';
    }
  });

  // Show toast message on save
  document.getElementById('saveBtn').addEventListener('click', function() {
    const toast = document.getElementById('toastMsg');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  });

document.addEventListener('DOMContentLoaded', function() {
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
});