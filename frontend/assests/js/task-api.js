// Task Management integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

// Load saved tasks from backend
let tasks = [];

document.addEventListener("DOMContentLoaded", function () {
  initializeSidebar();
  loadTasksFromBackend();
  setupEventListeners();
  hideNewTaskButtonForTeamMembers();
});

function hideNewTaskButtonForTeamMembers() {
  // Get current user from sessionStorage
  const currentUserData = sessionStorage.getItem('currentUser');
  if (currentUserData) {
    try {
      const user = JSON.parse(currentUserData);
      const userRole = user.role;
      
      // Hide "New Task" button for Team Members
      if (userRole === 'Team Member') {
        const newTaskBtn = document.querySelector('.btn-new[data-bs-target="#addTaskModal"]');
        if (newTaskBtn) {
          newTaskBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
}

function initializeSidebar() {
  const sidebarLinks = document.querySelectorAll(".sidebar a");
  const currentPath = window.location.pathname;

  sidebarLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href && (currentPath === href || currentPath.endsWith(href.split("/").pop()))) {
      link.classList.add("active");
    }
  });

  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  const toggleBtn = document.getElementById("menuToggle");

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
}

function setupEventListeners() {
  const addTaskForm = document.getElementById("addTaskForm");
  if (addTaskForm) {
    addTaskForm.addEventListener("submit", handleAddTask);
  }

  const editTaskForm = document.getElementById("editTaskForm");
  if (editTaskForm) {
    editTaskForm.addEventListener("submit", handleEditTask);
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderTasks(tasks, e.target.value);
    });
  }

  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      renderTasks(tasks);
    });
  }

  // Add date validation for new task modal
  const taskAssignedDate = document.getElementById("taskAssignedDate");
  const taskDueDate = document.getElementById("taskDueDate");
  if (taskAssignedDate && taskDueDate) {
    taskAssignedDate.addEventListener("change", () => {
      // Set minimum due date to assigned date
      if (taskAssignedDate.value) {
        taskDueDate.min = taskAssignedDate.value;
        
        // If due date is before assigned date, clear it
        if (taskDueDate.value && taskDueDate.value < taskAssignedDate.value) {
          taskDueDate.value = '';
          alert('⚠️ Due date has been cleared because it was before the assigned date. Please select a new due date.');
        }
      }
    });
  }

  // Add date validation for edit task modal
  const editTaskAssignedDate = document.getElementById("editTaskAssignedDate");
  const editTaskDueDate = document.getElementById("editTaskDueDate");
  if (editTaskAssignedDate && editTaskDueDate) {
    editTaskAssignedDate.addEventListener("change", () => {
      // Set minimum due date to assigned date
      if (editTaskAssignedDate.value) {
        editTaskDueDate.min = editTaskAssignedDate.value;
        
        // If due date is before assigned date, clear it
        if (editTaskDueDate.value && editTaskDueDate.value < editTaskAssignedDate.value) {
          editTaskDueDate.value = '';
          alert('⚠️ Due date has been cleared because it was before the assigned date. Please select a new due date.');
        }
      }
    });
  }
}

// Load tasks from backend
async function loadTasksFromBackend() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/tasks', {
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
      tasks = await response.json();
      renderTasks(tasks);
      updateTaskStats();
    } else {
      console.error('Failed to load tasks');
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

// Render tasks to the UI (Table View)
function renderTasks(taskList = [], searchTerm = '') {
  const taskTable = document.getElementById("taskTable");
  const statusFilter = document.getElementById("statusFilter");

  if (!taskTable) return;

  // Filter tasks based on search term
  let filtered = searchTerm
    ? taskList.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.assignee?.name || t.assignee?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : taskList;

  // Filter by status if filter is set
  if (statusFilter && statusFilter.value !== 'all') {
    const filterValue = statusFilter.value;
    filtered = filtered.filter(t => {
      const status = (t.status || '').toLowerCase().trim();
      if (filterValue === 'pending') return status === 'pending' || status === 'todo';
      if (filterValue === 'progress') return status === 'in-progress' || status === 'progress' || status === 'in progress';
      if (filterValue === 'completed') return status === 'completed' || status === 'done';
      return true;
    });
  }

  // Clear table
  taskTable.innerHTML = '';

  if (filtered.length === 0) {
    taskTable.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No tasks found.</td></tr>';
    return;
  }

  // Render each task as a table row
  filtered.forEach(task => {
    const row = createTaskRow(task);
    taskTable.innerHTML += row;
  });

  // Update statistics
  updateTaskStats();
}

function createTaskRow(task) {
  const priorityColors = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  };
  const priorityColor = priorityColors[(task.priority || '').toLowerCase()] || 'secondary';
  
  // Status badge colors
  const statusColors = {
    'pending': 'warning',
    'todo': 'warning',
    'in-progress': 'primary',
    'progress': 'primary',
    'in progress': 'primary',
    'completed': 'success',
    'done': 'success'
  };
  const statusValue = (task.status || 'todo').toLowerCase().trim();
  const statusColor = statusColors[statusValue] || 'secondary';
  
  // Better status display
  let statusDisplay = 'Pending';
  if (statusValue === 'in-progress' || statusValue === 'progress' || statusValue === 'in progress') {
    statusDisplay = 'In Progress';
  } else if (statusValue === 'done' || statusValue === 'completed') {
    statusDisplay = 'Completed';
  } else if (statusValue === 'todo' || statusValue === 'pending') {
    statusDisplay = 'Pending';
  } else {
    statusDisplay = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
  }
  
  const assigneeName = task.assignee?.name || task.assignee?.email || 'Unassigned';
  const projectName = task.project?.title || 'No Project';
  const assignedDate = task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) : (task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) : 'N/A');
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) : 'N/A';

  // Get latest comment (placeholder for now - will be enhanced with real comments)
  const latestComment = task.latestComment || 'No comments yet';
  const commentPreview = latestComment.length > 50 ? latestComment.substring(0, 50) + '...' : latestComment;

  // Create status dropdown with current status selected
  const statusOptions = `
    <option value="todo" ${statusValue === 'todo' || statusValue === 'pending' ? 'selected' : ''}>Pending</option>
    <option value="in-progress" ${statusValue === 'in-progress' || statusValue === 'progress' || statusValue === 'in progress' ? 'selected' : ''}>In Progress</option>
    <option value="done" ${statusValue === 'done' || statusValue === 'completed' ? 'selected' : ''}>Completed</option>
  `;

  return `
    <tr>
      <td>
        <strong>${task.title}</strong>
        <br>
        <small class="text-muted"><i class="fa-solid fa-folder"></i> ${projectName}</small>
        <br>
        <small class="text-muted" style="font-style: italic;">
          <i class="fa-solid fa-comment-dots"></i> Latest Comment: ${commentPreview}
        </small>
      </td>
      <td>${assigneeName}</td>
      <td>${assignedDate}</td>
      <td>${dueDate}</td>
      <td><span class="badge bg-${priorityColor}">${(task.priority || 'Medium').toUpperCase()}</span></td>
      <td>
        <select class="form-select form-select-sm status-dropdown" 
                data-task-id="${task._id}" 
                onchange="updateTaskStatus('${task._id}', this.value)"
                style="width: auto; min-width: 130px; font-size: 0.875rem;">
          ${statusOptions}
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-secondary" onclick="openCommentModal('${task._id}')">
          <i class="fa-solid fa-comment"></i>
        </button>
      </td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="openEditTaskModal('${task._id}')" title="Edit Task">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task._id}')" title="Delete Task">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

// Handle add task form submission
async function handleAddTask(e) {
  e.preventDefault();

  // Get form values
  const taskTitle = document.getElementById('taskTitle').value;
  const taskDescription = document.getElementById('taskDescription').value;
  const taskAssigneeEmail = document.getElementById('taskAssignee').value.trim();
  const taskAssignedDate = document.getElementById('taskAssignedDate').value;
  const taskDueDate = document.getElementById('taskDueDate').value;
  const taskPriority = document.getElementById('taskPriority').value;
  const taskStatus = document.getElementById('taskStatus').value;

  // Validate dates: Due date must not be before assigned date
  if (taskAssignedDate && taskDueDate) {
    const assignedDate = new Date(taskAssignedDate);
    const dueDate = new Date(taskDueDate);
    
    if (dueDate < assignedDate) {
      alert('❌ Due date cannot be before the assigned date. Please select a valid due date.');
      return;
    }
  }

  // Find user by email if provided
  let assigneeId = null;
  if (taskAssigneeEmail) {
    try {
      const token = localStorage.getItem('token');
      const userRes = await fetch(`/api/users?search=${encodeURIComponent(taskAssigneeEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userRes.ok) {
        const users = await userRes.json();
        if (users.length > 0) {
          assigneeId = users[0]._id;
        } else {
          alert(`❌ User not found: "${taskAssigneeEmail}". Please enter a valid email address of a registered user.`);
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
  }

  const taskData = {
    title: taskTitle,
    description: taskDescription,
    assignee: assigneeId,
    startDate: taskAssignedDate,
    dueDate: taskDueDate,
    priority: taskPriority.toLowerCase(),
    status: taskStatus
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      const newTask = await response.json();
      tasks.push(newTask);
      renderTasks(tasks);
      updateTaskStats();
      
      // Notify other pages about task update
      notifyTaskUpdate();
      
      e.target.reset();

      // Close modal if using Bootstrap
      const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
      if (modal) modal.hide();

      alert('✅ Task added successfully!');
    } else {
      const error = await response.json();
      alert('❌ Failed to add task: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error adding task:', error);
    alert('❌ Error adding task');
  }
}

// View task details
function viewTask(taskId) {
  const task = tasks.find(t => t._id === taskId);
  if (!task) return;
  
  alert(`Task: ${task.title}\n\nDescription: ${task.description || 'No description'}\nStatus: ${task.status}\nPriority: ${task.priority || 'medium'}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`);
}

// Edit task
async function editTask(taskId) {
  const task = tasks.find(t => t._id === taskId);
  if (!task) return;

  const newTitle = prompt('Enter new title:', task.title);
  if (!newTitle) return;

  const newStatus = prompt('Enter new status (todo/progress/done):', task.status);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle, status: newStatus })
    });

    if (response.ok) {
      await loadTasksFromBackend();
      alert('✅ Task updated successfully!');
    } else {
      alert('❌ Failed to update task');
    }
  } catch (error) {
    console.error('Error updating task:', error);
    alert('❌ Error updating task');
  }
}

// Open Edit Task Modal
let currentEditTaskId = null;

async function openEditTaskModal(taskId) {
  try {
    currentEditTaskId = taskId;
    const task = tasks.find(t => t._id === taskId);
    
    if (!task) {
      alert('❌ Task not found');
      return;
    }

    // Populate the edit form
    document.getElementById('editTaskTitle').value = task.title || '';
    document.getElementById('editTaskDescription').value = task.description || '';
    // Set assignee email in input field
    const assigneeEmail = task.assignee?.email || '';
    document.getElementById('editTaskAssignee').value = assigneeEmail;
    document.getElementById('editTaskAssignedDate').value = task.startDate ? task.startDate.split('T')[0] : '';
    document.getElementById('editTaskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
    document.getElementById('editTaskPriority').value = (task.priority || 'Medium');
    
    // Set status dropdown
    const statusValue = (task.status || 'todo').toLowerCase().trim();
    let statusOption = 'todo';
    if (statusValue === 'in-progress' || statusValue === 'progress' || statusValue === 'in progress') {
      statusOption = 'in-progress';
    } else if (statusValue === 'done' || statusValue === 'completed') {
      statusOption = 'done';
    } else if (statusValue === 'todo' || statusValue === 'pending') {
      statusOption = 'todo';
    }
    document.getElementById('editTaskStatus').value = statusOption;

    // Show the modal
    const editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    editModal.show();
  } catch (error) {
    console.error('Error opening edit modal:', error);
    alert('❌ Error opening edit modal');
  }
}

async function handleEditTask(e) {
  e.preventDefault();

  if (!currentEditTaskId) {
    alert('❌ No task selected for editing');
    return;
  }

  // Get form values
  const taskTitle = document.getElementById('editTaskTitle').value;
  const taskDescription = document.getElementById('editTaskDescription').value;
  const taskAssigneeEmail = document.getElementById('editTaskAssignee').value.trim();
  const taskAssignedDate = document.getElementById('editTaskAssignedDate').value;
  const taskDueDate = document.getElementById('editTaskDueDate').value;
  const taskPriority = document.getElementById('editTaskPriority').value;
  const taskStatus = document.getElementById('editTaskStatus').value;

  // Validate dates: Due date must not be before assigned date
  if (taskAssignedDate && taskDueDate) {
    const assignedDate = new Date(taskAssignedDate);
    const dueDate = new Date(taskDueDate);
    
    if (dueDate < assignedDate) {
      alert('❌ Due date cannot be before the assigned date. Please select a valid due date.');
      return;
    }
  }

  // Find user by email if provided
  let assigneeId = null;
  if (taskAssigneeEmail) {
    try {
      const token = localStorage.getItem('token');
      const userRes = await fetch(`/api/users?search=${encodeURIComponent(taskAssigneeEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userRes.ok) {
        const users = await userRes.json();
        if (users.length > 0) {
          assigneeId = users[0]._id;
        } else {
          alert(`❌ User not found: "${taskAssigneeEmail}". Please enter a valid email address of a registered user.`);
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
  }

  const taskData = {
    title: taskTitle,
    description: taskDescription,
    assignee: assigneeId,
    startDate: taskAssignedDate,
    dueDate: taskDueDate,
    priority: taskPriority,
    status: taskStatus
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${currentEditTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      const updatedTask = await response.json();
      
      // Update the task in local array
      const taskIndex = tasks.findIndex(t => t._id === currentEditTaskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
      }

      // Re-render tasks
      renderTasks(tasks);
      updateTaskStats();

      // Notify other pages about task update
      notifyTaskUpdate();

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
      if (modal) modal.hide();

      alert('✅ Task updated successfully!');
      currentEditTaskId = null;
    } else {
      const error = await response.json();
      alert('❌ Failed to update task: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating task:', error);
    alert('❌ Error updating task');
  }
}

// Update task status (quick update from dropdown)
async function updateTaskStatus(taskId, newStatus) {
  try {
    // Find the task to get its current data
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
      alert('❌ Task not found');
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus
      })
    });

    if (response.ok) {
      const updatedTask = await response.json();
      
      // Update the task in local array
      const taskIndex = tasks.findIndex(t => t._id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
      }

      // Re-render tasks to update statistics
      renderTasks(tasks);
      updateTaskStats();

      // Notify other pages about task update
      notifyTaskUpdate();

      // Show success message (brief)
      const statusNames = {
        'todo': 'Pending',
        'in-progress': 'In Progress',
        'done': 'Completed'
      };
      console.log(`✅ Task status updated to: ${statusNames[newStatus] || newStatus}`);
    } else {
      const error = await response.json();
      alert('❌ Failed to update task status: ' + (error.message || 'Unknown error'));
      // Reload tasks to revert the dropdown
      await loadTasksFromBackend();
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    alert('❌ Error updating task status');
    // Reload tasks to revert the dropdown
    await loadTasksFromBackend();
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      tasks = tasks.filter(t => t._id !== taskId);
      renderTasks(tasks);
      updateTaskStats();
      
      // Notify other pages about task update
      notifyTaskUpdate();
      
      alert('✅ Task deleted successfully!');
    } else {
      alert('❌ Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('❌ Error deleting task');
  }
}

// Mark task as complete
async function markComplete(taskId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'completed' })
    });

    if (response.ok) {
      await loadTasksFromBackend();
      alert('✅ Task marked as complete!');
    } else {
      alert('❌ Failed to mark task as complete');
    }
  } catch (error) {
    console.error('Error marking task complete:', error);
    alert('❌ Error marking task complete');
  }
}

// Open comment modal and load comments
async function openCommentModal(taskId) {
  const task = tasks.find(t => t._id === taskId);
  if (!task) return;
  
  // Show comment modal
  const modal = new bootstrap.Modal(document.getElementById('commentModal'));
  document.getElementById('commentModalLabel').textContent = `Comments for: ${task.title}`;
  
  // Load comments
  await loadComments(taskId);
  
  modal.show();
  
  // Save comment button handler
  document.getElementById('saveCommentBtn').onclick = async function() {
    const commentText = document.getElementById('newComment').value.trim();
    if (commentText) {
      await saveComment(taskId, commentText);
    } else {
      alert('Please enter a comment');
    }
  };
}

// Load comments for a task
async function loadComments(taskId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const task = await response.json();
      const commentList = document.getElementById('commentList');
      
      if (task.comments && task.comments.length > 0) {
        commentList.innerHTML = task.comments.map(comment => {
          const author = comment.author?.name || comment.author?.email || 'Unknown';
          const date = new Date(comment.createdAt).toLocaleString();
          return `
            <div class="card mb-2">
              <div class="card-body p-2">
                <p class="mb-1">${comment.text}</p>
                <small class="text-muted">
                  <i class="fa-solid fa-user"></i> ${author} - ${date}
                </small>
              </div>
            </div>
          `;
        }).join('');
      } else {
        commentList.innerHTML = '<p class="text-muted">No comments yet.</p>';
      }
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Save a new comment
async function saveComment(taskId, commentText) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: commentText })
    });

    if (response.ok) {
      document.getElementById('newComment').value = '';
      await loadComments(taskId);
      await loadTasksFromBackend(); // Refresh task list to show new latest comment
      alert('✅ Comment added successfully!');
    } else {
      const error = await response.json();
      alert('❌ Failed to add comment: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error saving comment:', error);
    alert('❌ Error saving comment');
  }
}

// Update task statistics
function updateTaskStats() {
  const allCount = tasks.length;
  const pendingCount = tasks.filter(t => {
    const status = (t.status || '').toLowerCase().trim();
    return status === 'todo' || status === 'pending';
  }).length;
  const progressCount = tasks.filter(t => {
    const status = (t.status || '').toLowerCase().trim();
    return status === 'in-progress' || status === 'progress' || status === 'in progress';
  }).length;
  const completedCount = tasks.filter(t => {
    const status = (t.status || '').toLowerCase().trim();
    return status === 'done' || status === 'completed';
  }).length;

  const allCountEl = document.getElementById('allCount');
  const pendingCountEl = document.getElementById('pendingCount');
  const progressCountEl = document.getElementById('progressCount');
  const completedCountEl = document.getElementById('completedCount');

  if (allCountEl) allCountEl.textContent = allCount;
  if (pendingCountEl) pendingCountEl.textContent = pendingCount;
  if (progressCountEl) progressCountEl.textContent = progressCount;
  if (completedCountEl) completedCountEl.textContent = completedCount;
}

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

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}
