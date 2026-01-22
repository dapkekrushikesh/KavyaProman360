document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ JS connected");

  const tableBody = document.querySelector("#tasksTable tbody");
  const addTaskForm = document.getElementById("addTaskForm");
  const editTaskForm = document.getElementById("editTaskForm");

  const addTaskName = document.getElementById("addTaskName");
  const addTaskAssignedTo = document.getElementById("addTaskAssignedTo");
  const addTaskStatus = document.getElementById("addTaskStatus");
  const addTaskAssignedDate = document.getElementById("addTaskAssignedDate");
  const addTaskDue = document.getElementById("addTaskDue");

  const editTaskName = document.getElementById("editTaskName");
  const editTaskAssignedTo = document.getElementById("editTaskAssignedTo");
  const editTaskStatus = document.getElementById("editTaskStatus");
  const editTaskAssignedDate = document.getElementById("editTaskAssignedDate");
  const editTaskDue = document.getElementById("editTaskDue");

  const saveTaskAddBtn = document.getElementById("saveTaskAddBtn");
  const saveTaskEditBtn = document.getElementById("saveTaskEditBtn");

  let currentProject = null;
  let currentProjectId = null;
  let tasks = [];
  let currentEditTask = null;
  let refreshInterval = null;

  const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';

  // Setup date validation for task forms
  setupTaskDateValidation();

  function setupTaskDateValidation() {
    // Add Task Modal Validation
    if (addTaskAssignedDate && addTaskDue) {
      // When assigned date changes, set minimum due date
      addTaskAssignedDate.addEventListener('change', () => {
        addTaskDue.min = addTaskAssignedDate.value;
        
        // If due date is already set and is before assigned date, clear it
        if (addTaskDue.value && addTaskDue.value < addTaskAssignedDate.value) {
          addTaskDue.value = '';
          alert('⚠️ Due date has been cleared because it was before the assigned date. Please select a new due date.');
        }
      });
      
      // When due date changes, validate it's not before assigned date
      addTaskDue.addEventListener('change', () => {
        if (addTaskAssignedDate.value && addTaskDue.value < addTaskAssignedDate.value) {
          alert('❌ Due date cannot be before the assigned date!');
          addTaskDue.value = '';
        }
      });
    }
    
    // Edit Task Modal Validation
    if (editTaskAssignedDate && editTaskDue) {
      // When assigned date changes, set minimum due date
      editTaskAssignedDate.addEventListener('change', () => {
        editTaskDue.min = editTaskAssignedDate.value;
        
        // If due date is already set and is before assigned date, alert user
        if (editTaskDue.value && editTaskDue.value < editTaskAssignedDate.value) {
          alert('⚠️ Warning: Due date is before the assigned date. Please update the due date.');
          editTaskDue.style.borderColor = 'red';
        } else {
          editTaskDue.style.borderColor = '';
        }
      });
      
      // When due date changes, validate it's not before assigned date
      editTaskDue.addEventListener('change', () => {
        if (editTaskAssignedDate.value && editTaskDue.value < editTaskAssignedDate.value) {
          alert('❌ Due date cannot be before the assigned date!');
          editTaskDue.value = '';
        }
      });
    }
  }

  // Get project ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentProjectId = urlParams.get('id');

  if (!currentProjectId) {
    alert('No project ID specified');
    window.location.href = 'project.html';
    return;
  }

  // Load project data from API
  async function loadProjectData(silentRefresh = false) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = 'index.html';
        return;
      }

      // Fetch project details
      const projectResponse = await fetch(`${API_URL}/api/projects/${currentProjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to load project');
      }

      currentProject = await projectResponse.json();

      // Fetch tasks for this project
      const tasksResponse = await fetch(`${API_URL}/api/tasks?projectId=${currentProjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to load tasks');
      }

      tasks = await tasksResponse.json();

      // Update UI
      updateProjectDetails(currentProject, tasks, silentRefresh);
      renderTasks();
      
      if (!silentRefresh) {
        // Show real-time indicator
        const indicator = document.getElementById('realTimeIndicator');
        if (indicator) {
          indicator.style.display = 'inline-block';
        }
      }

    } catch (error) {
      console.error('Error loading project data:', error);
      if (!silentRefresh) {
        alert('Error loading project data. Please try again.');
      }
    }
  }

  // Update project details section with real data
  function updateProjectDetails(project, projectTasks, silentRefresh = false) {
    const projectCard = document.querySelector('.project-card');
    const projectHeader = projectCard.querySelector('.project-header h3');
    const statusBadge = projectCard.querySelector('.status-badge');
    const detailsDiv = projectCard.querySelector('.project-details');
    
    // Calculate real statistics
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => 
      t.status === 'done' || t.status === 'completed' || t.status === 'Completed'
    ).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update header and status
    projectHeader.innerHTML = `<i class="fa-solid fa-diagram-project me-2"></i>${project.title || project.name || 'Untitled Project'}`;
    
    // Map status to display format
    let displayStatus = project.status || 'active';
    if (displayStatus === 'active') displayStatus = 'In Progress';
    if (displayStatus === 'in-progress') displayStatus = 'In Progress';
    if (displayStatus === 'not-started') displayStatus = 'Not Started';
    if (displayStatus === 'completed') displayStatus = 'Completed';
    if (displayStatus === 'on-hold') displayStatus = 'On Hold';
    
    statusBadge.textContent = displayStatus;
    statusBadge.className = `status-badge ${(project.status || 'active').toLowerCase().replace(' ', '-')}`;
    
    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // Get team members count - handle both 'team' and 'members' properties
    const teamArray = project.team || project.members || [];
    const membersCount = Array.isArray(teamArray) ? teamArray.length : 0;
    const membersText = membersCount === 1 ? 'Member' : 'Members';
    
    // Get created by name
    const createdByName = project.createdBy?.name || project.createdBy?.email || 'Unknown';
    
    // Update details with real data
    const detailsHTML = `
      <div class="detail-item" style="position: relative;">
        <i class="fa-solid fa-users"></i>
        <span id="memberCountSpan">${membersCount} ${membersText}</span>
        <button class="btn btn-sm" id="membersDropdownBtn" style="background: none; border: none; padding: 0; margin-left: 5px; cursor: pointer; color: #52528c;" title="View members">
          <i class="fa-solid fa-chevron-down" id="dropdownIcon"></i>
        </button>
        <!-- Members Dropdown List -->
        <div id="membersDropdown" style="display: none; position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; min-width: 250px; max-height: 300px; overflow-y: auto;">
          <div style="padding: 12px; border-bottom: 1px solid #eee;">
            <h6 style="margin: 0; font-weight: 600; color: #52528c;">Project Members</h6>
          </div>
          <div id="membersList" style="padding: 8px 0;">
            <!-- Members will be loaded here -->
          </div>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-user-tie"></i>
        <span>Created by: ${createdByName}</span>
      </div>
      <div class="detail-item">
        <i class="fa-regular fa-calendar-days"></i>
        <span>Start: ${formatDate(project.startDate)}</span>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-calendar-check"></i>
        <span>Due: ${formatDate(project.endDate)}</span>
      </div>
      <div class="detail-item">
        <i class="fa-regular fa-comment-dots"></i>
        <span>${totalTasks} ${totalTasks === 1 ? 'Task' : 'Tasks'}</span>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-stopwatch"></i>
        <span>${completionPercentage}% Complete (${completedTasks}/${totalTasks})</span>
      </div>
    `;
    
    if (!silentRefresh) {
      detailsDiv.innerHTML = detailsHTML;
      // Setup members dropdown after HTML is inserted
      setupMembersDropdown();
      populateMembersDropdown(teamArray);
    } else {
      // Smooth update for silent refresh
      detailsDiv.style.opacity = '0.7';
      detailsDiv.innerHTML = detailsHTML;
      setTimeout(() => {
        detailsDiv.style.opacity = '1';
        setupMembersDropdown();
        populateMembersDropdown(teamArray);
      }, 200);
    }
  }

  // Render tasks in the table
  function renderTasks() {
    tableBody.innerHTML = "";

    if (tasks.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No tasks yet. Click "New Task" to add one.</td></tr>';
      return;
    }

    tasks.forEach((task) => {
      const row = document.createElement("tr");
      
      // Map backend status to display status
      let displayStatus = task.status;
      if (task.status === 'todo') displayStatus = 'To Do';
      if (task.status === 'in-progress') displayStatus = 'In Progress';
      if (task.status === 'done') displayStatus = 'Completed';
      
      // Format dates
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      };
      
      // Get assignee name or email - backend returns 'assignee', not 'assignedTo'
      const assigneeName = task.assignee?.name || task.assignee?.email || task.assignee || 'Unassigned';
      
      row.innerHTML = `
        <td>${task.title || task.name || 'Untitled Task'}</td>
        <td>${assigneeName}</td>
        <td>
          <select class="form-select form-select-sm status-dropdown" 
                  data-task-id="${task._id}"
                  style="width: auto; min-width: 130px; font-size: 0.875rem;">
            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>${formatDate(task.startDate || task.assignedDate)}</td>
        <td>${formatDate(task.endDate || task.dueDate)}</td>
        <td>
          <button class="btn btn-sm edit-btn" style="background:#52528c;color:#fff;" data-task-id="${task._id}">
            <i class="fa-solid fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-task-id="${task._id}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      `;

      // Edit button
      row.querySelector(".edit-btn").addEventListener("click", async () => {
        currentEditTask = task;
        
        editTaskName.value = task.title || task.name || '';
        
        // If assignee is an object with email, use that; otherwise use the value directly
        const assigneeEmail = task.assignee?.email || task.assignee || '';
        editTaskAssignedTo.value = assigneeEmail;
        
        editTaskStatus.value = task.status || 'todo';
        
        // Set dates - use startDate and endDate from backend
        const startDate = task.startDate || task.assignedDate;
        if (startDate) {
          editTaskAssignedDate.value = new Date(startDate).toISOString().split('T')[0];
        }
        
        const endDate = task.endDate || task.dueDate;
        if (endDate) {
          editTaskDue.value = new Date(endDate).toISOString().split('T')[0];
        }

        const modal = new bootstrap.Modal(document.getElementById("editTaskModal"));
        modal.show();
      });

      // Status dropdown change handler
      row.querySelector(".status-dropdown").addEventListener("change", async (e) => {
        const newStatus = e.target.value;
        const taskId = e.target.dataset.taskId;
        await updateTaskStatus(taskId, newStatus);
      });

      // Delete button
      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this task?")) {
          await deleteTask(task._id);
        }
      });

      tableBody.appendChild(row);
    });
  }

  // Update task status (inline editing)
  async function updateTaskStatus(taskId, newStatus) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task status');
      }

      const result = await response.json();
      
      // Show notification about email status
      if (result.emailNotifications) {
        const sent = result.emailNotifications.sent || 0;
        if (sent > 0) {
          console.log(`✅ Task status updated. ${sent} email notification(s) sent to management.`);
        }
      }
      
      console.log(`✅ Task status updated successfully`);
      
      // Notify other pages about task update
      notifyTaskUpdate();
      
      // Reload data to get updated statistics
      await loadProjectData(true);
      
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(`Error: ${error.message}`);
      // Reload to revert changes
      await loadProjectData(true);
    }
  }

  // Delete task
  async function deleteTask(taskId) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete task');
      }

      console.log('✅ Task deleted successfully');
      
      // Notify other pages about task update
      notifyTaskUpdate();
      
      // Reload data
      await loadProjectData();
      
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(`Error: ${error.message}`);
    }
  }

  // Save Edit
  saveTaskEditBtn.addEventListener("click", async () => {
    if (!currentEditTask || !currentProject) {
      alert("Task not found");
      return;
    }

    const assignedDate = editTaskAssignedDate.value;
    const dueDate = editTaskDue.value;
    
    // Validate dates: due date must not be before assigned date
    if (assignedDate && dueDate && dueDate < assignedDate) {
      alert('❌ Due date cannot be before the assigned date!');
      return;
    }

    const updatedData = {
      title: editTaskName.value.trim(),
      assignedTo: editTaskAssignedTo.value.trim(),
      status: editTaskStatus.value,
      assignedDate: assignedDate,
      dueDate: dueDate
    };

    if (!updatedData.title || !updatedData.assignedTo) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/tasks/${currentEditTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
      }

      console.log('✅ Task updated successfully');
      
      // Notify other pages
      notifyTaskUpdate();
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("editTaskModal"));
      modal.hide();
      
      // Reload data
      await loadProjectData();
      
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Error: ${error.message}`);
    }
  });

  // Add Task
  saveTaskAddBtn.addEventListener("click", async () => {
    if (!currentProject) {
      alert("Project not found");
      return;
    }

    const title = addTaskName.value.trim();
    const assignedToEmail = addTaskAssignedTo.value.trim();
    const status = addTaskStatus.value;
    const startDate = addTaskAssignedDate.value;
    const endDate = addTaskDue.value;
    
    if (!title || !assignedToEmail || !startDate || !endDate) {
      alert("Please fill all required fields");
      return;
    }
    
    // Validate dates: due date must not be before assigned date
    if (startDate && endDate && endDate < startDate) {
      alert('❌ Due date cannot be before the assigned date!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // First, search for the user by email
      const userSearchRes = await fetch(`${API_URL}/api/users?search=${encodeURIComponent(assignedToEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!userSearchRes.ok) {
        throw new Error('Failed to search for user');
      }
      
      const users = await userSearchRes.json();
      if (!users || users.length === 0) {
        alert(`❌ User not found: "${assignedToEmail}". Please enter a valid email address of a registered user.`);
        return;
      }
      
      const assigneeId = users[0]._id;
      
      const newTask = {
        title,
        description: '', // Optional
        project: currentProjectId,
        assignee: assigneeId,
        status: status || 'todo',
        startDate,
        endDate
      };
      
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create task');
      }

      console.log('✅ Task created successfully');
      
      // Notify other pages
      notifyTaskUpdate();
      
      // Close modal and reset form
      addTaskForm.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById("addTaskModal"));
      modal.hide();
      
      // Show success message
      alert('✅ Task added successfully!');
      
      // Reload data
      await loadProjectData();
      
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Error: ${error.message}`);
    }
  });

  // Notify other pages about task updates (for real-time project statistics)
  function notifyTaskUpdate() {
    // Use localStorage event to communicate across tabs/pages
    const timestamp = Date.now();
    localStorage.setItem('taskUpdateNotification', timestamp.toString());
    // Remove it immediately to allow repeated notifications
    setTimeout(() => {
      localStorage.removeItem('taskUpdateNotification');
    }, 100);
  }

  // Refresh project details silently in the background
  async function refreshProjectDetails() {
    await loadProjectData(true);
  }

  // Auto-refresh every 10 seconds
  function startAutoRefresh() {
    refreshInterval = setInterval(refreshProjectDetails, 10000);
  }

  // Stop auto-refresh when leaving page
  window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // Listen for task updates from other pages/tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'taskUpdateNotification') {
      console.log('Task update detected from another page, refreshing...');
      refreshProjectDetails();
    }
  });

  // Setup members dropdown functionality
  function setupMembersDropdown() {
    const membersDropdownBtn = document.getElementById('membersDropdownBtn');
    const membersDropdown = document.getElementById('membersDropdown');
    const dropdownIcon = document.getElementById('dropdownIcon');
    
    if (!membersDropdownBtn || !membersDropdown) return;
    
    // Remove any existing event listeners by cloning
    const newBtn = membersDropdownBtn.cloneNode(true);
    membersDropdownBtn.parentNode.replaceChild(newBtn, membersDropdownBtn);
    
    const updatedBtn = document.getElementById('membersDropdownBtn');
    
    // Toggle dropdown on button click
    updatedBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isHidden = membersDropdown.style.display === 'none';
      membersDropdown.style.display = isHidden ? 'block' : 'none';
      
      // Rotate icon
      const icon = document.getElementById('dropdownIcon');
      if (icon) {
        icon.style.transition = 'transform 0.3s ease';
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // Populate members dropdown list
  function populateMembersDropdown(members) {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;
    
    if (!members || !Array.isArray(members) || members.length === 0) {
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

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const membersDropdown = document.getElementById('membersDropdown');
    if (membersDropdown && !e.target.closest('.detail-item')) {
      membersDropdown.style.display = 'none';
      const dropdownIcon = document.getElementById('dropdownIcon');
      if (dropdownIcon) {
        dropdownIcon.style.transform = 'rotate(0deg)';
      }
    }
  });

  // Initial load
  loadProjectData().then(() => {
    // Start auto-refresh after initial load
    startAutoRefresh();
  });
});
