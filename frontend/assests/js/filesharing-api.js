// File Sharing integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

let files = [];
const table = document.getElementById("fileTable");

document.addEventListener('DOMContentLoaded', function() {
  loadFilesFromBackend();
  setupEventListeners();
  setupMobileSidebar();
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
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener('input', renderFiles);
  }

  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUploadFile);
  }

  // Drag & Drop
  const dropArea = document.getElementById("dropArea");
  if (dropArea) {
    dropArea.addEventListener("click", () => document.getElementById("fileInput")?.click());
    dropArea.addEventListener("dragover", e => {
      e.preventDefault();
      dropArea.classList.add("dragover");
    });
    dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragover"));
    dropArea.addEventListener("drop", handleDropFile);
  }

  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", e => {
      Array.from(e.target.files).forEach(file => uploadFileToBackend(file));
    });
  }
}

// Load files from backend
async function loadFilesFromBackend() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/files', {
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
      files = await response.json();
      renderFiles();
    } else {
      console.error('Failed to load files');
    }
  } catch (error) {
    console.error('Error loading files:', error);
  }
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function renderFiles() {
  if (!table) return;

  table.innerHTML = "";
  const term = document.getElementById("searchInput")?.value.toLowerCase() || '';
  
  const filtered = files.filter(f => f.originalName.toLowerCase().includes(term));

  if (filtered.length === 0) {
    table.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No files found</td></tr>';
    return;
  }

  filtered.forEach((f, i) => {
    const row = document.createElement("tr");
    const userName = f.uploadedBy?.name || f.uploadedBy?.email || 'Unknown';
    const fileDate = f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'N/A';
    const fileSize = formatFileSize(f.size);
    const fileType = f.mimetype ? f.mimetype.split('/')[1].toUpperCase() : 'FILE';

    row.innerHTML = `
      <td>${f.originalName}</td>
      <td>${fileType}</td>
      <td>${fileSize}</td>
      <td>${userName}</td>
      <td>${fileDate}</td>
      <td>
        <a href="${f.path}" target="_blank" class="btn btn-sm btn-outline-primary me-1">
          <i class="fa-solid fa-eye"></i>
        </a>
        <a href="${f.path}" download class="btn btn-sm btn-outline-success me-1">
          <i class="fa-solid fa-download"></i>
        </a>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteFile('${f._id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>`;
    table.appendChild(row);
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

async function handleUploadFile(e) {
  e.preventDefault();

  const fileTitle = document.getElementById("fileTitle");
  const fileUpload = document.getElementById("fileUpload");

  if (!fileUpload || !fileUpload.files[0]) {
    alert('Please select a file');
    return;
  }

  const file = fileUpload.files[0];
  await uploadFileToBackend(file, fileTitle?.value);

  e.target.reset();
  const modal = bootstrap.Modal.getInstance(document.getElementById("uploadModal"));
  if (modal) modal.hide();
}

async function uploadFileToBackend(file, customName = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const newFile = await response.json();
      files.push(newFile);
      renderFiles();
      alert('✅ File uploaded successfully!');
    } else {
      const error = await response.json();
      alert('❌ Upload failed: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('❌ Error uploading file');
  }
}

async function handleDropFile(e) {
  e.preventDefault();
  const dropArea = document.getElementById("dropArea");
  dropArea.classList.remove("dragover");

  const droppedFiles = Array.from(e.dataTransfer.files);
  for (const file of droppedFiles) {
    await uploadFileToBackend(file);
  }
}

async function deleteFile(fileId) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      files = files.filter(f => f._id !== fileId);
      renderFiles();
      alert('✅ File deleted successfully!');
    } else {
      alert('❌ Failed to delete file');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('❌ Error deleting file');
  }
}
