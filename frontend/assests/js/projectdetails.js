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
    projectHeader.innerHTML = `<i class="fa-solid fa-diagram-project me-2"></i>${project.name}`;
    
    // Map status to display format
    let displayStatus = project.status;
    if (project.status === 'in-progress') displayStatus = 'In Progress';
    if (project.status === 'not-started') displayStatus = 'Not Started';
    if (project.status === 'completed') displayStatus = 'Completed';
    if (project.status === 'on-hold') displayStatus = 'On Hold';
    
    statusBadge.textContent = displayStatus;
    statusBadge.className = `status-badge ${project.status.toLowerCase().replace(' ', '-')}`;
    
    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // Get team members count
    const membersCount = project.team && Array.isArray(project.team) ? project.team.length : 0;
    const membersText = membersCount === 1 ? 'Member' : 'Members';
    
    // Get created by name
    const createdByName = project.createdBy?.name || project.createdBy?.email || 'Unknown';
    
    // Update details with real data
    const detailsHTML = `
      <div class="detail-item">
        <i class="fa-solid fa-users"></i>
        <span>${membersCount} ${membersText}</span>
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
    } else {
      // Smooth update for silent refresh
      detailsDiv.style.opacity = '0.7';
      detailsDiv.innerHTML = detailsHTML;
      setTimeout(() => {
        detailsDiv.style.opacity = '1';
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
      
      // Get assignee name or email
      const assigneeName = task.assignedTo?.name || task.assignedTo?.email || task.assignedTo || 'Unassigned';
      
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
        <td>${formatDate(task.createdAt || task.assignedDate)}</td>
        <td>${formatDate(task.dueDate || task.due)}</td>
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
        
        // If assignedTo is an object with email, use that; otherwise use the value directly
        const assigneeEmail = task.assignedTo?.email || task.assignedTo || '';
        editTaskAssignedTo.value = assigneeEmail;
        
        editTaskStatus.value = task.status || 'todo';
        
        // Set dates
        const assignedDate = task.createdAt || task.assignedDate;
        if (assignedDate) {
          editTaskAssignedDate.value = new Date(assignedDate).toISOString().split('T')[0];
        }
        
        const dueDate = task.dueDate || task.due;
        if (dueDate) {
          editTaskDue.value = new Date(dueDate).toISOString().split('T')[0];
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

    const updatedData = {
      title: editTaskName.value.trim(),
      assignedTo: editTaskAssignedTo.value.trim(),
      status: editTaskStatus.value,
      dueDate: editTaskDue.value
    };

    if (!updatedData.title || !updatedData.assignedTo || !updatedData.dueDate) {
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

    const newTask = {
      title: addTaskName.value.trim(),
      description: '', // Optional
      projectId: currentProjectId,
      assignedTo: addTaskAssignedTo.value.trim(),
      status: addTaskStatus.value,
      dueDate: addTaskDue.value
    };

    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
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

  // Initial load
  loadProjectData().then(() => {
    // Start auto-refresh after initial load
    startAutoRefresh();
  });
});
