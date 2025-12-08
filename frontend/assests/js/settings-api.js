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
  // Save settings button
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  // Real-time auto-save for notification preferences
  const emailAlerts = document.getElementById('emailAlerts');
  const projectUpdates = document.getElementById('projectUpdates');
  const weeklySummary = document.getElementById('weeklySummary');

  if (emailAlerts) {
    emailAlerts.addEventListener('change', (e) => {
      autoSaveSetting('notificationPreferences', 'emailAlerts', e.target.checked);
    });
  }

  if (projectUpdates) {
    projectUpdates.addEventListener('change', (e) => {
      autoSaveSetting('notificationPreferences', 'projectUpdates', e.target.checked);
    });
  }

  if (weeklySummary) {
    weeklySummary.addEventListener('change', (e) => {
      autoSaveSetting('notificationPreferences', 'weeklySummary', e.target.checked);
    });
  }

  // Real-time auto-save for privacy settings
  const profileVisible = document.getElementById('profileVisible');
  const dataSharing = document.getElementById('dataSharing');
  const twoFactor = document.getElementById('twoFactor');

  if (profileVisible) {
    profileVisible.addEventListener('change', (e) => {
      autoSaveSetting('privacySettings', 'profileVisible', e.target.checked);
    });
  }

  if (dataSharing) {
    dataSharing.addEventListener('change', (e) => {
      autoSaveSetting('privacySettings', 'dataSharing', e.target.checked);
    });
  }

  if (twoFactor) {
    twoFactor.addEventListener('change', (e) => {
      autoSaveSetting('privacySettings', 'twoFactor', e.target.checked);
    });
  }
}

// Real-time auto-save function
async function autoSaveSetting(category, setting, value) {
  try {
    const token = localStorage.getItem('token');
    
    // Build the update object
    const updateData = {
      [category]: {
        [setting]: value
      }
    };

    console.log(`🔄 Auto-saving ${category}.${setting} = ${value}`);

    // Get the checkbox element and add saving animation
    const checkboxId = setting.replace(/([A-Z])/g, (match) => match.toLowerCase());
    const checkbox = document.getElementById(setting);
    if (checkbox) {
      checkbox.classList.add('saving');
      setTimeout(() => checkbox.classList.remove('saving'), 500);
    }

    const response = await fetch('/api/users/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Auto-saved: ${setting} = ${value}`);
      
      // Show a brief toast notification
      showBriefToast(`${formatSettingName(setting)} ${value ? 'enabled' : 'disabled'}`);
    } else {
      console.error('Failed to auto-save setting');
      alert('❌ Failed to save setting. Please try again.');
      
      // Revert the checkbox
      if (checkbox) {
        checkbox.checked = !value;
      }
    }
  } catch (error) {
    console.error('Error auto-saving setting:', error);
    
    // Revert the checkbox
    const checkbox = document.getElementById(setting);
    if (checkbox) {
      checkbox.checked = !value;
    }
    
    alert('❌ Error saving setting. Please check your connection.');
  }
}

// Format setting name for display
function formatSettingName(settingName) {
  const nameMap = {
    'emailAlerts': 'Email Alerts',
    'projectUpdates': 'Project Updates',
    'weeklySummary': 'Weekly Summary',
    'profileVisible': 'Profile Visibility',
    'dataSharing': 'Data Sharing',
    'twoFactor': 'Two-Factor Authentication'
  };
  return nameMap[settingName] || settingName;
}

// Show brief toast notification
function showBriefToast(message) {
  const toast = document.getElementById('toastMsg');
  if (toast) {
    toast.textContent = `✅ ${message}`;
    toast.style.display = 'block';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2000);
  }
}

async function loadSettings() {
  try {
    const token = localStorage.getItem('token');
    console.log('Loading settings from backend...');
    
    const response = await fetch('/api/users/settings', {
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
      const data = await response.json();
      console.log('Settings loaded:', data);
      
      // Flatten the nested structure for easier access
      const settings = {
        ...data.notificationPreferences,
        ...data.privacySettings
      };
      
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
    notificationPreferences: {
      emailAlerts: document.getElementById('emailAlerts')?.checked || false,
      projectUpdates: document.getElementById('projectUpdates')?.checked || false,
      weeklySummary: document.getElementById('weeklySummary')?.checked || false
    },
    privacySettings: {
      profileVisible: document.getElementById('profileVisible')?.checked || false,
      dataSharing: document.getElementById('dataSharing')?.checked || false,
      twoFactor: document.getElementById('twoFactor')?.checked || false
    }
  };

  console.log('Saving settings:', settings);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/settings', {
      method: 'PUT',
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
      if (settings.notificationPreferences.emailAlerts) enabledFeatures.push('Email Alerts');
      if (settings.notificationPreferences.projectUpdates) enabledFeatures.push('Project Updates');
      if (settings.notificationPreferences.weeklySummary) enabledFeatures.push('Weekly Summary');
      if (settings.privacySettings.profileVisible) enabledFeatures.push('Profile Visible');
      if (settings.privacySettings.dataSharing) enabledFeatures.push('Data Sharing');
      if (settings.privacySettings.twoFactor) enabledFeatures.push('Two-Factor Auth');
      
      const message = enabledFeatures.length > 0 
        ? `✅ Settings saved successfully!\n\nEnabled Features:\n• ${enabledFeatures.join('\n• ')}`
        : `✅ Settings saved successfully!`;
      
      setTimeout(() => {
        alert(message);
      }, 100);
    } else {
      const error = await response.json();
      console.error('Failed to save settings:', error);
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
