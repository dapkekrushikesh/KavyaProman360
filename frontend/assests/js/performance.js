 document.addEventListener('DOMContentLoaded', async function() {
      await loadUserProfile();
      await checkAccessPermission();
      await loadPerformanceData();
      
      // Add event listener for month filter
      document.getElementById('monthFilter').addEventListener('change', function() {
        loadPerformanceData();
      });
    });

    async function loadUserProfile() {
      const currentUserData = sessionStorage.getItem('currentUser');
      if (currentUserData) {
        try {
          const user = JSON.parse(currentUserData);
          document.querySelectorAll('.profile-user-name').forEach(el => el.textContent = user.name || 'User');
          document.querySelectorAll('.profile-user-role').forEach(el => el.textContent = user.role || 'Role');
          document.querySelectorAll('.profile-user-email').forEach(el => el.textContent = user.email || 'user@example.com');
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    }

    async function checkAccessPermission() {
      const currentUserData = sessionStorage.getItem('currentUser');
      if (!currentUserData) {
        alert('⚠️ Please login to view this page');
        window.location.href = 'index.html';
        return;
      }

      try {
        const user = JSON.parse(currentUserData);
        const allowedRoles = ['Admin', 'Team Lead', 'Project Manager'];
        
        if (!allowedRoles.includes(user.role)) {
          alert('⚠️ Access Denied: Only Admin, Team Lead, and Project Manager can view performance data');
          window.location.href = 'dashboard.html';
          return;
        }
      } catch (error) {
        console.error('Error checking access:', error);
        window.location.href = 'index.html';
      }
    }

    async function loadPerformanceData() {
      const token = localStorage.getItem('token');
      const monthFilter = document.getElementById('monthFilter').value;
      
      if (!token) {
        window.location.href = 'index.html';
        return;
      }

      try {
        // Fetch all users
        const usersRes = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const allUsers = await usersRes.json();

        // Fetch all projects
        const projectsRes = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');
        const allProjects = await projectsRes.json();

        // Fetch all tasks
        const tasksRes = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
        let allTasks = await tasksRes.json();

        // Filter tasks by month if selected
        if (monthFilter !== 'all') {
          const monthsAgo = parseInt(monthFilter);
          const filterDate = new Date();
          filterDate.setMonth(filterDate.getMonth() - monthsAgo);
          const startOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
          const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0);

          allTasks = allTasks.filter(task => {
            const taskDate = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
            return taskDate >= startOfMonth && taskDate <= endOfMonth;
          });
        }

        // Calculate performance for each employee
        const employeePerformance = {};
        
        // Get all assigned employees from projects
        const assignedEmployeeIds = new Set();
        allProjects.forEach(project => {
          if (project.assignedTo && Array.isArray(project.assignedTo)) {
            project.assignedTo.forEach(member => {
              const memberId = member._id || member;
              assignedEmployeeIds.add(memberId);
            });
          }
        });

        // Initialize performance data for assigned employees
        assignedEmployeeIds.forEach(employeeId => {
          const user = allUsers.find(u => u._id === employeeId);
          if (user) {
            employeePerformance[employeeId] = {
              name: user.name || 'Unknown',
              email: user.email || '',
              role: user.role || 'User',
              projects: new Set(),
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              pendingTasks: 0,
              todoTasks: 0,
              overdueTasks: 0,
              completionRate: 0
            };
          }
        });

        // Calculate task statistics
        allTasks.forEach(task => {
          const assigneeId = task.assignee?._id || task.assignee;
          if (!assigneeId || !employeePerformance[assigneeId]) return;

          const employee = employeePerformance[assigneeId];
          employee.totalTasks++;

          // Track projects
          const projectId = task.project?._id || task.project;
          if (projectId) {
            employee.projects.add(projectId);
          }

          // Count by status
          const status = task.status || 'Pending';
          if (status === 'Completed') {
            employee.completedTasks++;
          } else if (status === 'In Progress') {
            employee.inProgressTasks++;
          } else if (status === 'Pending') {
            employee.pendingTasks++;
          } else if (status === 'To Do') {
            employee.todoTasks++;
          }

          // Check if overdue
          if (task.endDate && status !== 'Completed') {
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
          employee.projectCount = employee.projects.size;
        });

        // Update summary cards
        updateSummaryCards(employeePerformance);

        // Render performance table
        renderPerformanceTable(employeePerformance);

        // Render monthly charts
        renderMonthlyCharts(allTasks, employeePerformance);

      } catch (error) {
        console.error('Error loading performance data:', error);
        document.getElementById('performanceTableBody').innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-danger">
              <i class="fa-solid fa-exclamation-circle me-2"></i>Failed to load performance data
            </td>
          </tr>
        `;
      }
    }

    function updateSummaryCards(employeePerformance) {
      const employees = Object.values(employeePerformance);
      
      document.getElementById('totalEmployees').textContent = employees.length;
      document.getElementById('totalCompleted').textContent = employees.reduce((sum, e) => sum + e.completedTasks, 0);
      document.getElementById('totalInProgress').textContent = employees.reduce((sum, e) => sum + e.inProgressTasks, 0);
      document.getElementById('totalOverdue').textContent = employees.reduce((sum, e) => sum + e.overdueTasks, 0);
    }

    function renderPerformanceTable(employeePerformance) {
      const tbody = document.getElementById('performanceTableBody');
      
      const employees = Object.entries(employeePerformance)
        .sort((a, b) => b[1].completionRate - a[1].completionRate);

      if (employees.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-muted">
              <i class="fa-solid fa-users-slash me-2"></i>No employee performance data available
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = employees.map(([employeeId, employee]) => {
        const progressColor = employee.completionRate >= 80 ? '#28a745' : 
                             employee.completionRate >= 50 ? '#ffc107' : '#dc3545';
        const performanceLabel = employee.completionRate >= 80 ? 'Excellent' : 
                                employee.completionRate >= 50 ? 'Good' : 'Needs Improvement';
        const performanceBadgeClass = employee.completionRate >= 80 ? 'success' : 
                                      employee.completionRate >= 50 ? 'warning' : 'danger';

        return `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <img src="assests/img/profileavatar.png" alt="Avatar" 
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 10px;">
                <div>
                  <div style="font-weight: 600;">${employee.name}</div>
                  <small class="text-muted">${employee.role}</small>
                </div>
              </div>
            </td>
            <td>${employee.email}</td>
            <td><span class="badge bg-primary">${employee.projectCount}</span></td>
            <td><strong>${employee.totalTasks}</strong></td>
            <td><span class="badge bg-success">${employee.completedTasks}</span></td>
            <td><span class="badge bg-warning">${employee.inProgressTasks}</span></td>
            <td><span class="badge bg-danger">${employee.overdueTasks}</span></td>
            <td>
              <div class="d-flex align-items-center">
                <div class="progress" style="flex: 1; height: 8px; margin-right: 10px;">
                  <div class="progress-bar" style="width: ${employee.completionRate}%; background-color: ${progressColor};" 
                       role="progressbar"></div>
                </div>
                <span style="font-weight: 600; color: ${progressColor};">${employee.completionRate}%</span>
              </div>
            </td>
            <td>
              <span class="badge bg-${performanceBadgeClass}">${performanceLabel}</span>
            </td>
          </tr>
        `;
      }).join('');
    }

    function renderMonthlyCharts(allTasks, employeePerformance) {
      const chartsContainer = document.getElementById('monthlyPerformanceCharts');
      
      // Get last 6 months
      const months = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          name: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
          year: date.getFullYear(),
          month: date.getMonth(),
          startDate: new Date(date.getFullYear(), date.getMonth(), 1),
          endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
        });
      }

      // Calculate monthly statistics
      const monthlyStats = months.map(month => {
        const monthTasks = allTasks.filter(task => {
          const taskDate = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
          return taskDate >= month.startDate && taskDate <= month.endDate;
        });

        const completed = monthTasks.filter(t => t.status === 'Completed').length;
        const inProgress = monthTasks.filter(t => t.status === 'In Progress').length;
        const pending = monthTasks.filter(t => t.status === 'Pending' || t.status === 'To Do').length;

        return {
          month: month.name,
          total: monthTasks.length,
          completed,
          inProgress,
          pending
        };
      });

      // Render monthly chart
      chartsContainer.innerHTML = `
        <div class="col-12">
          <div style="overflow-x: auto;">
            <table class="table table-bordered text-center">
              <thead class="table-light">
                <tr>
                  <th>Month</th>
                  ${monthlyStats.map(stat => `<th>${stat.month}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 600;">Total Tasks</td>
                  ${monthlyStats.map(stat => `<td><strong>${stat.total}</strong></td>`).join('')}
                </tr>
                <tr>
                  <td style="font-weight: 600;">Completed</td>
                  ${monthlyStats.map(stat => `<td><span class="badge bg-success">${stat.completed}</span></td>`).join('')}
                </tr>
                <tr>
                  <td style="font-weight: 600;">In Progress</td>
                  ${monthlyStats.map(stat => `<td><span class="badge bg-warning">${stat.inProgress}</span></td>`).join('')}
                </tr>
                <tr>
                  <td style="font-weight: 600;">Pending</td>
                  ${monthlyStats.map(stat => `<td><span class="badge bg-secondary">${stat.pending}</span></td>`).join('')}
                </tr>
                <tr>
                  <td style="font-weight: 600;">Completion Rate</td>
                  ${monthlyStats.map(stat => {
                    const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                    const color = rate >= 80 ? '#28a745' : rate >= 50 ? '#ffc107' : '#dc3545';
                    return `<td><span style="color: ${color}; font-weight: 600;">${rate}%</span></td>`;
                  }).join('')}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function logoutUser() {
      localStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    }