// Dashboard integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
  setupMobileSidebar();
  loadDashboardData();
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

async function loadDashboardData() {
  try {
    const token = localStorage.getItem('token');

    // Load projects
    const projectsResponse = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Load tasks
    const tasksResponse = await fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (projectsResponse.status === 401 || tasksResponse.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const projects = projectsResponse.ok ? await projectsResponse.json() : [];
    const tasks = tasksResponse.ok ? await tasksResponse.json() : [];

    updateDashboardStats(projects, tasks);
    renderProjectProgress(projects, tasks);
    renderRecentActivities(projects, tasks);
    renderUpcomingDeadlines(projects, tasks);
    renderRecentTasks(tasks);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function updateDashboardStats(projects, tasks) {
  console.log('Updating dashboard stats:', { 
    totalProjects: projects.length, 
    totalTasks: tasks.length 
  });

  // Count active projects (not completed)
  const activeProjects = projects.filter(p => {
    const status = (p.status || '').toLowerCase().trim();
    return status !== 'completed' && status !== 'done';
  }).length;

  // Count completed projects
  const completedProjects = projects.filter(p => {
    const status = (p.status || '').toLowerCase().trim();
    return status === 'completed' || status === 'done';
  }).length;

  // Count open tasks (pending or in-progress)
  const openTasks = tasks.filter(t => {
    const status = (t.status || '').toLowerCase().trim();
    return status === 'pending' || status === 'todo' || status === 'in-progress' || status === 'progress' || status === 'in progress';
  }).length;

  console.log('Dashboard counts:', { 
    activeProjects, 
    completedProjects, 
    openTasks 
  });

  // Update the dashboard stats
  const activeProjectsEl = document.getElementById('activeProjectsCount');
  if (activeProjectsEl) {
    activeProjectsEl.textContent = activeProjects;
  }

  const completedProjectsEl = document.getElementById('completedProjectsCount');
  if (completedProjectsEl) {
    completedProjectsEl.textContent = completedProjects;
  }

  const openTasksEl = document.getElementById('openTasksCount');
  if (openTasksEl) {
    openTasksEl.textContent = openTasks;
  }
}

// Project cards removed from dashboard - function kept for potential future use
// function renderRecentProjects(projects) {
//   const container = document.getElementById('recentProjects') || document.querySelector('.row');
//   if (!container) return;
//   const recent = projects.slice(0, 3);
//   if (recent.length === 0) {
//     container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No projects yet</p></div>';
//     return;
//   }
//   container.innerHTML = '';
//   recent.forEach(project => {
//     const status = project.status || 'active';
//     const statusClass = status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'primary';
//     container.innerHTML += `
//       <div class="col-md-4 mb-3">
//         <div class="card">
//           <div class="card-body">
//             <h5 class="card-title">${project.title}</h5>
//             <p class="card-text">${project.description || 'No description'}</p>
//             <span class="badge bg-${statusClass}">${status}</span>
//             <a href="project-details.html?id=${project._id}" class="btn btn-sm btn-primary mt-2">View Details</a>
//           </div>
//         </div>
//       </div>
//     `;
//   });
// }

function renderProjectProgress(projects, tasks) {
  const container = document.getElementById('projectProgressList');
  if (!container) return;

  // Get active projects only (not completed)
  const activeProjects = projects.filter(p => {
    const status = (p.status || '').toLowerCase().trim();
    return status !== 'completed' && status !== 'done';
  });

  if (activeProjects.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No active projects</p>';
    return;
  }

  // Limit to first 5 projects for display
  const displayProjects = activeProjects.slice(0, 5);

  container.innerHTML = '';
  displayProjects.forEach(project => {
    // Calculate progress based on tasks
    const projectTasks = tasks.filter(t => t.project?._id === project._id || t.project === project._id);
    const completedTasks = projectTasks.filter(t => {
      const status = (t.status || '').toLowerCase().trim();
      return status === 'completed' || status === 'done';
    }).length;
    
    const progress = projectTasks.length > 0 
      ? Math.round((completedTasks / projectTasks.length) * 100) 
      : 0;

    // Determine progress bar color
    let progressColor = 'primary';
    if (progress >= 75) progressColor = 'success';
    else if (progress >= 50) progressColor = 'info';
    else if (progress >= 25) progressColor = 'warning';

    const progressHtml = `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span>${project.title}</span>
          <span>${progress}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar bg-${progressColor}" style="width: ${progress}%" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
    
    container.innerHTML += progressHtml;
  });
}

function renderRecentActivities(projects, tasks) {
  const container = document.getElementById('recentActivitiesList');
  if (!container) return;

  // Combine projects and tasks to create activities
  const activities = [];

  // Add recently created projects
  projects.forEach(project => {
    activities.push({
      type: 'project',
      title: `Created project: ${project.title}`,
      date: new Date(project.createdAt || Date.now()),
      icon: 'fa-folder-plus'
    });
  });

  // Add recently completed tasks
  tasks.forEach(task => {
    const status = (task.status || '').toLowerCase().trim();
    if (status === 'completed' || status === 'done') {
      activities.push({
        type: 'task_completed',
        title: `Completed task: ${task.title}`,
        date: new Date(task.createdAt || Date.now()),
        icon: 'fa-check-circle',
        project: task.project?.title || ''
      });
    }
  });

  // Add recently created tasks
  tasks.forEach(task => {
    const status = (task.status || '').toLowerCase().trim();
    if (status === 'pending' || status === 'todo' || status === 'in-progress' || status === 'progress' || status === 'in progress') {
      activities.push({
        type: 'task_created',
        title: `New task: ${task.title}`,
        date: new Date(task.createdAt || Date.now()),
        icon: 'fa-pen-to-square',
        project: task.project?.title || ''
      });
    }
  });

  // Sort by date (most recent first) and limit to 5
  activities.sort((a, b) => b.date - a.date);
  const recentActivities = activities.slice(0, 5);

  if (recentActivities.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No recent activities</p>';
    return;
  }

  container.innerHTML = '';
  recentActivities.forEach(activity => {
    const dateStr = activity.date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const activityHtml = `
      <div class="event-card">
        <i class="fa-solid ${activity.icon}"></i>
        <div class="event-info">
          <strong>${activity.title}</strong>
          <span>${activity.project ? activity.project + ' - ' : ''}${dateStr}</span>
        </div>
      </div>
    `;
    
    container.innerHTML += activityHtml;
  });
}

function renderUpcomingDeadlines(projects, tasks) {
  const container = document.getElementById('upcomingDeadlinesList');
  if (!container) return;

  const now = new Date();
  const deadlines = [];

  // Add project deadlines (endDate)
  projects.forEach(project => {
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      const status = (project.status || '').toLowerCase().trim();
      
      // Only show upcoming deadlines (future dates) for active projects
      if (endDate >= now && status !== 'completed' && status !== 'done') {
        deadlines.push({
          title: project.title,
          date: endDate,
          type: 'project',
          description: 'Project Deadline'
        });
      }
    }
  });

  // Add task deadlines (dueDate)
  tasks.forEach(task => {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const status = (task.status || '').toLowerCase().trim();
      
      // Only show upcoming deadlines for incomplete tasks
      if (dueDate >= now && status !== 'completed' && status !== 'done') {
        deadlines.push({
          title: task.title,
          date: dueDate,
          type: 'task',
          description: task.project?.title || 'Task Deadline',
          projectName: task.project?.title
        });
      }
    }
  });

  // Sort by date (earliest first) and limit to 5
  deadlines.sort((a, b) => a.date - b.date);
  const upcomingDeadlines = deadlines.slice(0, 5);

  if (upcomingDeadlines.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No upcoming deadlines</p>';
    return;
  }

  container.innerHTML = '';
  upcomingDeadlines.forEach((deadline, index) => {
    const dateStr = deadline.date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    
    const timeStr = deadline.date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // Calculate days until deadline
    const daysUntil = Math.ceil((deadline.date - now) / (1000 * 60 * 60 * 24));
    
    // Choose icon based on urgency
    let icon = 'fa-hourglass-start';
    if (daysUntil <= 1) icon = 'fa-hourglass-end';
    else if (daysUntil <= 3) icon = 'fa-hourglass-half';

    const urgencyText = daysUntil === 0 ? 'Today' : 
                       daysUntil === 1 ? 'Tomorrow' : 
                       `In ${daysUntil} days`;

    const deadlineHtml = `
      <div class="event-card">
        <i class="fa-solid ${icon}"></i>
        <div class="event-info">
          <strong>${dateStr}:</strong> ${deadline.title}
          <span>${deadline.description} - ${urgencyText} at ${timeStr}</span>
        </div>
      </div>
    `;
    
    container.innerHTML += deadlineHtml;
  });
}

function renderRecentTasks(tasks) {
  const container = document.getElementById('recentTasks');
  if (!container) return;

  const recent = tasks.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No tasks yet</p>';
    return;
  }

  container.innerHTML = '';
  recent.forEach(task => {
    const priorityColors = {
      high: 'danger',
      medium: 'warning',
      low: 'info'
    };
    const priorityColor = priorityColors[task.priority] || 'secondary';
    const assigneeName = task.assignee?.name || task.assignee?.email || 'Unassigned';

    container.innerHTML += `
      <div class="task-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
        <div>
          <strong>${task.title}</strong>
          <br>
          <small class="text-muted">${assigneeName}</small>
        </div>
        <span class="badge bg-${priorityColor}">${task.priority || 'medium'}</span>
      </div>
    `;
  });
}

// Add new project from dashboard
const saveProjectBtn = document.getElementById("saveProject");
if (saveProjectBtn) {
  saveProjectBtn.addEventListener("click", async function () {
    const name = document.getElementById("projectName")?.value.trim();
    const desc = document.getElementById("projectDesc")?.value.trim();
    const deadline = document.getElementById("projectDeadline")?.value;

    if (!name) {
      alert("Please enter a project name!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: name,
          description: desc,
          endDate: deadline,
          status: 'active'
        })
      });

      if (response.ok) {
        alert('✅ Project created successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById("addProjectModal"));
        if (modal) modal.hide();
        document.getElementById("projectForm")?.reset();
        loadDashboardData(); // Reload dashboard
      } else {
        alert('❌ Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('❌ Error creating project');
    }
  });
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}
