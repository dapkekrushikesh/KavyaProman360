// Project Management with File Sharing Functionality

// Global variables
let currentProject = {};
let uploadedFiles = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Project Page');
    initializeDefaultProjects();
    initializePage();
    setupEventListeners();
    renderProjectsFromStorage();
});

// Initialize default projects if localStorage is empty
function initializeDefaultProjects() {
    let projects = localStorage.getItem('projects');
    if (!projects) {
        const defaultProjects = {
            "Website Redesign": {
                title: "Website Redesign",
                assignee: "John Doe",
                desc: "Complete redesign of company website with modern UI/UX",
                assignedDate: "2024-01-15",
                date: "2024-03-30",
                tasks: 0,
                progress: 0,
                status: "In Progress",
                members: ["John Doe", "Sarah Smith"]
            },
            "Mobile App Development": {
                title: "Mobile App Development",
                assignee: "Jane Smith",
                desc: "Develop cross-platform mobile application for iOS and Android",
                assignedDate: "2024-02-01",
                date: "2024-06-15",
                tasks: 0,
                progress: 0,
                status: "In Progress",
                members: ["Jane Smith", "Mike Johnson"]
            },
            "Database Migration": {
                title: "Database Migration",
                assignee: "Mike Johnson",
                desc: "Migrate existing database to new cloud infrastructure",
                assignedDate: "2024-01-20",
                date: "2024-04-10",
                tasks: 0,
                progress: 0,
                status: "pending",
                members: ["Mike Johnson"]
            }
        };
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
        console.log('Default projects initialized');
    }
}

function initializePage() {
    // Setup mobile menu
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.project-dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.closest('.project-menu').contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
}

function setupEventListeners() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadZone && fileInput) {
        // Make sure file input is properly configured
        fileInput.style.position = 'absolute';
        fileInput.style.top = '0';
        fileInput.style.left = '0';
        fileInput.style.width = '100%';
        fileInput.style.height = '100%';
        fileInput.style.opacity = '0';
        fileInput.style.cursor = 'pointer';
        fileInput.style.zIndex = '10';
        
        console.log('Setting up file input click handlers');
        
        // Primary click handler - direct file input click
        fileInput.addEventListener('click', (e) => {
            console.log('File input directly clicked');
            e.stopPropagation();
        });
        
        // Upload zone click handler
        uploadZone.addEventListener('click', (e) => {
            console.log('Upload zone clicked, target:', e.target.tagName);
            
            // If clicked element is not the file input itself, trigger it
            if (e.target !== fileInput) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Triggering file input click...');
                
                // Create a new file input if needed
                const newInput = document.createElement('input');
                newInput.type = 'file';
                newInput.multiple = true;
                newInput.accept = '*/*';
                newInput.style.display = 'none';
                
                newInput.onchange = function(event) {
                    if (event.target.files.length > 0) {
                        handleFiles(event.target.files);
                        // Visual feedback
                        const uploadZone = document.getElementById('uploadZone');
                        if (uploadZone) {
                            const originalText = uploadZone.querySelector('p').textContent;
                            uploadZone.querySelector('p').textContent = `${event.target.files.length} file(s) selected successfully!`;
                            uploadZone.style.borderColor = '#69bd8cff';
                            uploadZone.style.backgroundColor = '#d4edda';
                            
                            setTimeout(() => {
                                uploadZone.querySelector('p').textContent = originalText;
                                uploadZone.style.borderColor = '#bdc3c7';
                                uploadZone.style.backgroundColor = 'white';
                            }, 2000);
                        }
                    }
                    document.body.removeChild(newInput);
                };
                
                document.body.appendChild(newInput);
                newInput.click();
            }
        });
        
        // Drag and drop events
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
            console.log('Drag over upload zone');
        });
        
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            console.log('Drag leave upload zone');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            console.log('Files dropped:', e.dataTransfer.files.length);
            handleFiles(e.dataTransfer.files);
        });
        
        // Original file input change handler (backup)
        fileInput.addEventListener('change', (e) => {
            console.log('Original file input changed, files selected:', e.target.files.length);
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });

        // Debug file input
        console.log('File input element:', fileInput);
        console.log('File input type:', fileInput.type);
        console.log('File input accept:', fileInput.accept);
    } else {
        console.error('Upload zone or file input not found!');
        console.log('Upload zone:', uploadZone);
        console.log('File input:', fileInput);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        const fileShareModal = document.getElementById('fileShareModal');
        const fileUploadModal = document.getElementById('fileUploadModal');
        
        if (e.target === fileShareModal) {
            closeFileShareModal();
        }
        
        if (e.target === fileUploadModal) {
            closeFileUploadModal();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFileShareModal();
            closeFileUploadModal();
        }
    });

    // Save project functionality
    const saveProjectBtn = document.getElementById('saveProject');
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', saveNewProject);
    }
}

// Project menu functions
function toggleProjectMenu(button) {
    const dropdown = button.nextElementSibling;
    const allDropdowns = document.querySelectorAll('.project-dropdown');
    
    // Close all other dropdowns
    allDropdowns.forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('show');
        }
    });
    
    // Toggle current dropdown
    dropdown.classList.toggle('show');
}

function deleteProject(event) {
    event.preventDefault();
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
        const projectCard = event.target.closest('.col-md-6, .col-lg-4');
        if (projectCard) {
            projectCard.remove();
        }
    }
    // Close dropdown
    document.querySelectorAll('.project-dropdown').forEach(d => d.classList.remove('show'));
}

// File sharing modal functions
function openFileShareModal(title, assignee, date, tasks, progress, files, members, status) {
    console.log('Opening file share modal for:', title);
    currentProject = { title, assignee, date, tasks, progress, files, members, status };
    
    // Check if modal elements exist
    const modal = document.getElementById('fileShareModal');
    if (!modal) {
        console.error('File share modal not found in DOM');
        alert('Error: File share modal not found. Please check the HTML structure.');
        return;
    }
    
    // Update modal content
    const projectTitleEl = document.getElementById('projectTitle');
    const assigneeEl = document.getElementById('assigneeLabel');
    const dateEl = document.getElementById('dateLabel');
    const tasksEl = document.getElementById('tasksLabel');
    const progressEl = document.getElementById('progressLabel');
    const filesEl = document.getElementById('filesLabel');
    const membersEl = document.getElementById('membersLabel');
    const statusBtn = document.getElementById('statusBtn');
    
    if (projectTitleEl) projectTitleEl.textContent = title;
    if (assigneeEl) assigneeEl.textContent = assignee;
    if (dateEl) dateEl.textContent = `<i class="fa-solid fa-calendar"></i> ${date}`;
    if (tasksEl) tasksEl.textContent = `${tasks} Tasks`;
    if (progressEl) progressEl.textContent = `⏱ ${progress}% Complete`;
    if (filesEl) filesEl.textContent = `${files} Files`;
    const membersText = members === 1 ? 'Member' : 'Members';
    if (membersEl) membersEl.textContent = `<i class="fa-solid fa-user"></i> ${members} ${membersText}`;
    
    if (statusBtn) {
        statusBtn.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusBtn.className = `status-btn ${status}`;
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('File share modal opened successfully');
}

function closeFileShareModal() {
    console.log('Closing file share modal');
    const modal = document.getElementById('fileShareModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

function openFileShare() {
    console.log('Opening file upload modal');
    closeFileShareModal();
    setTimeout(() => {
        const uploadModal = document.getElementById('fileUploadModal');
        const uploadTitle = document.getElementById('uploadProjectTitle');
        
        if (!uploadModal) {
            console.error('File upload modal not found');
            alert('Error: File upload modal not found. Please check the HTML structure.');
            return;
        }
        
        if (uploadTitle) {
            uploadTitle.textContent = currentProject.title || 'Project';
        }
        
        uploadModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('File upload modal opened successfully');
    }, 200);
}

function openFileShareDirectly(projectTitle) {
    console.log('Opening file upload modal directly for:', projectTitle);
    currentProject.title = projectTitle;
    
    const uploadModal = document.getElementById('fileUploadModal');
    const uploadTitle = document.getElementById('uploadProjectTitle');
    
    if (!uploadModal) {
        console.error('File upload modal not found');
        alert('Error: File upload modal not found. Please check the HTML structure.');
        return;
    }
    
    if (uploadTitle) {
        uploadTitle.textContent = projectTitle;
    }
    
    uploadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('File upload modal opened successfully for:', projectTitle);
}

function closeFileUploadModal() {
    console.log('Closing file upload modal');
    const modal = document.getElementById('fileUploadModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
    clearUploadedFiles();
}

// File upload functionality
function handleFiles(files) {
    console.log('Handling', files.length, 'files');
    Array.from(files).forEach(file => {
        if (!uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            uploadedFiles.push(file);
            displayUploadedFile(file);
            console.log('Added file:', file.name);
        }
    });
    
    // Show a message if files were added
    if (files.length > 0) {
        console.log('Total files selected:', uploadedFiles.length);
    }
}

function displayUploadedFile(file) {
    const uploadedFilesContainer = document.getElementById('uploadedFiles');
    const fileElement = document.createElement('div');
    fileElement.className = 'uploaded-file';
    
    const fileIcon = getFileIcon(file.name);
    
    fileElement.innerHTML = `
        <span class="file-icon">${fileIcon}</span>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="remove-btn" onclick="removeFile('${file.name}', this)">✕</button>
    `;
    uploadedFilesContainer.appendChild(fileElement);
    
    // Update file count display
    updateFileCountDisplay();
}

function updateFileCountDisplay() {
    const fileCountElements = document.querySelectorAll('.file-count-display');
    fileCountElements.forEach(element => {
        element.textContent = `${uploadedFiles.length} file(s) selected`;
    });
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📃',
        'xls': '📊',
        'xlsx': '📊',
        'ppt': '📋',
        'pptx': '📋',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'mp4': '🎥',
        'avi': '🎥',
        'mp3': '🎵',
        'wav': '🎵',
        'zip': '📦',
        'rar': '📦'
    };
    return iconMap[extension] || '📄';
}

function removeFile(fileName, buttonElement) {
    console.log('Removing file:', fileName);
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    buttonElement.parentElement.remove();
    updateFileCountDisplay();
    console.log('Files remaining:', uploadedFiles.length);
}

function clearUploadedFiles() {
    console.log('Clearing uploaded files');
    uploadedFiles = [];
    const uploadedFilesContainer = document.getElementById('uploadedFiles');
    if (uploadedFilesContainer) {
        uploadedFilesContainer.innerHTML = '';
    }
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function shareFiles() {
    console.log('Attempting to share files');
    console.log('Uploaded files count:', uploadedFiles.length);
    
    const selectedMembers = [];
    const memberCheckboxes = document.querySelectorAll('.member-item input[type="checkbox"]:checked');
    
    memberCheckboxes.forEach(checkbox => {
        const memberName = checkbox.parentElement.querySelector('span').textContent;
        selectedMembers.push(memberName);
    });
    
    console.log('Selected members:', selectedMembers);
    
    if (uploadedFiles.length === 0) {
        alert('Please select files to share first.');
        return;
    }
    
    if (selectedMembers.length === 0) {
        alert('Please select at least one team member to share with.');
        return;
    }
    
    // Simulate file sharing with better feedback
    const projectName = currentProject.title || 'this project';
    const fileNames = uploadedFiles.map(file => file.name).join(', ');
    
    const confirmMessage = `Share ${uploadedFiles.length} file(s) for "${projectName}"?\n\nFiles: ${fileNames}\n\nWith: ${selectedMembers.join(', ')}`;
    
    if (confirm(confirmMessage)) {
        alert(`Successfully shared ${uploadedFiles.length} file(s) for "${projectName}" with ${selectedMembers.length} team member(s)!`);
        closeFileUploadModal();
    }
}

// Add new project functionality
function saveNewProject() {
    const projectName = document.getElementById('projectName').value;
    const projectAssignee = document.getElementById('projectAssignee').value;
    const projectDesc = document.getElementById('projectDesc').value;
    const projectDeadline = document.getElementById('projectDeadline').value;
    const projectAssignedDate = document.getElementById('projectAssignedDate').value;
    
    if (!projectName.trim()) {
        alert('Please enter a project name.');
        return;
    }
    
    // Get existing projects from localStorage
    let projects = localStorage.getItem('projects');
    projects = projects ? JSON.parse(projects) : {};
    
    // Create new project object
    const newProject = {
        title: projectName,
        assignee: projectAssignee,
        desc: projectDesc,
        assignedDate: projectAssignedDate,
        date: projectDeadline,
        tasks: 0,
        progress: 0,
        status: "pending",
        members: [projectAssignee]
    };
    
    // Add to projects
    projects[projectName] = newProject;
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // Refresh the project grid
    renderProjectsFromStorage();
    
    // Clear form and close modal
    document.getElementById('projectForm').reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
    modal.hide();
    
    alert(`Project "${projectName}" has been created successfully!`);
}

// Logout function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/index.html';
    }
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const projectCards = document.querySelectorAll('.project-card');
            
            projectCards.forEach(card => {
                const projectTitle = card.querySelector('.project-title').textContent.toLowerCase();
                const assignee = card.querySelector('.info-row .label').textContent.toLowerCase();
                
                if (projectTitle.includes(searchTerm) || assignee.includes(searchTerm)) {
                    card.closest('.col-md-6, .col-lg-4').style.display = 'block';
                } else {
                    card.closest('.col-md-6, .col-lg-4').style.display = 'none';
                }
            });
        });
    }
});

function renderProjectsFromStorage() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    let projects = localStorage.getItem('projects');
    let tasks = localStorage.getItem('tasks');
    if (!projects) return;
    projects = JSON.parse(projects);
    tasks = tasks ? JSON.parse(tasks) : [];
    Object.values(projects).forEach(project => {
        const projectTasks = tasks.filter(t => t.project === project.title);
        const progress = project.progress || 0;
        const status = project.status || 'pending';
        const membersCount = project.members ? project.members.length : 1;
        const membersText = membersCount === 1 ? 'Member' : 'Members';
        const assignedDate = project.assignedDate || (projectTasks.length > 0 ? projectTasks.map(t => t.assignedDate).sort()[0] : '-');
        const dueDate = project.date || '-';
        const tasksCount = projectTasks.length;
        const tasksText = tasksCount === 1 ? 'Task' : 'Tasks';
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        
        // Create a card element using DOM instead of innerHTML to avoid escaping issues
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-6 col-lg-4';
        
        colDiv.innerHTML = `
          <div class="project-card" data-project-name="${project.title}">
            <div class="project-header">
              <h5 class="project-title">${project.title}</h5>
              <div class="project-menu">
                <button class="btn-menu"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                <div class="project-dropdown">
                  <a href="#" class="edit-project-btn"><i class="fa-solid fa-edit"></i> Edit</a>
                  <a href="#" class="delete-project-btn"><i class="fa-solid fa-trash"></i> Delete</a>
                </div>
              </div>
            </div>
            <div class="project-info">
              <div class="info-row">
                <span class="members"><i class="fa-solid fa-user"></i> ${membersCount} ${membersText}</span>
              </div>
              <div class="info-row">
                <span class="assigned-date"><i class="fa-solid fa-calendar"></i>Assigned: ${assignedDate}</span>
                
              </div>
               <div class="info-row">
                
                <span class="due-date "><i class="fa-solid fa-calendar-days"></i>Due: ${dueDate}</span>
              </div>
              <div class="info-row">
                <span class="icon"><i class="fa-solid fa-message"></i></span>
                <span class="label">${tasksCount} ${tasksText}</span>
                <span class="progress-text">⏱ ${progress}% Complete</span>
              </div>
            </div>
            <div class="project-footer">
              <span class="status-badge ${status}">${statusText}</span>
              <button class="btn-share">Share Files</button>
            </div>
          </div>
        `;
        
        // Add event listeners using proper DOM events
        const card = colDiv.querySelector('.project-card');
        const menuBtn = colDiv.querySelector('.btn-menu');
        const editBtn = colDiv.querySelector('.edit-project-btn');
        const deleteBtn = colDiv.querySelector('.delete-project-btn');
        const shareBtn = colDiv.querySelector('.btn-share');
        const dropdown = colDiv.querySelector('.project-dropdown');
        
        // Card click to go to details
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.project-menu') && !e.target.closest('.btn-share')) {
                window.location.href = `project-details.html?project=${encodeURIComponent(project.title)}`;
            }
        });
        
        // Menu button toggle
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleProjectMenu(this);
        });
        
        // Stop propagation on dropdown
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Edit button
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            editProject(e, project.title);
        });
        
        // Delete button
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deleteProject(e);
        });
        
        // Share button
        shareBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openFileShareDirectly(project.title);
        });
        
        projectsGrid.appendChild(colDiv);
    });
}

let editProjectKey = null;
function editProject(event, projectName) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  let projects = localStorage.getItem('projects');
  if (!projects) {
    return;
  }
  projects = JSON.parse(projects);
  const project = projects[projectName];
  if (!project) {
    return;
  }
  editProjectKey = projectName;
  document.getElementById('editProjectName').value = project.title;
  document.getElementById('editProjectAssignee').value = project.assignee || '';
  document.getElementById('editProjectDesc').value = project.desc || '';
  document.getElementById('editProjectAssignedDate').value = project.assignedDate ? project.assignedDate.split('T')[0] : '';
  document.getElementById('editProjectDueDate').value = project.date || '';
  document.getElementById('editProjectStatus').value = project.status || 'In Progress';
  // Members
  renderEditMembers(project.members);
  const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
  modal.show();
}
function renderEditMembers(members) {
  const membersDiv = document.getElementById('editProjectMembers');
  membersDiv.innerHTML = '';
  let memberList = Array.isArray(members) ? members : (typeof members === 'number' ? Array(members).fill('Member') : []);
  memberList.forEach((member, idx) => {
    const span = document.createElement('span');
    span.className = 'badge bg-primary';
    span.textContent = member;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger ms-1';
    removeBtn.textContent = 'x';
    removeBtn.onclick = function() {
      memberList.splice(idx, 1);
      renderEditMembers(memberList);
    };
    span.appendChild(removeBtn);
    membersDiv.appendChild(span);
  });
  // Store current members in a data attribute
  membersDiv.dataset.members = JSON.stringify(memberList);
}
document.getElementById('addMemberBtn').onclick = function() {
  const input = document.getElementById('newMemberInput');
  const name = input.value.trim();
  if (!name) return;
  let membersDiv = document.getElementById('editProjectMembers');
  let memberList = JSON.parse(membersDiv.dataset.members || '[]');
  memberList.push(name);
  renderEditMembers(memberList);
  input.value = '';
};
document.getElementById('saveProjectEditBtn').onclick = function() {
  if (!editProjectKey) return;
  let projects = localStorage.getItem('projects');
  if (!projects) return;
  projects = JSON.parse(projects);
  const project = projects[editProjectKey];
  if (!project) return;
  const newName = document.getElementById('editProjectName').value.trim();
  const newAssignee = document.getElementById('editProjectAssignee').value;
  const newDesc = document.getElementById('editProjectDesc').value;
  const newAssignedDate = document.getElementById('editProjectAssignedDate').value;
  const newDueDate = document.getElementById('editProjectDueDate').value;
  const newStatus = document.getElementById('editProjectStatus').value;
  let membersDiv = document.getElementById('editProjectMembers');
  let memberList = JSON.parse(membersDiv.dataset.members || '[]');
  
  // Calculate tasks and progress dynamically from task list
  let tasks = localStorage.getItem('tasks');
  tasks = tasks ? JSON.parse(tasks) : [];
  const projectTasks = tasks.filter(t => t.project === newName || t.project === editProjectKey);
  const taskCount = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const progressPercent = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
  
  // Update project
  project.title = newName;
  project.assignee = newAssignee;
  project.desc = newDesc;
  project.assignedDate = newAssignedDate;
  project.date = newDueDate;
  project.tasks = taskCount;
  project.progress = progressPercent;
  project.status = newStatus;
  project.members = memberList.length > 0 ? memberList : [newAssignee];
  // If project name changed, update key
  if (newName !== editProjectKey) {
    delete projects[editProjectKey];
    projects[newName] = project;
    editProjectKey = newName;
  }
  localStorage.setItem('projects', JSON.stringify(projects));
  // Refresh cards
  if (typeof renderProjectsFromStorage === 'function') renderProjectsFromStorage();
  bootstrap.Modal.getInstance(document.getElementById('editProjectModal')).hide();
};

// Make functions globally available (must be at the end after all functions are defined)
window.openFileShareModal = openFileShareModal;
window.closeFileShareModal = closeFileShareModal;
window.openFileShare = openFileShare;
window.openFileShareDirectly = openFileShareDirectly;
window.closeFileUploadModal = closeFileUploadModal;
window.toggleProjectMenu = toggleProjectMenu;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.removeFile = removeFile;
window.shareFiles = shareFiles;
window.saveNewProject = saveNewProject;
window.logoutUser = logoutUser;
window.updateFileCountDisplay = updateFileCountDisplay;
window.renderEditMembers = renderEditMembers;
window.renderProjectsFromStorage = renderProjectsFromStorage;