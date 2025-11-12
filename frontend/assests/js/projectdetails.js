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
      row.innerHTML = `
        <td>${task.name || task.title}</td>
        <td>${task.assignedTo || task.assignee}</td>
        <td>${task.status}</td>
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

  // Initial load
  loadProjectData();
  renderTasks();
});
