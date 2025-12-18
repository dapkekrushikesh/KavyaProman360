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
  let tasks = [];
  let currentEditIndex = null;

  // Get project name from URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectName = urlParams.get('project');
  
  // Load project data from localStorage
  function loadProjectData() {
    const projects = localStorage.getItem('projects');
    const storedTasks = localStorage.getItem('tasks');
    
    if (projects && projectName) {
      const projectsData = JSON.parse(projects);
      currentProject = projectsData[decodeURIComponent(projectName)];
      
      if (currentProject) {
        // Update page title and project details
        // document.getElementById('projectTitle').textContent = currentProject.title; // Keep heading as 'Project Details'
        updateProjectDetails(currentProject);
      }
    }
    
    if (storedTasks && projectName) {
      const allTasks = JSON.parse(storedTasks);
      tasks = allTasks.filter(task => task.project === decodeURIComponent(projectName));
    }
  }

  // Update project details section
  function updateProjectDetails(project) {
    const projectCard = document.querySelector('.project-card');
    const projectHeader = projectCard.querySelector('.project-header h3');
    const statusBadge = projectCard.querySelector('.status-badge');
    const detailsDiv = projectCard.querySelector('.project-details');
    
    // Update header and status
    projectHeader.textContent = project.title;
    statusBadge.textContent = project.status.charAt(0).toUpperCase() + project.status.slice(1);
    statusBadge.className = `status-badge ${project.status.toLowerCase()}`;
    
    // Calculate dynamic values
    const membersCount = project.members ? project.members.length : 1;
    const membersText = membersCount === 1 ? 'Member' : 'Members';
    const tasksCount = tasks.length;
    const tasksText = tasksCount === 1 ? 'Task' : 'Tasks';
    
    // Update details
    detailsDiv.innerHTML = `
      <div class="detail-item">
        <i class="fa-solid fa-users"></i>
        <span>${membersCount} ${membersText}</span>
      </div>
      <div class="detail-item">
        <i class="fa-regular fa-calendar-days"></i>
        <span>Assigned: ${project.assignedDate || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-calendar-check"></i>
        <span>Due: ${project.date || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <i class="fa-regular fa-comment-dots"></i>
        <span>${tasksCount} ${tasksText}</span>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-stopwatch"></i>
        <span>${project.progress || 0}% Complete</span>
      </div>
    `;
  }

  // Render tasks in the table
  function renderTasks() {
    tableBody.innerHTML = "";

    tasks.forEach((task, index) => {
      const row = document.createElement("tr");
      const currentStatus = task.status || 'To Do';
      
      row.innerHTML = `
        <td>${task.name || task.title}</td>
        <td>${task.assignedTo || task.assignee}</td>
        <td>
          <select class="form-select form-select-sm status-dropdown" 
                  data-task-index="${index}"
                  style="width: auto; min-width: 130px; font-size: 0.875rem;">
            <option value="To Do" ${currentStatus === 'To Do' || currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${currentStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${currentStatus === 'Completed' || currentStatus === 'Done' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>${task.assignedDate}</td>
        <td>${task.due || task.date}</td>
        <td>
          <button class="btn btn-sm edit-btn" style="background:#52528c;color:#fff;">Edit</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
      `;

      // Edit button
      row.querySelector(".edit-btn").addEventListener("click", () => {
        currentEditIndex = index;
        const t = tasks[index];
        editTaskName.value = t.name || t.title;
        editTaskAssignedTo.value = t.assignedTo || t.assignee;
        editTaskStatus.value = t.status;
        editTaskAssignedDate.value = t.assignedDate;
        editTaskDue.value = t.due || t.date;

        const modal = new bootstrap.Modal(document.getElementById("editTaskModal"));
        modal.show();
      });

      // Status dropdown change handler
      row.querySelector(".status-dropdown").addEventListener("change", (e) => {
        const newStatus = e.target.value;
        updateTaskStatus(index, newStatus);
      });

      // Delete button
      row.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this task?")) {
          // Remove from local array
          tasks.splice(index, 1);
          
          // Update localStorage
          const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
          const updatedTasks = allTasks.filter(t => 
            !(t.project === currentProject.title && t.name === task.name)
          );
          localStorage.setItem('tasks', JSON.stringify(updatedTasks));
          
          renderTasks();
          // Update project details to reflect new task count
          if (currentProject) {
            updateProjectDetails(currentProject);
          }
        }
      });

      tableBody.appendChild(row);
    });
  }

  // Update task status (inline editing)
  async function updateTaskStatus(index, newStatus) {
    if (!currentProject) {
      alert("Project not found");
      return;
    }

    const taskToUpdate = tasks[index];
    
    // Check if task has an _id (from backend) or if it's localStorage only
    if (taskToUpdate._id) {
      // Task is from backend, use API
      try {
        const token = localStorage.getItem('token');
        
        // Map display status to backend status format
        let backendStatus = newStatus;
        if (newStatus === 'Pending') backendStatus = 'todo';
        if (newStatus === 'In Progress') backendStatus = 'in-progress';
        if (newStatus === 'Completed') backendStatus = 'done';
        
        const response = await fetch(`/api/tasks/${taskToUpdate._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: backendStatus
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update local array
          tasks[index].status = newStatus;
          
          // Show notification about email status
          if (result.emailNotifications) {
            const sent = result.emailNotifications.sent || 0;
            if (sent > 0) {
              console.log(`✅ Task status updated. ${sent} email notification(s) sent to management.`);
            }
          }
          
          console.log(`✅ Task status updated to: ${newStatus}`);
          
          // Notify other pages about task update
          notifyTaskUpdate();
          
          // Re-render to ensure consistency
          renderTasks();
          
          // Update project details if needed
          if (currentProject) {
            updateProjectDetails(currentProject);
          }
        } else {
          const error = await response.json();
          alert(`❌ Failed to update task status: ${error.message || 'Unknown error'}`);
          // Re-render to revert the dropdown
          renderTasks();
        }
      } catch (error) {
        console.error('Error updating task status:', error);
        alert('❌ Error updating task status. Please try again.');
        // Re-render to revert the dropdown
        renderTasks();
      }
    } else {
      // Fallback to localStorage for legacy tasks
      // Update local array
      tasks[index].status = newStatus;

      // Update localStorage
      const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      
      const taskIndex = allTasks.findIndex(t => 
        t.project === currentProject.title && 
        t.name === taskToUpdate.name &&
        t.assignedTo === taskToUpdate.assignedTo
      );

      if (taskIndex !== -1) {
        allTasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(allTasks));
        console.log(`✅ Task status updated to: ${newStatus} (localStorage only - no notifications)`);
      }

      // Re-render to ensure consistency
      renderTasks();
      
      // Update project details if needed
      if (currentProject) {
        updateProjectDetails(currentProject);
      }
    }
  }

  // Save Edit
  saveTaskEditBtn.addEventListener("click", () => {
    if (currentEditIndex !== null && currentProject) {
      const updatedTask = {
        name: editTaskName.value,
        assignedTo: editTaskAssignedTo.value,
        status: editTaskStatus.value,
        assignedDate: editTaskAssignedDate.value,
        due: editTaskDue.value,
        project: currentProject.title
      };

      // Update local array
      tasks[currentEditIndex] = updatedTask;
      
      // Update localStorage
      const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const taskIndex = allTasks.findIndex(t => 
        t.project === currentProject.title && 
        t.name === (tasks[currentEditIndex].name || tasks[currentEditIndex].title)
      );
      
      if (taskIndex !== -1) {
        allTasks[taskIndex] = updatedTask;
        localStorage.setItem('tasks', JSON.stringify(allTasks));
      }
      
      renderTasks();
      // Update project details to reflect any changes
      if (currentProject) {
        updateProjectDetails(currentProject);
      }
      
      const modal = bootstrap.Modal.getInstance(document.getElementById("editTaskModal"));
      modal.hide();
    }
  });

  // Add Task
  saveTaskAddBtn.addEventListener("click", () => {
    if (!currentProject) {
      alert("Project not found");
      return;
    }

    const newTask = {
      name: addTaskName.value,
      assignedTo: addTaskAssignedTo.value,
      status: addTaskStatus.value,
      assignedDate: addTaskAssignedDate.value,
      due: addTaskDue.value,
      project: currentProject.title
    };

    if (!newTask.name || !newTask.assignedTo || !newTask.assignedDate || !newTask.due) {
      alert("Please fill all fields");
      return;
    }

    // Add to local array
    tasks.push(newTask);
    
    // Add to localStorage
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    allTasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(allTasks));
    
    renderTasks();
    // Update project details to reflect new task count
    if (currentProject) {
      updateProjectDetails(currentProject);
    }
    
    addTaskForm.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById("addTaskModal"));
    modal.hide();
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

  // Initial load
  loadProjectData();
  renderTasks();
});
