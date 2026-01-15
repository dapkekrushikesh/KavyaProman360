// Reports integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman-backend.onrender.com';

// Initialize statistics on page load
window.addEventListener('load', () => {
  console.log('⚡ Window loaded - initializing default values');
  const elements = {
    totalProjects: document.getElementById('totalProjects'),
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    overdueTasks: document.getElementById('overdueTasks')
  };
  
  // Set initial loading state
  Object.entries(elements).forEach(([key, el]) => {
    if (el) {
      el.textContent = '...';
      el.style.color = '#999';
    }
  });
});

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Reports page loaded');
  console.log('API_CONFIG available:', typeof window.API_CONFIG !== 'undefined');
  console.log('API_URL:', API_URL);
  console.log('Token exists:', !!localStorage.getItem('token'));
  
  // Check if DOM elements exist
  console.log('DOM Elements check:');
  console.log('- totalProjects:', !!document.getElementById('totalProjects'));
  console.log('- totalTasks:', !!document.getElementById('totalTasks'));
  console.log('- completedTasks:', !!document.getElementById('completedTasks'));
  console.log('- overdueTasks:', !!document.getElementById('overdueTasks'));
  console.log('- tasksChart:', !!document.getElementById('tasksChart'));
  console.log('- projectChart:', !!document.getElementById('projectChart'));
  console.log('- reportTable:', !!document.getElementById('reportTable'));
  
  setupMobileSidebar();
  loadReportsData();
  setupEventListeners();
  
  // Auto-refresh reports every 30 seconds
  setInterval(() => {
    console.log('🔄 Auto-refreshing reports...');
    loadReportsData();
  }, 30000);
  
  // Listen for updates from other pages
  window.addEventListener('storage', (e) => {
    if (e.key === 'taskUpdateNotification' || e.key === 'projectUpdateNotification') {
      console.log('📢 Update detected, refreshing reports...');
      loadReportsData();
    }
  });
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
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");
  const downloadBtn = document.getElementById("downloadBtn");

  if (filterSelect) {
    filterSelect.addEventListener("change", loadReportsData);
  }

  if (searchInput) {
    searchInput.addEventListener("input", loadReportsData);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", exportReportAsPDF);
  }
}

async function loadReportsData() {
  try {
    const token = localStorage.getItem('token');

    console.log('=== REPORTS PAGE: Loading data ===');
    console.log('API URL:', API_URL);
    console.log('Token exists:', !!token);

    // Load projects and tasks for detailed reports
    const projectsResponse = await fetch(`${API_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const tasksResponse = await fetch(`${API_URL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Projects response status:', projectsResponse.status);
    console.log('Tasks response status:', tasksResponse.status);

    if (projectsResponse.status === 401 || tasksResponse.status === 401) {
      console.error('❌ Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const projects = projectsResponse.ok ? await projectsResponse.json() : [];
    const tasks = tasksResponse.ok ? await tasksResponse.json() : [];

    // Store data for export functionality
    currentReportsData = { projects, tasks };

    console.log('✅ Loaded projects:', projects.length);
    console.log('✅ Loaded tasks:', tasks.length);
    console.log('📊 Data Summary:');
    console.log('   - This includes ALL projects and tasks visible to your user role');
    console.log('   - Admin/Team Lead/Project Manager: See all data');
    console.log('   - Team Member: See only assigned projects/tasks');
    
    if (projects.length > 0) {
      console.log('Sample project:', projects[0]);
    } else {
      console.log('⚠️ No projects found. Please create some projects first.');
    }
    
    if (tasks.length > 0) {
      console.log('Sample task:', tasks[0]);
    } else {
      console.log('⚠️ No tasks found. Please create some tasks first.');
    }

    // Calculate statistics
    console.log('Updating statistics...');
    updateStatistics(projects, tasks);
    
    console.log('Rendering reports table...');
    renderReportsTable(projects, tasks);
    
    console.log('Rendering charts...');
    renderCharts(projects, tasks);
    
    console.log('=== REPORTS PAGE: Data loaded successfully ===');
  } catch (error) {
    console.error('❌ Error loading reports:', error);
    console.error('Error details:', error.message, error.stack);
    alert('❌ Failed to load reports data. Please check your connection.');
  }
}

function updateStatistics(projects, tasks) {
  console.log('--- updateStatistics START ---');
  console.log('Projects data:', projects);
  console.log('Tasks data:', tasks);
  
  // Total Projects
  const totalProjects = projects.length;
  const totalProjectsEl = document.getElementById('totalProjects');
  if (totalProjectsEl) {
    totalProjectsEl.textContent = totalProjects;
    totalProjectsEl.style.color = ''; // Reset color
    console.log('✅ Total Projects:', totalProjects);
  } else {
    console.error('❌ Element #totalProjects not found');
  }

  // Total Tasks
  const totalTasks = tasks.length;
  const totalTasksEl = document.getElementById('totalTasks');
  if (totalTasksEl) {
    totalTasksEl.textContent = totalTasks;
    totalTasksEl.style.color = ''; // Reset color
    console.log('✅ Total Tasks:', totalTasks);
  } else {
    console.error('❌ Element #totalTasks not found');
  }

  // Completed Tasks
  const completedTasks = tasks.filter(t => 
    t.status === 'done' || t.status === 'completed' || t.status === 'Completed'
  ).length;
  const completedTasksEl = document.getElementById('completedTasks');
  if (completedTasksEl) {
    completedTasksEl.textContent = completedTasks;
    completedTasksEl.style.color = ''; // Reset color
    console.log('✅ Completed Tasks:', completedTasks);
  } else {
    console.error('❌ Element #completedTasks not found');
  }

  // Overdue Tasks (tasks past due date and not completed)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
  
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || t.status === 'completed' || t.status === 'Completed') return false;
    const dueDate = t.dueDate || t.deadline || t.due;
    if (!dueDate) return false;
    const deadline = new Date(dueDate);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  }).length;
  
  const overdueTasksEl = document.getElementById('overdueTasks');
  if (overdueTasksEl) {
    overdueTasksEl.textContent = overdueTasks;
    overdueTasksEl.style.color = ''; // Reset color
    console.log('✅ Overdue Tasks:', overdueTasks);
  } else {
    console.error('❌ Element #overdueTasks not found');
  }

  console.log('📊 Statistics Summary:', {
    totalProjects,
    totalTasks,
    completedTasks,
    overdueTasks
  });
  console.log('--- updateStatistics END ---');
}

function renderReportsTable(projects, tasks) {
  console.log('--- renderReportsTable START ---');
  console.log('📋 Input data - Projects:', projects.length, 'Tasks:', tasks.length);
  
  const table = document.getElementById("reportTable");
  if (!table) {
    console.error('❌ Element #reportTable not found');
    return;
  }

  const filter = document.getElementById("filterSelect")?.value || "all";
  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || '';

  console.log('📋 Filter:', filter, 'Search term:', searchTerm);

  table.innerHTML = "";

  // Combine projects and tasks for report
  const reports = [];

  console.log('📋 Processing projects...');
  projects.forEach((p, index) => {
    const report = {
      date: new Date(p.createdAt).toLocaleDateString(),
      type: 'project',
      title: p.title,
      user: p.createdBy?.name || p.createdBy?.email || 'Unknown',
      status: p.status || 'active'
    };
    reports.push(report);
    if (index < 2) {
      console.log(`   Sample project ${index + 1}:`, report);
    }
  });

  console.log('📋 Processing tasks...');
  tasks.forEach((t, index) => {
    const report = {
      date: new Date(t.createdAt).toLocaleDateString(),
      type: 'task',
      title: t.title,
      user: t.assignee?.name || t.assignee?.email || 'Unassigned',
      status: t.status || 'todo'
    };
    reports.push(report);
    if (index < 2) {
      console.log(`   Sample task ${index + 1}:`, report);
    }
  });

  console.log('📋 Total reports combined:', reports.length);

  // Filter and search
  const filtered = reports.filter(r => {
    const matchesFilter = filter === "all" || r.type === filter;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  console.log('📋 After filtering - Matched reports:', filtered.length);
  
  if (filtered.length > 0) {
    console.log('📋 First 3 filtered reports:');
    filtered.slice(0, 3).forEach((r, i) => {
      console.log(`   ${i + 1}.`, r);
    });
  }

  if (filtered.length === 0) {
    table.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No reports found</td></tr>';
    console.log('⚠️ No reports to display - showing empty message');
    console.log('--- renderReportsTable END ---');
    return;
  }

  console.log('📋 Rendering table rows...');
  let rowCount = 0;
  filtered.forEach(r => {
    const row = document.createElement("tr");
    const statusMap = {
      'active': 'In Progress',
      'completed': 'Completed',
      'done': 'Completed',
      'pending': 'Pending',
      'todo': 'Pending',
      'progress': 'In Progress'
    };
    const displayStatus = statusMap[r.status] || r.status;
    const badgeColor = displayStatus === "Completed" ? "success" : displayStatus === "Pending" ? "secondary" : "warning";

    row.innerHTML = `
      <td>${r.date}</td>
      <td class="text-capitalize">${r.type}</td>
      <td>${r.title}</td>
      <td>${r.user}</td>
      <td><span class="badge bg-${badgeColor}">${displayStatus}</span></td>
    `;
    table.appendChild(row);
    rowCount++;
  });
  
  console.log('✅ Table rendered successfully with', rowCount, 'rows');
  console.log('--- renderReportsTable END ---');
}

function renderCharts(projects, tasks) {
  console.log('--- renderCharts START ---');
  console.log('📊 Rendering charts with data:', { projectsCount: projects.length, tasksCount: tasks.length });
  
  // Calculate task completion trend for the last 7 days
  const last7Days = [];
  const completedByDay = {};
  const today = new Date();
  
  console.log('📅 Generating last 7 days data...');
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toLocaleDateString('en-US');
    last7Days.push(dateStr);
    completedByDay[dateStr] = 0;
  }

  console.log('📅 Date range:', last7Days);
  console.log('🔍 Analyzing tasks for completion dates...');

  // Count completed tasks by day - check both updatedAt and createdAt
  let tasksAnalyzed = 0;
  let completedTasksFound = 0;
  
  tasks.forEach(task => {
    tasksAnalyzed++;
    const isCompleted = task.status === 'done' || task.status === 'completed' || task.status === 'Completed';
    
    if (isCompleted) {
      completedTasksFound++;
      // Try updatedAt first, then createdAt as fallback
      const completedDate = task.updatedAt ? 
        new Date(task.updatedAt).toLocaleDateString('en-US') : 
        (task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US') : null);
      
      if (completedDate) {
        if (completedByDay.hasOwnProperty(completedDate)) {
          completedByDay[completedDate]++;
          console.log(`  ✓ Task "${task.title}" completed on ${completedDate}`);
        } else {
          console.log(`  ℹ Task "${task.title}" completed on ${completedDate} (outside 7-day range)`);
        }
      }
    }
  });

  console.log(`📊 Tasks Analysis: ${tasksAnalyzed} total, ${completedTasksFound} completed`);
  console.log('📊 Completion by day:', completedByDay);

  const completionData = last7Days.map(date => completedByDay[date]);
  const dayLabels = last7Days.map(date => {
    const d = new Date(date);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  });

  console.log('📈 Chart data prepared:');
  console.log('   Labels:', dayLabels);
  console.log('   Data:', completionData);
  console.log('   Total completed in range:', completionData.reduce((a, b) => a + b, 0));

  // Tasks Chart - Line chart showing completion trend
  const tasksChartEl = document.getElementById("tasksChart");
  if (!tasksChartEl) {
    console.error('❌ Element #tasksChart not found');
  } else if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js library not loaded');
  } else {
    console.log('✅ Creating tasks line chart...');
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(tasksChartEl);
    if (existingChart) {
      console.log('🗑️ Destroying existing tasks chart');
      existingChart.destroy();
    }

    try {
      const chart = new Chart(tasksChartEl, {
        type: "line",
        data: {
          labels: dayLabels,
          datasets: [{
            label: "Completed Tasks",
            data: completionData,
            borderColor: "#4B49AC",
            backgroundColor: "rgba(75, 73, 172, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "#4B49AC",
            pointBorderColor: "#fff",
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              labels: {
                color: '#333',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Completed: ${context.parsed.y} task${context.parsed.y !== 1 ? 's' : ''}`;
                },
                title: function(context) {
                  const index = context[0].dataIndex;
                  return last7Days[index];
                }
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#4B49AC',
              borderWidth: 1
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#666'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              title: {
                display: true,
                text: 'Number of Tasks',
                color: '#333',
                font: {
                  weight: 'bold'
                }
              }
            },
            x: {
              ticks: {
                color: '#666'
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
      console.log('✅ Tasks line chart created successfully!');
      console.log('📊 Chart instance:', chart);
    } catch (error) {
      console.error('❌ Error creating chart:', error);
    }
  }

  // Project Chart - Doughnut chart showing project status
  const projectChartEl = document.getElementById("projectChart");
  if (!projectChartEl) {
    console.error('❌ Element #projectChart not found');
  } else if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js library not loaded');
  } else {
    console.log('✅ Creating project doughnut chart...');
    console.log('📊 Total projects received:', projects.length);
    
    if (projects.length > 0) {
      console.log('📋 Sample project:', projects[0]);
    }
    
    // Count projects by status with all possible variants
    const activeProjects = projects.filter(p => {
      const status = (p.status || '').toLowerCase();
      return status === 'active' || status === 'progress' || status === 'in progress' || status === 'in-progress';
    }).length;
    
    const completedProjects = projects.filter(p => {
      const status = (p.status || '').toLowerCase();
      return status === 'completed' || status === 'done' || status === 'finished';
    }).length;
    
    const pendingProjects = projects.filter(p => {
      const status = (p.status || '').toLowerCase();
      return status === 'pending' || status === 'todo' || status === 'not started';
    }).length;
    
    // Check all project statuses (for debugging)
    const allStatuses = projects.map(p => p.status);
    const uniqueStatuses = [...new Set(allStatuses)];
    console.log('📊 All unique project statuses found:', uniqueStatuses);
    console.log('📊 Project status breakdown:', { 
      activeProjects, 
      completedProjects, 
      pendingProjects,
      total: projects.length,
      accounted: activeProjects + completedProjects + pendingProjects
    });
    
    // Check for unaccounted projects
    const unaccounted = projects.length - (activeProjects + completedProjects + pendingProjects);
    if (unaccounted > 0) {
      console.warn(`⚠️ ${unaccounted} project(s) have unrecognized status values:`, 
        projects.filter(p => {
          const status = (p.status || '').toLowerCase();
          return !(
            status === 'active' || status === 'progress' || status === 'in progress' || status === 'in-progress' ||
            status === 'completed' || status === 'done' || status === 'finished' ||
            status === 'pending' || status === 'todo' || status === 'not started'
          );
        }).map(p => ({ title: p.title, status: p.status }))
      );
    }

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(projectChartEl);
    if (existingChart) {
      console.log('🗑️ Destroying existing project chart');
      existingChart.destroy();
    }

    try {
      const totalProjects = activeProjects + completedProjects + pendingProjects;
      
      if (totalProjects === 0) {
        console.warn('⚠️ No projects with recognized statuses to display in chart');
        // Display empty state message
        const ctx = projectChartEl.getContext('2d');
        ctx.clearRect(0, 0, projectChartEl.width, projectChartEl.height);
        ctx.font = '14px Poppins, sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('No project data available', projectChartEl.width / 2, projectChartEl.height / 2);
      } else {
        const chart = new Chart(projectChartEl, {
          type: "doughnut",
          data: {
            labels: ["Active", "Completed", "Pending"],
            datasets: [{
              data: [activeProjects, completedProjects, pendingProjects],
              backgroundColor: [
                "#0d6efd",  // Blue for Active
                "#198754",  // Green for Completed
                "#ffc107"   // Yellow/Orange for Pending
              ],
              borderWidth: 3,
              borderColor: "#fff",
              hoverOffset: 10,
              hoverBorderWidth: 4,
              hoverBorderColor: "#4B49AC"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',  // Makes it a donut (not just a pie)
            plugins: {
              legend: { 
                position: "bottom",
                labels: {
                  padding: 20,
                  font: {
                    size: 13,
                    weight: 'bold',
                    family: 'Poppins, sans-serif'
                  },
                  color: '#333',
                  usePointStyle: true,
                  pointStyle: 'circle',
                  boxWidth: 12,
                  boxHeight: 12
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                titleFont: {
                  size: 14,
                  weight: 'bold'
                },
                bodyFont: {
                  size: 13
                },
                padding: 12,
                borderColor: '#4B49AC',
                borderWidth: 2,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `${label}: ${value} project${value !== 1 ? 's' : ''} (${percentage}%)`;
                  },
                  title: function(context) {
                    return 'Project Status';
                  }
                }
              }
            },
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 1000,
              easing: 'easeInOutQuart'
            }
          }
        });
        console.log('✅ Project doughnut chart created successfully!');
        console.log('📊 Chart instance:', chart);
        console.log('📊 Chart data:', chart.data.datasets[0].data);
      }
    } catch (error) {
      console.error('❌ Error creating project chart:', error);
      console.error('Error stack:', error.stack);
    }
  }
  
  console.log('--- renderCharts END ---');
}

// Export functionality
let currentReportsData = { projects: [], tasks: [] };

function exportReportAsPDF() {
  const { projects, tasks } = currentReportsData;
  
  if (!projects.length && !tasks.length) {
    alert('❌ No data available to export');
    return;
  }

  // Check if jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    alert('❌ PDF library not loaded. Please refresh the page and try again.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const today = new Date().toLocaleDateString();
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Calculate statistics
    const completedTasks = tasks.filter(t => 
      t.status === 'done' || t.status === 'completed' || t.status === 'Completed'
    ).length;
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done' || t.status === 'completed' || t.status === 'Completed') return false;
      const dueDate = t.dueDate || t.deadline || t.due;
      if (!dueDate) return false;
      const deadline = new Date(dueDate);
      deadline.setHours(0, 0, 0, 0);
      return deadline < todayDate;
    }).length;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(75, 73, 172);
    doc.text('Kavu Proman', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Project Management Report', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${today}`, 14, 38);
    doc.text(`Total Items: ${projects.length + tasks.length}`, 14, 43);
    
    // Draw line
    doc.setDrawColor(75, 73, 172);
    doc.setLineWidth(0.5);
    doc.line(14, 46, 196, 46);

    // Statistics Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 14, 55);
    
    doc.setFontSize(10);
    const statsY = 63;
    const statsData = [
      ['Total Projects:', projects.length.toString()],
      ['Total Tasks:', tasks.length.toString()],
      ['Completed Tasks:', completedTasks.toString()],
      ['Overdue Tasks:', overdueTasks.toString()]
    ];
    
    doc.autoTable({
      startY: statsY,
      head: [],
      body: statsData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 30 }
      },
      margin: { left: 14 }
    });

    // Projects Section
    let currentY = doc.lastAutoTable.finalY + 10;
    
    if (projects.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Projects Summary', 14, currentY);
      
      const projectRows = projects.map(p => [
        p.title || 'Untitled',
        (p.status || 'active').toUpperCase(),
        p.createdBy?.name || p.createdBy?.email || 'Unknown',
        new Date(p.createdAt).toLocaleDateString()
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: [['Project Title', 'Status', 'Created By', 'Created Date']],
        body: projectRows,
        theme: 'grid',
        headStyles: {
          fillColor: [75, 73, 172],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 50 },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Tasks Section
    if (tasks.length > 0) {
      // Check if we need a new page
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Tasks Summary', 14, currentY);
      
      const taskRows = tasks.map(t => [
        t.title || 'Untitled',
        (t.status || 'todo').toUpperCase(),
        t.assignee?.name || t.assignee?.email || 'Unassigned',
        t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: [['Task Title', 'Status', 'Assigned To', 'Deadline']],
        body: taskRows,
        theme: 'grid',
        headStyles: {
          fillColor: [75, 73, 172],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 50 },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    doc.setPage(pageCount);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const footerY = doc.internal.pageSize.height - 10;
    doc.text(`© ${new Date().getFullYear()} Kavu Proman. All rights reserved.`, 14, footerY);
    doc.text(`Page ${pageCount}`, doc.internal.pageSize.width - 30, footerY);

    // Save the PDF
    const filename = `Kavu_Proman_Report_${timestamp}.pdf`;
    doc.save(filename);
    
    // Show success message
    setTimeout(() => {
      alert(`✅ Report downloaded successfully as ${filename}`);
    }, 100);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('❌ Failed to generate PDF. Please try again.');
  }
}
