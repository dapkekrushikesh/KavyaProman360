// Reports integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
  setupMobileSidebar();
  loadReportsData();
  setupEventListeners();
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

    // Load projects and tasks for detailed reports
    const projectsResponse = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

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

    // Store data for export functionality
    currentReportsData = { projects, tasks };

    console.log('Loaded projects:', projects.length);
    console.log('Loaded tasks:', tasks.length);

    // Calculate statistics
    updateStatistics(projects, tasks);
    renderReportsTable(projects, tasks);
    renderCharts(tasks, projects);
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

function updateStatistics(projects, tasks) {
  // Total Projects
  const totalProjects = projects.length;
  document.getElementById('totalProjects').textContent = totalProjects;

  // Total Tasks
  const totalTasks = tasks.length;
  document.getElementById('totalTasks').textContent = totalTasks;

  // Completed Tasks
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  document.getElementById('completedTasks').textContent = completedTasks;

  // Overdue Tasks (tasks past deadline and not completed)
  const today = new Date();
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || t.status === 'completed') return false;
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    return deadline < today;
  }).length;
  document.getElementById('overdueTasks').textContent = overdueTasks;

  console.log('Statistics:', { totalProjects, totalTasks, completedTasks, overdueTasks });
}

function renderReportsTable(projects, tasks) {
  const table = document.getElementById("reportTable");
  if (!table) return;

  const filter = document.getElementById("filterSelect")?.value || "all";
  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || '';

  table.innerHTML = "";

  // Combine projects and tasks for report
  const reports = [];

  projects.forEach(p => {
    reports.push({
      date: new Date(p.createdAt).toLocaleDateString(),
      type: 'project',
      title: p.title,
      user: p.createdBy?.name || p.createdBy?.email || 'Unknown',
      status: p.status || 'active'
    });
  });

  tasks.forEach(t => {
    reports.push({
      date: new Date(t.createdAt).toLocaleDateString(),
      type: 'task',
      title: t.title,
      user: t.assignee?.name || t.assignee?.email || 'Unassigned',
      status: t.status || 'todo'
    });
  });

  // Filter and search
  const filtered = reports.filter(r => {
    const matchesFilter = filter === "all" || r.type === filter;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    table.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No reports found</td></tr>';
    return;
  }

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
  });
}

function renderCharts(tasks, projects) {
  // Calculate task completion trend for the last 7 days
  const last7Days = [];
  const completedByDay = {};
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString();
    last7Days.push(dateStr);
    completedByDay[dateStr] = 0;
  }

  // Count completed tasks by day
  tasks.forEach(task => {
    if (task.status === 'done' || task.status === 'completed') {
      const completedDate = task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : null;
      if (completedDate && completedByDay.hasOwnProperty(completedDate)) {
        completedByDay[completedDate]++;
      }
    }
  });

  const completionData = last7Days.map(date => completedByDay[date]);
  const dayLabels = last7Days.map(date => {
    const d = new Date(date);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  });

  console.log('Task completion trend:', completionData);

  // Tasks Chart - Line chart showing completion trend
  const tasksChartEl = document.getElementById("tasksChart");
  if (tasksChartEl && typeof Chart !== 'undefined') {
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(tasksChartEl);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(tasksChartEl, {
      type: "line",
      data: {
        labels: dayLabels,
        datasets: [{
          label: "Completed Tasks",
          data: completionData,
          borderColor: "#3b3b63",
          backgroundColor: "rgba(59,59,99,0.2)",
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Completed: ${context.parsed.y} tasks`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  // Project Chart - Doughnut chart showing project status
  const projectChartEl = document.getElementById("projectChart");
  if (projectChartEl && typeof Chart !== 'undefined') {
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'done').length;
    const pendingProjects = projects.filter(p => p.status === 'pending' || p.status === 'todo').length;

    console.log('Project status:', { activeProjects, completedProjects, pendingProjects });

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(projectChartEl);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(projectChartEl, {
      type: "doughnut",
      data: {
        labels: ["Active", "Completed", "Pending"],
        datasets: [{
          data: [activeProjects, completedProjects, pendingProjects],
          backgroundColor: ["#0d6efd", "#198754", "#ffc107"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: "bottom",
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed} projects`;
              }
            }
          }
        }
      }
    });
  }
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
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done' || t.status === 'completed') return false;
      if (!t.deadline) return false;
      return new Date(t.deadline) < new Date();
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
