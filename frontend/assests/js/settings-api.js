// Settings integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
  setupMobileSidebar();
  loadSettings();
  setupEventListeners();
});

function setupMobileSidebar() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
}

function setupEventListeners() {
  // Save settings
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }
}

async function loadSettings() {
  try {
    const token = localStorage.getItem('token');
    console.log('Loading settings from backend...');
    
    const response = await fetch('/api/settings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      console.warn('Unauthorized access, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    if (response.ok) {
      const settings = await response.json();
      console.log('Settings loaded:', settings);
      applySettings(settings);
    } else {
      console.log('No saved settings found, using defaults');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function applySettings(settings) {
  console.log('Applying settings to form:', settings);
  
  // Apply notification preferences
  const emailAlerts = document.getElementById('emailAlerts');
  if (emailAlerts && settings.emailAlerts !== undefined) {
    emailAlerts.checked = settings.emailAlerts;
  }

  const projectUpdates = document.getElementById('projectUpdates');
  if (projectUpdates && settings.projectUpdates !== undefined) {
    projectUpdates.checked = settings.projectUpdates;
  }

  const weeklySummary = document.getElementById('weeklySummary');
  if (weeklySummary && settings.weeklySummary !== undefined) {
    weeklySummary.checked = settings.weeklySummary;
  }

  // Apply language setting
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect && settings.language) {
    languageSelect.value = settings.language;
  }

  // Apply privacy settings
  const profileVisible = document.getElementById('profileVisible');
  if (profileVisible && settings.profileVisible !== undefined) {
    profileVisible.checked = settings.profileVisible;
  }

  const dataSharing = document.getElementById('dataSharing');
  if (dataSharing && settings.dataSharing !== undefined) {
    dataSharing.checked = settings.dataSharing;
  }

  const twoFactor = document.getElementById('twoFactor');
  if (twoFactor && settings.twoFactor !== undefined) {
    twoFactor.checked = settings.twoFactor;
  }
  
  console.log('Settings applied successfully');
}

async function saveSettings() {
  // Gather all settings from the form
  const settings = {
    // Notification Preferences
    emailAlerts: document.getElementById('emailAlerts')?.checked || false,
    projectUpdates: document.getElementById('projectUpdates')?.checked || false,
    weeklySummary: document.getElementById('weeklySummary')?.checked || false,
    
    // Appearance
    language: document.getElementById('languageSelect')?.value || 'English',
    
    // Privacy Settings
    profileVisible: document.getElementById('profileVisible')?.checked || false,
    dataSharing: document.getElementById('dataSharing')?.checked || false,
    twoFactor: document.getElementById('twoFactor')?.checked || false
  };

  console.log('Saving settings:', settings);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Settings saved successfully:', result);
      showToast();
      
      // Show detailed feedback
      const enabledFeatures = [];
      if (settings.emailAlerts) enabledFeatures.push('Email Alerts');
      if (settings.projectUpdates) enabledFeatures.push('Project Updates');
      if (settings.weeklySummary) enabledFeatures.push('Weekly Summary');
      if (settings.profileVisible) enabledFeatures.push('Profile Visible');
      if (settings.dataSharing) enabledFeatures.push('Data Sharing');
      if (settings.twoFactor) enabledFeatures.push('Two-Factor Auth');
      
      const languageText = settings.language ? `\nLanguage: ${settings.language}` : '';
      
      const message = enabledFeatures.length > 0 
        ? `✅ Settings saved successfully!${languageText}\n\nEnabled Features:\n• ${enabledFeatures.join('\n• ')}`
        : `✅ Settings saved successfully!${languageText}`;
      
      setTimeout(() => {
        alert(message);
      }, 100);
    } else {
      console.error('Failed to save settings:', response.status);
      alert('❌ Failed to save settings. Please try again.');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('❌ Error saving settings. Please check your connection.');
  }
}

function showToast() {
  const toast = document.getElementById('toastMsg');
  if (toast) {
    toast.style.display = 'block';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
}
