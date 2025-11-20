// project-details.js: Handles loading and displaying project details and tasks

document.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  if (!projectId) {
    document.querySelector('.main-content').innerHTML = '<div class="alert alert-danger">Project not found.</div>';
    return;
  }
  await loadProjectDetails(projectId);
  await loadProjectTasks(projectId);
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

async function loadProjectDetails(projectId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load project');
    const project = await res.json();
    
    // Fetch tasks to calculate task count and completion
    const tasksRes = await fetch(`/api/tasks?project=${projectId}`, {
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
    
    // Update all detail items
    const detailItems = document.querySelectorAll('.detail-item span');
    if (detailItems.length >= 6) {
      // Members count
      const membersCount = project.members ? project.members.length : 0;
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
    }
    
    console.log('Project loaded:', project);
    console.log('Tasks:', totalTasks, 'Completed:', completedTasks, 'Progress:', completionPercentage + '%');
    
  } catch (err) {
    console.error('Error loading project details:', err);
    document.querySelector('.main-content').innerHTML = '<div class="alert alert-danger">Could not load project details.</div>';
  }
}

async function loadProjectTasks(projectId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load tasks');
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    document.querySelector('#tasksTable tbody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Could not load tasks.</td></tr>';
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
          
          // Reload tasks
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
    
    return `
      <tr>
        <td>${task.title}</td>
        <td>${task.assignee ? (task.assignee.name || task.assignee.email) : 'Unassigned'}</td>
        <td><span class="badge bg-${task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'warning'}">${task.status || 'Pending'}</span></td>
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
          
          // Reload tasks
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
      
      // Reload tasks
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('id');
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
