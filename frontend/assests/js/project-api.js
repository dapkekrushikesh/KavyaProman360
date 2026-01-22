// Project Management integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

// Global variables
let projects = [];
let currentProject = {};
let refreshInterval = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  setupEventListeners();
  loadProjectsFromBackend();
  hideNewProjectButtonForTeamMembers();
  
  // Auto-refresh project statistics every 10 seconds for real-time updates
  refreshInterval = setInterval(() => {
    refreshProjectStatistics();
  }, 10000);
  
  // Listen for task update notifications from other pages
  window.addEventListener('storage', (e) => {
    if (e.key === 'taskUpdateNotification' && e.newValue) {
      // Task was updated on another page or in another tab
      console.log('📢 Task update detected, refreshing project statistics...');
      refreshProjectStatistics();
    }
  });
});

// Clean up interval when page unloads
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

function hideNewProjectButtonForTeamMembers() {
  // Get current user from sessionStorage
  const currentUserData = sessionStorage.getItem('currentUser');
  if (currentUserData) {
    try {
      const user = JSON.parse(currentUserData);
      const userRole = user.role;
      
      // Hide "New Project" button for Team Members
      if (userRole === 'Team Member') {
        const newProjectBtn = document.querySelector('.btn-new[data-bs-target="#addProjectModal"]');
        if (newProjectBtn) {
          newProjectBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
}

function initializePage() {
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
  // Handle Save Project button click
  const saveProjectBtn = document.getElementById('saveProject');
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', handleAddProject);
  }

  // Handle Edit Project Save button
  const saveEditBtn = document.getElementById('saveProjectEditBtn');
  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', handleEditProject);
  }

  // Handle Add Member button
  const addMemberBtn = document.getElementById('addMemberBtn');
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', handleAddMember);
  }

  // Handle Enter key in member input
  const newMemberInput = document.getElementById('newMemberInput');
  if (newMemberInput) {
    newMemberInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddMember();
      }
    });
  }

  // Add date validation for Add Project Modal
  const projectAssignedDate = document.getElementById('projectAssignedDate');
  const projectDeadline = document.getElementById('projectDeadline');
  
  if (projectAssignedDate && projectDeadline) {
    // When assigned date changes, set minimum deadline
    projectAssignedDate.addEventListener('change', () => {
      projectDeadline.min = projectAssignedDate.value;
      
      // If deadline is already set and is before assigned date, clear it
      if (projectDeadline.value && projectDeadline.value < projectAssignedDate.value) {
        projectDeadline.value = '';
        alert('⚠️ Deadline has been cleared because it was before the assigned date. Please select a new deadline.');
      }
    });
    
    // When deadline changes, validate it's not before assigned date
    projectDeadline.addEventListener('change', () => {
      if (projectAssignedDate.value && projectDeadline.value < projectAssignedDate.value) {
        alert('❌ Deadline cannot be before the assigned date!');
        projectDeadline.value = '';
      }
    });
  }

  // Add date validation for Edit Project Modal
  const editProjectAssignedDate = document.getElementById('editProjectAssignedDate');
  const editProjectDueDate = document.getElementById('editProjectDueDate');
  
  if (editProjectAssignedDate && editProjectDueDate) {
    // When assigned date changes, set minimum due date
    editProjectAssignedDate.addEventListener('change', () => {
      editProjectDueDate.min = editProjectAssignedDate.value;
      
      // If due date is already set and is before assigned date, alert user
      if (editProjectDueDate.value && editProjectDueDate.value < editProjectAssignedDate.value) {
        alert('⚠️ Warning: Due date is before the assigned date. Please update the due date.');
        editProjectDueDate.style.borderColor = 'red';
      } else {
        editProjectDueDate.style.borderColor = '';
      }
    });
    
    // When due date changes, validate it's not before assigned date
    editProjectDueDate.addEventListener('change', () => {
      if (editProjectAssignedDate.value && editProjectDueDate.value < editProjectAssignedDate.value) {
        alert('❌ Due date cannot be before the assigned date!');
        editProjectDueDate.value = '';
      }
    });
  }

  const searchInput = document.querySelector('input[placeholder="Search projects..."]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderProjects(projects, e.target.value);
    });
  }
}

// Calculate task statistics for projects
async function calculateProjectStatistics(projectList) {
  try {
    const token = localStorage.getItem('token');
    const tasksResponse = await fetch('/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (tasksResponse.ok) {
      const allTasks = await tasksResponse.json();
      
      // Calculate task statistics for each project
      return projectList.map(project => {
        // Filter tasks for this project (handle both populated and non-populated project fields)
        const projectTasks = allTasks.filter(task => {
          const taskProjectId = typeof task.project === 'object' && task.project !== null 
            ? task.project._id 
            : task.project;
          return taskProjectId === project._id;
        });
        
        const completedTasks = projectTasks.filter(task => 
          task.status === 'completed' || task.status === 'Completed' || task.status === 'done'
        );
        
        return {
          ...project,
          taskCount: projectTasks.length,
          completionPercent: projectTasks.length > 0 
            ? Math.round((completedTasks.length / projectTasks.length) * 100)
            : 0
        };
      });
    }
    
    return projectList;
  } catch (error) {
    console.error('Error calculating project statistics:', error);
    return projectList;
  }
}

// Load projects from backend
async function loadProjectsFromBackend() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    if (response.ok) {
      projects = await response.json();
      
      // Calculate task statistics for all projects
      projects = await calculateProjectStatistics(projects);
      
      renderProjects(projects);
    } else {
      console.error('Failed to load projects');
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Refresh project statistics (call this after task changes)
async function refreshProjectStatistics() {
  try {
    // Add visual indicator that stats are updating
    const container = document.getElementById('projectsGrid');
    if (container) {
      container.classList.add('updating-stats');
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      projects = await response.json();
      projects = await calculateProjectStatistics(projects);
      
      // Re-render without disrupting user (maintain scroll position)
      const scrollPosition = window.scrollY;
      renderProjects(projects);
      window.scrollTo(0, scrollPosition);
      
      // Show brief update indicator
      showUpdateNotification();
    }
    
    // Remove updating indicator
    if (container) {
      setTimeout(() => {
        container.classList.remove('updating-stats');
      }, 500);
    }
  } catch (error) {
    console.error('Error refreshing project statistics:', error);
  }
}

// Show brief notification when stats are updated
function showUpdateNotification() {
  // Create or get notification element
  let notification = document.getElementById('statsUpdateNotification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'statsUpdateNotification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.innerHTML = `
      <span style="width: 8px; height: 8px; background-color: white; border-radius: 50%; display: inline-block;"></span>
      Statistics updated
    `;
    document.body.appendChild(notification);
  }
  
  // Show notification
  notification.style.opacity = '1';
  
  // Hide after 2 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
  }, 2000);
}

// Render projects to the UI
function renderProjects(projectList = [], searchTerm = '') {
  const container = document.getElementById('projectsGrid') || document.querySelector('.row');
  if (!container) return;

  // Filter projects if search term provided
  const filtered = searchTerm
    ? projectList.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : projectList;

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No projects found</p></div>';
    return;
  }

  filtered.forEach(project => {
    const card = createProjectCard(project);
    container.innerHTML += card;
  });

  // Attach event listeners after rendering
  attachProjectEventListeners();
}

function createProjectCard(project) {
  const status = project.status || 'Inprogress';
  const statusClass = status === 'Completed' ? 'success' : status === 'Pending' ? 'warning' : 'warning';
  const memberCount = project.members ? project.members.length : 0;
  
  // Use actual task data from the project object (calculated in loadProjectsFromBackend)
  const taskCount = project.taskCount || 0;
  const completionPercent = project.completionPercent || 0;
  
  return `
    <div class="col-md-4 mb-4">
      <div class="card project-card" style="border-radius: 15px; border: none; border-top: 4px solid #3b3b63; box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative;">
        <div class="card-body" style="padding: 20px; position: relative;">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h5 class="card-title" style="font-size: 18px; font-weight: 600; color: #2c3e50; margin: 0; cursor: pointer;" onclick="viewProject('${project._id}')">${project.title}</h5>
            <div class="dropdown" style="position: relative;">
              <button class="btn btn-sm dropdown-toggle-btn" style="background: none; border: none; padding: 5px 10px; font-size: 20px; color: #666; cursor: pointer; line-height: 1;" onclick="event.stopPropagation(); toggleDropdown('${project._id}')">⋮</button>
              <div id="dropdown-${project._id}" class="dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 150px; z-index: 1000; margin-top: 5px;">
                <a class="dropdown-item" href="javascript:void(0);" onclick="event.stopPropagation(); closeAllDropdowns(); viewProject('${project._id}');" style="padding: 10px 15px; display: block; color: #333; text-decoration: none; transition: background 0.2s; border-bottom: 1px solid #f0f0f0;">
                  <i class="fa-solid fa-eye me-2" style="width: 16px;"></i>View
                </a>
                <a class="dropdown-item" href="javascript:void(0);" onclick="event.stopPropagation(); closeAllDropdowns(); editProject('${project._id}');" style="padding: 10px 15px; display: block; color: #333; text-decoration: none; transition: background 0.2s; border-bottom: 1px solid #f0f0f0;">
                  <i class="fa-solid fa-edit me-2" style="width: 16px;"></i>Edit
                </a>
                <a class="dropdown-item" href="javascript:void(0);" onclick="event.stopPropagation(); closeAllDropdowns(); deleteProject('${project._id}');" style="padding: 10px 15px; display: block; color: #dc3545; text-decoration: none; transition: background 0.2s;">
                  <i class="fa-solid fa-trash me-2" style="width: 16px;"></i>Delete
                </a>
              </div>
            </div>
          </div>
          
          <div class="mb-3" style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; cursor: pointer;" onclick="viewProject('${project._id}')">
            <i class="fa-solid fa-user" style="font-size: 12px;"></i>
            <span>${memberCount > 0 ? memberCount + ' ' + (memberCount === 1 ? 'Member' : 'Members') : 'No members'}</span>
          </div>
          
          <div class="mb-2" style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; cursor: pointer;" onclick="viewProject('${project._id}')">
            <i class="fa-solid fa-user-tie" style="font-size: 12px;"></i>
            <span>Created by: ${project.createdBy?.name || 'Unknown'}</span>
          </div>
          
          <div class="mb-2" style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; cursor: pointer;" onclick="viewProject('${project._id}')">
            <i class="fa-solid fa-calendar" style="font-size: 12px;"></i>
            <span>Assigned: ${project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : 'N/A'}</span>
          </div>
          
          <div class="mb-3" style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; cursor: pointer;" onclick="viewProject('${project._id}')">
            <i class="fa-solid fa-calendar-check" style="font-size: 12px;"></i>
            <span>Due: ${project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : 'N/A'}</span>
          </div>
          
          <div class="mb-3" style="display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; cursor: pointer;" onclick="viewProject('${project._id}')">
            <i class="fa-solid fa-list-check" style="font-size: 12px;"></i>
            <span>${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}</span>
            <span style="margin-left: auto; display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-chart-simple" style="font-size: 12px;"></i>
              ${completionPercent}% Complete
            </span>
          </div>
          
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="badge" style="background-color: #ffc107; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: 500; font-size: 12px; cursor: pointer;" onclick="viewProject('${project._id}')">${status}</span>
            <button class="btn" style="background-color: #3b3b63; color: white; padding: 8px 20px; border-radius: 8px; border: none; font-weight: 500; font-size: 14px;" onclick="event.stopPropagation(); openFileUploadModal('${project._id}', '${project.title}')">Share Files</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachProjectEventListeners() {
  // Event listeners are attached via onclick in the HTML
}

// Handle add project form submission
async function handleAddProject(e) {
  e.preventDefault();

  // Get form values from the modal form
  const projectName = document.getElementById('projectName').value;
  const projectDesc = document.getElementById('projectDesc').value;
  const projectAssigneeEmails = document.getElementById('projectAssigneeEmails').value;
  const projectAssignedDate = document.getElementById('projectAssignedDate').value;
  const projectDeadline = document.getElementById('projectDeadline').value;

  // Validate dates: deadline must not be before assigned date
  if (projectAssignedDate && projectDeadline && projectDeadline < projectAssignedDate) {
    alert('❌ Deadline cannot be before the assigned date!');
    return;
  }

  // Check for duplicate project name (case-insensitive)
  const isDuplicate = projects.some(p => 
    p.title.toLowerCase().trim() === projectName.toLowerCase().trim()
  );

  if (isDuplicate) {
    alert('❌ A project with this name already exists. Please choose a different name.');
    return;
  }

  // Split emails by comma and trim
  const assigneeEmails = projectAssigneeEmails.split(',').map(e => e.trim()).filter(Boolean);

  const projectData = {
    title: projectName,
    description: projectDesc,
    assigneeEmails, // send emails to backend
    startDate: projectAssignedDate,
    endDate: projectDeadline,
    status: 'active'
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });

    if (response.ok) {
      const result = await response.json();
      const newProject = result.project || result;
      projects.push(newProject);
      renderProjects(projects);
      
      // Clear form
      document.getElementById('projectForm').reset();
      
      // Close modal if using Bootstrap
      const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
      if (modal) modal.hide();
      
      // Show success message with email notification status
      if (result.emailNotifications) {
        const { sent, failed, total } = result.emailNotifications;
        let message = '✅ Project added successfully!';
        
        if (total > 0) {
          message += `\n\n📧 Email Notifications:`;
          if (sent > 0) {
            message += `\n✓ ${sent} email(s) sent successfully`;
          }
          if (failed > 0) {
            message += `\n✗ ${failed} email(s) failed to send`;
          }
        }
        
        // Show warning about users not found
        if (result.warnings && result.warnings.emails && result.warnings.emails.length > 0) {
          message += `\n\n⚠️ Warning:\n${result.warnings.message}\n\nEmails not found:\n${result.warnings.emails.join('\n')}`;
        }
        
        alert(message);
      } else {
        alert('✅ Project added successfully!');
      }
    } else {
      const error = await response.json();
      alert('❌ Failed to add project: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error adding project:', error);
    alert('❌ Error adding project');
  }
}

// Handle edit project
let currentEditProjectId = null;

async function handleEditProject(e) {
  e.preventDefault();
  
  if (!currentEditProjectId) return;

  const projectName = document.getElementById('editProjectName').value;
  const projectDesc = document.getElementById('editProjectDesc').value;
  const projectStartDate = document.getElementById('editProjectAssignedDate').value;
  const projectDueDate = document.getElementById('editProjectDueDate').value;
  const projectStatus = document.getElementById('editProjectStatus').value;

  // Validate dates: due date must not be before assigned date
  if (projectStartDate && projectDueDate && projectDueDate < projectStartDate) {
    alert('❌ Due date cannot be before the assigned date!');
    return;
  }

  // Get the current project to retrieve members
  const project = projects.find(p => p._id === currentEditProjectId);
  
  // Extract member IDs properly (handle both populated and non-populated cases)
  let memberIds = [];
  if (project && project.members) {
    memberIds = project.members.map(member => {
      // If member is an object (populated), extract the _id
      if (typeof member === 'object' && member !== null && member._id) {
        return member._id;
      }
      // If member is already an ID string, use it as is
      return member;
    });
  }

  const projectData = {
    title: projectName,
    description: projectDesc,
    members: memberIds,
    startDate: projectStartDate,
    endDate: projectDueDate,
    status: projectStatus
  };

  try {
    const token = localStorage.getItem('token');
    const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
    const response = await fetch(`${API_URL}/api/projects/${currentEditProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });

    if (response.ok) {
      const updatedProject = await response.json();
      
      // Update the project in local array
      const projectIndex = projects.findIndex(p => p._id === currentEditProjectId);
      if (projectIndex !== -1) {
        projects[projectIndex] = updatedProject;
      }
      
      // Re-render projects with updated data
      renderProjects(projects);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
      if (modal) modal.hide();
      
      alert('✅ Project updated successfully!');
      currentEditProjectId = null;
    } else {
      const error = await response.json();
      console.error('Update error:', error);
      alert('❌ Failed to update project: ' + (error.message || 'Unknown error') + (error.error ? '\nDetails: ' + error.error : ''));
    }
  } catch (error) {
    console.error('Error updating project:', error);
    alert('❌ Error updating project: ' + error.message);
  }
}

// View project details
function viewProject(projectId) {
  window.location.href = `project-details.html?id=${projectId}`;
}

// Toggle dropdown menu
function toggleDropdown(projectId) {
  event.preventDefault();
  event.stopPropagation();
  
  const dropdown = document.getElementById(`dropdown-${projectId}`);
  const allDropdowns = document.querySelectorAll('.dropdown-menu');
  
  // Close all other dropdowns
  allDropdowns.forEach(d => {
    if (d.id !== `dropdown-${projectId}`) {
      d.style.display = 'none';
    }
  });
  
  // Toggle current dropdown
  if (dropdown) {
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
  }
}

// Close all dropdowns
function closeAllDropdowns() {
  const allDropdowns = document.querySelectorAll('.dropdown-menu');
  allDropdowns.forEach(d => d.style.display = 'none');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  // Check if click is outside dropdown
  if (!event.target.closest('.dropdown')) {
    closeAllDropdowns();
  }
});

// Close dropdown with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeAllDropdowns();
  }
});

// Edit project
async function editProject(projectId) {
  try {
    // Fetch the project from backend to ensure we have the latest populated data
    const token = localStorage.getItem('token');
    const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      alert('❌ Failed to load project details');
      return;
    }

    const project = await response.json();
    
    // Update the local projects array with fresh data
    const projectIndex = projects.findIndex(p => p._id === projectId);
    if (projectIndex !== -1) {
      projects[projectIndex] = project;
    }

    currentEditProjectId = projectId;

    // Populate edit form
    document.getElementById('editProjectName').value = project.title || '';
    document.getElementById('editProjectDesc').value = project.description || '';
    document.getElementById('editProjectAssignedDate').value = project.startDate ? project.startDate.split('T')[0] : '';
    document.getElementById('editProjectDueDate').value = project.endDate ? project.endDate.split('T')[0] : '';
    document.getElementById('editProjectStatus').value = project.status || 'In Progress';

    // Render existing members (use members)
    renderMembers(project.members || []);

    // Show edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    editModal.show();
  } catch (error) {
    console.error('Error loading project for edit:', error);
    alert('❌ Error loading project details');
  }
}

// Render members in the edit form
function renderMembers(members, additionalUsers = []) {
  const membersContainer = document.getElementById('editProjectMembers');
  if (!membersContainer) return;

  membersContainer.innerHTML = '';
  
  if (!members || members.length === 0) {
    membersContainer.innerHTML = '<p class="text-muted mb-0" style="font-size: 14px;">No members assigned yet. Add members using the input above.</p>';
    return;
  }
  
  members.forEach((member, index) => {
    const memberBadge = document.createElement('span');
    memberBadge.className = 'badge d-flex align-items-center gap-1 me-2 mb-2';
    memberBadge.style.fontSize = '14px';
    memberBadge.style.padding = '8px 12px';
    memberBadge.style.backgroundColor = '#3b3b63';
    memberBadge.style.color = 'white';
    
    let displayText = '';
    let displayRole = '';
    
    // Handle different member formats
    if (typeof member === 'object' && member !== null && !Array.isArray(member)) {
      // Member is a populated user object
      // Priority: name > email > "User"
      
      if (member.name && typeof member.name === 'string' && member.name.trim() !== '') {
        displayText = member.name.trim();
      } else if (member.email) {
        displayText = member.email;
      } else {
        displayText = 'User';
      }
      
      // Add role if available
      if (member.role) {
        displayRole = ` (${member.role})`;
      }
    } else if (typeof member === 'string') {
      // Member is an ID string, try to find in additional users
      const user = additionalUsers.find(u => u._id === member);
      if (user) {
        displayText = (user.name && user.name.trim() !== '') ? user.name.trim() : user.email || 'User';
        displayRole = user.role ? ` (${user.role})` : '';
      } else {
        // ID not found in additional users
        displayText = 'User (ID not populated)';
        displayRole = '';
      }
    } else {
      displayText = 'Unknown';
      displayRole = '';
    }
    
    memberBadge.innerHTML = `
      <i class="fa-solid fa-user me-1"></i>
      <span>${displayText}${displayRole}</span>
      <button type="button" class="btn-close btn-close-white" style="font-size: 10px; padding: 0; margin-left: 8px;" onclick="removeMember(${index})"></button>
    `;
    membersContainer.appendChild(memberBadge);
  });
}

// Handle adding a new member
async function handleAddMember() {
  const input = document.getElementById('newMemberInput');
  if (!input || !input.value.trim()) return;

  const memberEmail = input.value.trim();
  
  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(memberEmail)) {
    alert('⚠️ Please enter a valid email address');
    return;
  }
  
  // Get current project being edited
  const project = projects.find(p => p._id === currentEditProjectId);
  if (!project) return;

  // Initialize members array if not exists
  if (!project.members) {
    project.members = [];
  }

  try {
    // Search for user by email in the backend
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users?search=${encodeURIComponent(memberEmail)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const users = await response.json();
      
      if (users.length === 0) {
        alert('⚠️ No user found with this email address. Please ensure the user is registered in the system.');
        return;
      }

      const user = users[0];
      
      // Check if member already exists (check by user ID or email)
      const memberExists = project.members.some(m => {
        if (typeof m === 'object' && m._id) {
          return m._id === user._id;
        }
        return m === user._id;
      });

      if (memberExists) {
        alert('⚠️ This member is already added to the project!');
        return;
      }

      // Add member (store user ID)
      project.members.push(user._id);

      // Persist change immediately to backend so it reflects for other users/tabs
      try {
        const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
        const token = localStorage.getItem('token');
        const memberIds = project.members.map(m => (typeof m === 'object' && m !== null && m._id) ? m._id : m);
        const updateResp = await fetch(`${API_URL}/api/projects/${currentEditProjectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ members: memberIds })
        });

        if (updateResp.ok) {
          const updatedProject = await updateResp.json();
          // Update local projects array with fresh data
          const idx = projects.findIndex(p => p._id === currentEditProjectId);
          const projectData = updatedProject.project || updatedProject;
          if (idx !== -1) projects[idx] = projectData;

          // Re-render members (show email/name for display)
          renderMembers(projectData.members || []);
          input.value = '';
          alert(`✅ ${user.name || user.email} added to project!`);
        } else {
          // revert local change if update fails
          project.members = project.members.filter(id => id !== user._id);
          const err = await updateResp.json().catch(() => ({}));
          console.error('Failed to persist member addition:', err);
          alert('❌ Failed to add member to project. Please try again.');
        }
      } catch (err) {
        // revert local change if network error
        project.members = project.members.filter(id => id !== user._id);
        console.error('Error persisting member addition:', err);
        alert('❌ Error adding member. Please check your connection.');
      }
    } else {
      alert('❌ Failed to find user. Please try again.');
    }
  } catch (error) {
    console.error('Error adding member:', error);
    alert('❌ Error adding member. Please check your connection.');
  }
}

// Remove a member
async function removeMember(index) {
  const project = projects.find(p => p._id === currentEditProjectId);
  if (!project || !project.members) return;

  // Store the removed member info for potential undo
  const removedMember = project.members[index];

  // Remove from local state
  project.members.splice(index, 1);

  // Persist change to backend
  try {
    const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
    const token = localStorage.getItem('token');
    const memberIds = project.members.map(m => (typeof m === 'object' && m !== null && m._id) ? m._id : m);
    
    const updateResp = await fetch(`${API_URL}/api/projects/${currentEditProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ members: memberIds })
    });

    if (updateResp.ok) {
      const updatedProject = await updateResp.json();
      // Update local projects array with fresh data
      const idx = projects.findIndex(p => p._id === currentEditProjectId);
      const projectData = updatedProject.project || updatedProject;
      if (idx !== -1) projects[idx] = projectData;

      // Re-render members
      renderMembers(projectData.members || []);
      alert('✅ Member removed from project!');
    } else {
      // Revert local change if update fails
      project.members.splice(index, 0, removedMember);
      renderMembers(project.members);
      const err = await updateResp.json().catch(() => ({}));
      console.error('Failed to remove member:', err);
      alert('❌ Failed to remove member from project. Please try again.');
    }
  } catch (err) {
    // Revert local change if network error
    project.members.splice(index, 0, removedMember);
    renderMembers(project.members);
    console.error('Error removing member:', err);
    alert('❌ Error removing member. Please check your connection.');
  }
}

// Delete project
async function deleteProject(projectId) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      projects = projects.filter(p => p._id !== projectId);
      renderProjects(projects);
      alert('✅ Project deleted successfully!');
    } else {
      alert('❌ Failed to delete project');
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    alert('❌ Error deleting project');
  }
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

// File upload modal functions
let currentProjectId = null;
let uploadedFilesData = []; // Store file objects for download

function openFileUploadModal(projectId, projectTitle) {
  currentProjectId = projectId;
  uploadedFilesData = []; // Reset files
  const modal = document.getElementById('fileUploadModal');
  const titleElement = document.getElementById('uploadProjectTitle');
  
  if (modal) {
    modal.style.display = 'flex';
    if (titleElement) {
      titleElement.textContent = projectTitle || 'Project';
    }
  }
}

function closeFileUploadModal() {
  const modal = document.getElementById('fileUploadModal');
  if (modal) {
    modal.style.display = 'none';
  }
  // Clear uploaded files
  const uploadedFiles = document.getElementById('uploadedFiles');
  if (uploadedFiles) {
    uploadedFiles.innerHTML = '';
  }
  uploadedFilesData = []; // Clear file data
  currentProjectId = null;
}

// Handle file input and drag & drop
document.addEventListener('DOMContentLoaded', function() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const uploadedFiles = document.getElementById('uploadedFiles');

  if (uploadZone && fileInput) {
    // Click to browse
    uploadZone.addEventListener('click', (e) => {
      // Prevent double triggering if clicking directly on input
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
    });

    // Prevent file input from bubbling click event
    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#3b3b63';
      uploadZone.style.backgroundColor = '#f8f9fa';
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#ddd';
      uploadZone.style.backgroundColor = '#fff';
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#ddd';
      uploadZone.style.backgroundColor = '#fff';
      handleFiles(e.dataTransfer.files);
    });
  }
});

function handleFiles(files) {
  const uploadedFilesContainer = document.getElementById('uploadedFiles');
  if (!uploadedFilesContainer) return;

  Array.from(files).forEach((file, index) => {
    // Store file object
    const fileIndex = uploadedFilesData.length;
    uploadedFilesData.push(file);
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.setAttribute('data-file-index', fileIndex);
    fileItem.style.cssText = 'padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
    
    fileItem.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid fa-file" style="color: #3b3b63;"></i>
        <div>
          <div style="font-weight: 500;">${file.name}</div>
          <small style="color: #666;">${(file.size / 1024).toFixed(2)} KB</small>
        </div>
      </div>
      <div style="display: flex; gap: 5px;">
        <button class="btn btn-sm btn-success" onclick="downloadFile(${fileIndex})" title="Download">
          <i class="fa-solid fa-download"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="removeFile(${fileIndex})" title="Remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    
    uploadedFilesContainer.appendChild(fileItem);
  });
}

// Download file function
function downloadFile(fileIndex) {
  const file = uploadedFilesData[fileIndex];
  if (!file) {
    alert('❌ File not found');
    return;
  }

  // Create a temporary URL for the file
  const url = URL.createObjectURL(file);
  
  // Create a temporary anchor element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Remove file function
function removeFile(fileIndex) {
  // Find and remove the file item from DOM
  const fileItem = document.querySelector(`[data-file-index="${fileIndex}"]`);
  if (fileItem) {
    fileItem.remove();
  }
  
  // Remove from file data array
  uploadedFilesData[fileIndex] = null;
}

function shareFiles() {
  const uploadedFilesContainer = document.getElementById('uploadedFiles');
  
  if (!uploadedFilesContainer || uploadedFilesContainer.children.length === 0) {
    alert('⚠️ Please select files to share');
    return;
  }

  if (!currentProjectId) {
    alert('❌ No project selected');
    return;
  }

  // Filter out null entries
  const filesToUpload = uploadedFilesData.filter(file => file !== null);
  
  if (filesToUpload.length === 0) {
    alert('⚠️ Please select files to share');
    return;
  }

  // Get existing projectSharedFiles object from localStorage (same structure as project-details.html)
  let projectSharedFiles = JSON.parse(localStorage.getItem('projectSharedFiles') || '{}');
  
  // Initialize array for this project if it doesn't exist
  if (!projectSharedFiles[currentProjectId]) {
    projectSharedFiles[currentProjectId] = [];
  }
  
  // Convert and save each file
  let processed = 0;
  filesToUpload.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      projectSharedFiles[currentProjectId].push({
        name: file.name,
        size: file.size,
        uploadedDate: new Date().toISOString(),
        data: e.target.result
      });
      processed++;
      
      // When all files are processed, save to localStorage
      if (processed === filesToUpload.length) {
        localStorage.setItem('projectSharedFiles', JSON.stringify(projectSharedFiles));
        alert(`✅ ${filesToUpload.length} file(s) shared successfully!`);
        closeFileUploadModal();
      }
    };
    reader.readAsDataURL(file);
  });
}
