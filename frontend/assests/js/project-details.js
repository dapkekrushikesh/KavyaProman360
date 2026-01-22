// project-details.js: Handles loading and displaying project details and tasks

let currentProjectId = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  if (!projectId) {
    document.querySelector('.main-content').innerHTML = '<div class="alert alert-danger">Project not found.</div>';
    return;
  }
  
  currentProjectId = projectId;
  await loadProjectDetails(projectId);
  await loadProjectTasks(projectId);
  hideNewTaskButtonForTeamMembers();
  setupMembersDropdown();
  
  // Auto-refresh project details every 10 seconds for real-time updates
  refreshInterval = setInterval(() => {
    refreshProjectDetails();
  }, 10000);
  
  // Listen for task update notifications from other pages
  window.addEventListener('storage', (e) => {
    if (e.key === 'taskUpdateNotification' && e.newValue) {
      // Task was updated on another page or in another tab
      console.log('📢 Task update detected, refreshing project details...');
      refreshProjectDetails();
    }
  });
});

// Clean up interval when page unloads
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Refresh project details without disrupting user
async function refreshProjectDetails() {
  if (!currentProjectId) return;
  
  try {
    // Reload project details and tasks silently
    await loadProjectDetails(currentProjectId, true); // Pass true to indicate silent refresh
    await loadProjectTasks(currentProjectId, true);
  } catch (error) {
    console.error('Error refreshing project details:', error);
  }
}

function hideNewTaskButtonForTeamMembers() {
  // Get current user from sessionStorage
  const currentUserData = sessionStorage.getItem('currentUser');
  if (currentUserData) {
    try {
      const user = JSON.parse(currentUserData);
      const userRole = user.role;
      
      // Hide "New Task" button for Team Members
      if (userRole === 'Team Member') {
        const newTaskBtn = document.querySelector('.btn[data-bs-target="#addTaskModal"]');
        if (newTaskBtn) {
          newTaskBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
}

// Setup members dropdown functionality
function setupMembersDropdown() {
  const membersDropdownBtn = document.getElementById('membersDropdownBtn');
  const membersDropdown = document.getElementById('membersDropdown');
  const dropdownIcon = document.getElementById('dropdownIcon');
  
  if (!membersDropdownBtn || !membersDropdown) return;
  
  // Toggle dropdown on button click
  membersDropdownBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isHidden = membersDropdown.style.display === 'none';
    membersDropdown.style.display = isHidden ? 'block' : 'none';
    
    // Rotate icon
    if (isHidden) {
      dropdownIcon.style.transform = 'rotate(180deg)';
    } else {
      dropdownIcon.style.transform = 'rotate(0deg)';
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.detail-item')) {
      membersDropdown.style.display = 'none';
      dropdownIcon.style.transform = 'rotate(0deg)';
    }
  });
}

// Populate members dropdown list
function populateMembersDropdown(members) {
  const membersList = document.getElementById('membersList');
  if (!membersList) return;
  
  if (!members || members.length === 0) {
    membersList.innerHTML = '<div style="padding: 12px; text-align: center; color: #999;">No members assigned</div>';
    return;
  }
  
  membersList.innerHTML = members.map((member, index) => {
    const memberName = member.name || member.email || 'Unknown';
    const memberEmail = member.email || 'No email';
    const memberRole = member.role || 'Member';
    
    return `
      <div style="padding: 12px 12px; border-bottom: ${index < members.length - 1 ? '1px solid #eee' : 'none'}; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5';" onmouseout="this.style.backgroundColor='transparent';">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #52528c; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">
          ${memberName.charAt(0).toUpperCase()}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${memberName}
          </div>
          <div style="font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${memberEmail}
          </div>
          <div style="font-size: 11px; color: #999;">
            ${memberRole}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadProjectDetails(projectId, silentRefresh = false) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load project');
    const project = await res.json();
    
    // Fetch tasks to calculate task count and completion (project-specific)
    const tasksRes = await fetch(`/api/projects/${projectId}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    
    // Calculate completion percentage
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update project title - keep "Project Details" in topbar header
    document.getElementById('projectTitle').textContent = 'Project Details';
    document.querySelector('.project-header h3').textContent = project.title;
    
    // Update status badge with proper styling
    const statusBadge = document.querySelector('.status-badge');
    const statusText = project.status || 'active';
    const statusMap = {
      'completed': { text: 'Completed', bg: '#28a745' },
      'done': { text: 'Completed', bg: '#28a745' },
      'active': { text: 'Active', bg: '#52528c' },
      'progress': { text: 'In Progress', bg: '#52528c' },
      'inprogress': { text: 'In Progress', bg: '#52528c' },
      'pending': { text: 'Pending', bg: '#ffc107' }
    };
    const statusInfo = statusMap[statusText.toLowerCase()] || { text: statusText, bg: '#52528c' };
    statusBadge.textContent = statusInfo.text;
    statusBadge.style.backgroundColor = statusInfo.bg;
    
    // Add subtle animation on update for visual feedback
    if (silentRefresh) {
      const detailsContainer = document.querySelector('.project-details');
      if (detailsContainer) {
        detailsContainer.classList.add('updating-stats');
        setTimeout(() => {
          detailsContainer.classList.remove('updating-stats');
        }, 500);
      }
    }
    
    // Update all detail items
    const detailItems = document.querySelectorAll('.detail-item span');
    if (detailItems.length >= 6) {
      // Members count
      const membersCount = project.members ? project.members.length : 0;
      const memberCountSpan = document.getElementById('memberCountSpan');
      if (memberCountSpan) {
        memberCountSpan.textContent = `${membersCount} Member${membersCount !== 1 ? 's' : ''}`;
      }
      detailItems[0].textContent = `${membersCount} Member${membersCount !== 1 ? 's' : ''}`;
      
      // Created by
      const createdBy = project.createdBy ? project.createdBy.name || project.createdBy.email : 'Unknown';
      detailItems[1].textContent = `Created by: ${createdBy}`;
      
      // Assigned date (start date)
      const assignedDate = project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : new Date(project.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      detailItems[2].textContent = `Assigned: ${assignedDate}`;
      
      // Due date (end date)
      const dueDate = project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'No deadline';
      detailItems[3].textContent = `Due: ${dueDate}`;
      
      // Task count
      detailItems[4].textContent = `${totalTasks} Task${totalTasks !== 1 ? 's' : ''}`;
      
      // Completion percentage
      detailItems[5].textContent = `${completionPercentage}% Complete`;
      
      // Populate members dropdown
      populateMembersDropdown(project.members || []);
    }
    
    if (!silentRefresh) {
      console.log('Project loaded:', project);
      console.log('Tasks:', totalTasks, 'Completed:', completedTasks, 'Progress:', completionPercentage + '%');
    }
    
  } catch (err) {
    console.error('Error loading project details:', err);
    if (!silentRefresh) {
      document.querySelector('.main-content').innerHTML = '<div class="alert alert-danger">Could not load project details.</div>';
    }
  }
}

async function loadProjectTasks(projectId, silentRefresh = false) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load tasks');
    const tasks = await res.json();
    renderTasks(tasks);
    // Load employee performance after tasks are loaded
    await loadEmployeePerformance(projectId, tasks);
  } catch (err) {
    document.querySelector('#tasksTable tbody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Could not load tasks.</td></tr>';
  }
}

async function loadEmployeePerformance(projectId, tasks) {
  const token = localStorage.getItem('token');
  const performanceSection = document.getElementById('employeePerformanceSection');
  
  if (!performanceSection) return;
  
  try {
    // Get project details to get all assigned members
    const projectRes = await fetch(`/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!projectRes.ok) throw new Error('Failed to load project');
    const project = await projectRes.json();
    
    // Calculate performance for each employee
    const employeePerformance = {};
    
    // Initialize performance data for all assigned members (use `members` field returned by API)
    if (project.members && Array.isArray(project.members)) {
      project.members.forEach(member => {
        const memberId = member._id || member;
        employeePerformance[memberId] = {
          name: (member && member.name) || 'Unknown',
          email: (member && member.email) || '',
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          todoTasks: 0,
          overdueTasks: 0,
          completionRate: 0
        };
      });
    }
    
    // Calculate task statistics for each employee
    tasks.forEach(task => {
      const assigneeId = task.assignee?._id || task.assignee;
      if (!assigneeId) return;
      
      if (!employeePerformance[assigneeId]) {
        employeePerformance[assigneeId] = {
          name: task.assignee?.name || 'Unknown',
          email: task.assignee?.email || '',
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          todoTasks: 0,
          overdueTasks: 0,
          completionRate: 0
        };
      }
      
      const employee = employeePerformance[assigneeId];
      employee.totalTasks++;
      
      // Count by status (case-insensitive)
      const status = (task.status || 'Pending').toString().toLowerCase();
      if (status === 'completed' || status === 'done') {
        employee.completedTasks++;
      } else if (status === 'in progress' || status === 'inprogress' || status === 'in-progress') {
        employee.inProgressTasks++;
      } else if (status === 'pending') {
        employee.pendingTasks++;
      } else if (status === 'to do' || status === 'todo') {
        employee.todoTasks++;
      }
      
      // Check if overdue (only consider non-completed tasks)
      if (task.endDate && status !== 'completed' && status !== 'done') {
        const dueDate = new Date(task.endDate);
        const today = new Date();
        if (dueDate < today) {
          employee.overdueTasks++;
        }
      }
    });
    
    // Calculate completion rates
    Object.values(employeePerformance).forEach(employee => {
      if (employee.totalTasks > 0) {
        employee.completionRate = Math.round((employee.completedTasks / employee.totalTasks) * 100);
      }
    });
    
    // Sort by completion rate (descending)
    const sortedEmployees = Object.entries(employeePerformance)
      .sort((a, b) => b[1].completionRate - a[1].completionRate);
    
    // Render performance cards
    if (sortedEmployees.length === 0) {
      performanceSection.innerHTML = `
        <div class="col-12 text-center text-muted py-4">
          <i class="fa-solid fa-users-slash me-2"></i>No employees assigned to this project yet
        </div>
      `;
      return;
    }
    
    performanceSection.innerHTML = sortedEmployees.map(([employeeId, employee]) => {
      const progressColor = employee.completionRate >= 80 ? '#28a745' : 
                            employee.completionRate >= 50 ? '#ffc107' : '#dc3545';
      
      return `
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="card shadow-sm" style="border-left: 4px solid ${progressColor}; height: 100%;">
            <div class="card-body">
              <div class="mb-3">
                <h6 class="mb-1" style="font-weight: 600; color: #333;">
                  <i class="fa-solid fa-user-circle me-2" style="color: #52528c;"></i>${employee.name}
                </h6>
                <small class="text-muted">${employee.email}</small>
              </div>
              
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span style="font-size: 0.9rem; font-weight: 500;">Overall Progress</span>
                  <span style="font-weight: 600; color: ${progressColor};">${employee.completionRate}%</span>
                </div>
                <div class="progress" style="height: 10px; border-radius: 5px;">
                  <div class="progress-bar" style="width: ${employee.completionRate}%; background-color: ${progressColor};" role="progressbar"></div>
                </div>
              </div>
              
              <div class="row g-2 text-center">
                <div class="col-6">
                  <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #52528c;">${employee.totalTasks}</div>
                    <small class="text-muted">Total Tasks</small>
                  </div>
                </div>
                <div class="col-6">
                  <div style="background: #d4edda; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #28a745;">${employee.completedTasks}</div>
                    <small class="text-muted">Completed</small>
                  </div>
                </div>
                <div class="col-6">
                  <div style="background: #fff3cd; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: #ffc107;">${employee.inProgressTasks}</div>
                    <small class="text-muted">In Progress</small>
                  </div>
                </div>
                <div class="col-6">
                  <div style="background: ${employee.overdueTasks > 0 ? '#f8d7da' : '#f8f9fa'}; padding: 10px; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: ${employee.overdueTasks > 0 ? '#dc3545' : '#6c757d'};">${employee.overdueTasks}</div>
                    <small class="text-muted">Overdue</small>
                  </div>
                </div>
              </div>
              
              ${employee.totalTasks === 0 ? `
                <div class="alert alert-info mt-3 mb-0" style="font-size: 0.85rem; padding: 8px;">
                  <i class="fa-solid fa-info-circle me-1"></i>No tasks assigned yet
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error('Error loading employee performance:', err);
    performanceSection.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="fa-solid fa-exclamation-circle me-2"></i>Could not load employee performance data
        </div>
      </div>
    `;
  }
}

// --- Task CRUD ---
document.addEventListener('DOMContentLoaded', function() {
  const saveTaskAddBtn = document.getElementById('saveTaskAddBtn');
  if (saveTaskAddBtn) {
    saveTaskAddBtn.addEventListener('click', async function() {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('id');
      const token = localStorage.getItem('token');
      const title = document.getElementById('addTaskName').value;
      const assignedTo = document.getElementById('addTaskAssignedTo').value;
      const status = document.getElementById('addTaskStatus').value;
      const startDate = document.getElementById('addTaskAssignedDate').value;
      const endDate = document.getElementById('addTaskDue').value;
      
      if (!title || !assignedTo || !startDate || !endDate) {
        alert('Please fill all fields');
        return;
      }
      
      // Find user by email or name (assume email for now)
      let assigneeId = null;
      try {
        const userRes = await fetch(`/api/users?search=${encodeURIComponent(assignedTo)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const users = await userRes.json();
          console.log('Found users:', users);
          if (users.length > 0) {
            assigneeId = users[0]._id;
            console.log('Assignee ID:', assigneeId);
          } else {
            alert(`❌ User not found: "${assignedTo}". Please enter a valid email address of a registered user.`);
            return;
          }
        } else {
          alert('❌ Error searching for user. Please try again.');
          return;
        }
      } catch (err) {
        console.error('Error finding user:', err);
        alert('❌ Error finding user. Please try again.');
        return;
      }
      
      if (!assigneeId) {
        alert('❌ Please enter a valid user email address.');
        return;
      }
      
      const taskData = {
        title,
        project: projectId,
        assignee: assigneeId,
        status,
        startDate,
        endDate
      };
      
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(taskData)
        });
        
        if (res.ok) {
          // Close modal first
          const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
          if (modal) modal.hide();
          
          // Reset form
          document.getElementById('addTaskForm').reset();
          
          // Show success message
          alert('✅ Task added successfully!');
          
          // Notify other pages about task update
          notifyTaskUpdate();
          
          // Reload tasks and project details to update progress
          await loadProjectDetails(projectId, true);
          await loadProjectTasks(projectId);
        } else {
          const error = await res.json();
          alert('❌ Failed to add task: ' + (error.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error adding task:', err);
        alert('❌ Error adding task: ' + err.message);
      }
    });
  }
});

function renderTasks(tasks) {
  const tbody = document.querySelector('#tasksTable tbody');
  if (!tasks.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No tasks found.</td></tr>';
    return;
  }
  tbody.innerHTML = tasks.map(task => {
    // Format dates properly
    const assignedDate = task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : 'N/A';
    
    const dueDate = task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : 'N/A';
    
    // Normalize status for display and badge class
    const normalizedStatus = (task.status || 'pending').toString().toLowerCase();
    let badgeClass = 'warning';
    let displayStatus = 'Pending';
    if (normalizedStatus === 'completed' || normalizedStatus === 'done') {
      badgeClass = 'success';
      displayStatus = 'Completed';
    } else if (normalizedStatus === 'in progress' || normalizedStatus === 'inprogress' || normalizedStatus === 'in-progress') {
      badgeClass = 'primary';
      displayStatus = 'In Progress';
    } else if (normalizedStatus === 'pending' || normalizedStatus === 'todo' || normalizedStatus === 'to do') {
      badgeClass = 'warning';
      displayStatus = 'Pending';
    } else {
      displayStatus = task.status || 'Pending';
    }

    return `
      <tr>
        <td>${task.title}</td>
        <td>${task.assignee ? (task.assignee.name || task.assignee.email) : 'Unassigned'}</td>
        <td><span class="badge bg-${badgeClass}">${displayStatus}</span></td>
        <td>${assignedDate}</td>
        <td>${dueDate}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editTask('${task._id}')" style="margin-right: 5px;">
            <i class="fa-solid fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteTask('${task._id}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.editTask = async function(taskId) {
  // Fetch task and populate edit modal
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      alert('Failed to load task');
      return;
    }
    
    const task = await res.json();
    document.getElementById('editTaskName').value = task.title;
    document.getElementById('editTaskAssignedTo').value = task.assignee ? (task.assignee.email || task.assignee.name) : '';
    document.getElementById('editTaskStatus').value = task.status || 'Pending';
    document.getElementById('editTaskAssignedDate').value = task.startDate ? task.startDate.split('T')[0] : '';
    document.getElementById('editTaskDue').value = task.endDate ? task.endDate.split('T')[0] : '';
    
    document.getElementById('saveTaskEditBtn').onclick = async function() {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('id');
      const title = document.getElementById('editTaskName').value;
      const assignedTo = document.getElementById('editTaskAssignedTo').value;
      const status = document.getElementById('editTaskStatus').value;
      const startDate = document.getElementById('editTaskAssignedDate').value;
      const endDate = document.getElementById('editTaskDue').value;
      
      if (!title || !assignedTo || !startDate || !endDate) {
        alert('Please fill all fields');
        return;
      }
      
      let assigneeId = null;
      try {
        const userRes = await fetch(`/api/users?search=${encodeURIComponent(assignedTo)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const users = await userRes.json();
          console.log('Found users for edit:', users);
          if (users.length > 0) {
            assigneeId = users[0]._id;
            console.log('Assignee ID for edit:', assigneeId);
          } else {
            alert(`❌ User not found: "${assignedTo}". Please enter a valid email address of a registered user.`);
            return;
          }
        } else {
          alert('❌ Error searching for user. Please try again.');
          return;
        }
      } catch (err) {
        console.error('Error finding user:', err);
        alert('❌ Error finding user. Please try again.');
        return;
      }
      
      if (!assigneeId) {
        alert('❌ Please enter a valid user email address.');
        return;
      }
      
      const taskData = { title, assignee: assigneeId, status, startDate, endDate };
      
      try {
        const updateRes = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(taskData)
        });
        
        if (updateRes.ok) {
          // Close modal first
          const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
          if (modal) modal.hide();
          
          // Show success message
          alert('✅ Task updated successfully!');
          
          // Notify other pages about task update
          notifyTaskUpdate();
          
          // Reload tasks and project details to update progress
          await loadProjectDetails(projectId, true);
          await loadProjectTasks(projectId);
        } else {
          const error = await updateRes.json();
          alert('❌ Failed to update task: ' + (error.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error updating task:', err);
        alert('❌ Error updating task: ' + err.message);
      }
    };
    
    const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    modal.show();
  } catch (err) {
    console.error('Error loading task:', err);
    alert('❌ Error loading task: ' + err.message);
  }
};

window.deleteTask = async function(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      // Show success message
      alert('✅ Task deleted successfully!');
      
      // Notify other pages about task update
      notifyTaskUpdate();
      
      // Reload tasks and project details to update progress
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('id');
      await loadProjectDetails(projectId, true);
      await loadProjectTasks(projectId);
    } else {
      const error = await res.json();
      alert('❌ Failed to delete task: ' + (error.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error deleting task:', err);
    alert('❌ Error deleting task: ' + err.message);
  }
};

// Show real-time indicator when page is active
function showRealTimeIndicator() {
  const indicator = document.getElementById('realTimeIndicator');
  if (indicator) {
    indicator.style.display = 'inline-flex';
    indicator.style.alignItems = 'center';
  }
}

// Call after page loads
setTimeout(() => {
  showRealTimeIndicator();
}, 1000);
