 // Mock Data
        const reports = [
            { date: "2025-10-10", type: "project", title: "New File Sharing Feature", user: "Joshi", status: "In Progress" },
            { date: "2025-10-12", type: "task", title: "Fix Login Issue", user: "Maria", status: "Completed" },
            { date: "2025-10-15", type: "task", title: "Testing Chat Integration", user: "Ankit", status: "Pending" },
            { date: "2025-10-16", type: "project", title: "Dashboard UI Update", user: "Priya", status: "Completed" },
            { date: "2025-10-17", type: "task", title: "Optimize API", user: "John", status: "In Progress" },
        ];

        const table = document.getElementById("reportTable");
        function renderReports() {
            const filter = document.getElementById("filterSelect").value;
            const term = document.getElementById("searchInput").value.toLowerCase();
            table.innerHTML = "";
            reports.filter(r => (filter === "all" || r.type === filter) && r.title.toLowerCase().includes(term)).forEach(r => {
                const row = document.createElement("tr");
                const badgeColor = r.status === "Completed" ? "success" : r.status === "Pending" ? "secondary" : "warning";
                row.innerHTML = `<td>${r.date}</td><td class="text-capitalize">${r.type}</td><td>${r.title}</td><td>${r.user}</td><td><span class="badge bg-${badgeColor}">${r.status}</span></td>`;
                table.appendChild(row);
            });
        }

        document.getElementById("filterSelect").addEventListener("change", renderReports);
        document.getElementById("searchInput").addEventListener("input", renderReports);

        // Charts
        new Chart(document.getElementById("tasksChart"), {
            type: "line",
            data: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ label: "Completed Tasks", data: [12, 18, 22, 30, 26, 34, 40], borderColor: "#3b3b63", backgroundColor: "rgba(59,59,99,0.2)", tension: .4, fill: true }] },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
        new Chart(document.getElementById("projectChart"), {
            type: "doughnut",
            data: { labels: ["Active", "Completed", "Pending"], datasets: [{ data: [6, 5, 3], backgroundColor: ["#0d6efd", "#198754", "#ffc107"] }] },
            options: { plugins: { legend: { position: "bottom" } } }
        });

        // Export
        document.getElementById("downloadBtn").addEventListener("click", () => { alert("Exporting reports as PDF..."); });

        renderReports();

        
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});