// =============================
// --- Sidebar Highlight + Toggle ---
// =============================
document.addEventListener("DOMContentLoaded", function () {
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
});
 
// =============================
// --- Task Manager Logic ---
// =============================
 
// Load saved tasks
let tasks = JSON.parse(localStorage.getItem("kp_tasks_v1")) || [];
 
// If no data, add sample tasks
if (tasks.length === 0) {
  tasks = [
    {
      id: 1,
      title: "Design Homepage",
      assignee: "Maria",
      dueDate: "2025-10-20",
      priority: "high",
      status: "progress",
      comments: [{ text: "50% completed", time: new Date().toLocaleString() }],
    },
    {
      id: 2,
      title: "Fix Chat Socket Bug",
      assignee: "Joshi",
      dueDate: "2025-10-22",
      priority: "medium",
      status: "pending",
      comments: [{ text: "Not started", time: new Date().toLocaleString() }],
    },
    {
      id: 3,
      title: "Deploy v2.0",
      assignee: "Ankit",
      dueDate: "2025-10-25",
      priority: "low",
      status: "completed",
      comments: [{ text: "Deployed successfully", time: new Date().toLocaleString() }],
    },
  ];
  saveTasks();
}
 
// --- Element References ---
const taskTable = document.getElementById("taskTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
 
const allCount = document.getElementById("allCount");
const pendingCount = document.getElementById("pendingCount");
const progressCount = document.getElementById("progressCount");
const completedCount = document.getElementById("completedCount");
 
// Comment Modal Elements
const commentModalEl = document.getElementById("commentModal");
const commentModal = new bootstrap.Modal(commentModalEl);
const commentListEl = document.getElementById("commentList");
const newCommentEl = document.getElementById("newComment");
const saveCommentBtn = document.getElementById("saveCommentBtn");
let activeTaskId = null;
 
// --- Render Tasks ---
function renderTasks() {
  const filter = statusFilter.value;
  const q = searchInput.value.trim().toLowerCase();
  taskTable.innerHTML = "";
 
  const filtered = tasks.filter((t) => {
    const matchesStatus = filter === "all" || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });
 
  if (filtered.length === 0) {
    taskTable.innerHTML = `
      <tr><td colspan="7" class="text-muted text-center py-4">No tasks found.</td></tr>
    `;
  } else {
    filtered.forEach((task) => {
      const badgeClass =
        task.priority === "high"
          ? "badge bg-danger"
          : task.priority === "medium"
          ? "badge bg-warning text-dark"
          : "badge bg-success";
 
      // ✅ Dynamic action button style
      const actionBtnStyle =
        task.status === "completed"
          ? "background-color:#28a745;color:white;border:none;"
          : "background-color:white;color:#28a745;border:2px solid #28a745;";
 
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(task.title)}</td>
        <td>${escapeHtml(task.assignee)}</td>
        <td>${escapeHtml(task.dueDate || "")}</td>
        <td><span class="${badgeClass}">${task.priority.toUpperCase()}</span></td>
        <td class="text-capitalize">${escapeHtml(task.status)}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="openCommentModal(${task.id})">
            <i class="fa-regular fa-comment"></i>
          </button>
        </td>
        <td>
          <button class="btn btn-sm me-1" title="Mark Completed"
                  style="${actionBtnStyle}"
                  onclick="markCompleted(${task.id})">
            <i class="fa-solid fa-check"></i>
          </button>
        </td>
      `;
      taskTable.appendChild(row);
 
      // latest comment row
      const latestComment =
        task.comments && task.comments.length
          ? task.comments[task.comments.length - 1].text
          : "No comments yet.";
 
      const detailRow = document.createElement("tr");
      detailRow.innerHTML = `
        <td colspan="7" class="text-muted" style="font-size:14px; background:#f9f9fb;">
          <strong>Latest Comment:</strong> ${escapeHtml(latestComment)}
        </td>
      `;
      taskTable.appendChild(detailRow);
    });
  }
 
  updateCounts();
}
 
 
// --- Add New Task ---
document.getElementById("addTaskForm").addEventListener("submit", function (e) {
  e.preventDefault();
 
  const title = this.querySelector("input[placeholder='Enter task title']").value.trim();
  const assignee = this.querySelector("input[placeholder='Enter assignee name']").value.trim();
  const dueDate = this.querySelector("input[type='date']").value;
  const priority = this.querySelector("select:nth-of-type(1)").value.toLowerCase();
  const status = this.querySelector("select:nth-of-type(2)").value.toLowerCase();
 
  if (!title || !assignee) return;
 
  const id = Date.now() + Math.floor(Math.random() * 999);
  tasks.push({ id, title, assignee, dueDate, priority, status, comments: [] });
  saveTasks();
  renderTasks();
  this.reset();
 
  const modalEl = document.getElementById("addTaskModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
});
 
// --- Comment Modal ---
function openCommentModal(taskId) {
  activeTaskId = taskId;
  const task = tasks.find((t) => t.id === taskId);
  renderCommentList(task);
  newCommentEl.value = "";
  commentModal.show();
}
 
function renderCommentList(task) {
  commentListEl.innerHTML = "";
  if (!task || !task.comments || task.comments.length === 0) {
    commentListEl.innerHTML =
      '<p class="text-muted">No comments yet. Add your first update below.</p>';
    return;
  }
 
  const list = [...task.comments].reverse();
  for (const c of list) {
    const div = document.createElement("div");
    div.className = "border rounded p-2 mb-2";
    div.innerHTML = `<small class="text-muted d-block">${escapeHtml(
      c.time
    )}</small><div>${escapeHtml(c.text)}</div>`;
    commentListEl.appendChild(div);
  }
}
 
saveCommentBtn.addEventListener("click", () => {
  const text = newCommentEl.value.trim();
  if (!text) return;
  const task = tasks.find((t) => t.id === activeTaskId);
  if (!task) return;
  task.comments = task.comments || [];
  task.comments.push({ text, time: new Date().toLocaleString() });
  saveTasks();
  renderCommentList(task);
  newCommentEl.value = "";
  renderTasks();
});
 
// --- Mark Task as Completed ---
function markCompleted(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.status = "completed";
  saveTasks();
  renderTasks();
}
 
// --- Helpers ---
function saveTasks() {
  localStorage.setItem("kp_tasks_v1", JSON.stringify(tasks));
}
 
function updateCounts() {
  allCount.textContent = tasks.length;
  pendingCount.textContent = tasks.filter((t) => t.status === "pending").length;
  progressCount.textContent = tasks.filter((t) => t.status === "progress").length;
  completedCount.textContent = tasks.filter((t) => t.status === "completed").length;
}
 
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
 
// --- Filters ---
searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);
 
// --- Initial Render ---
renderTasks();
 
 