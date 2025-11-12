  // Add new project dynamically
    document.getElementById("saveProject").addEventListener("click", function () {
      const name = document.getElementById("projectName").value.trim();
      const desc = document.getElementById("projectDesc").value.trim();
      const deadline = document.getElementById("projectDeadline").value;

      if (name === "") {
        alert("Please enter a project name!");
        return;
      }

      const newCard = document.createElement("div");
      newCard.classList.add("col-md-4");
      newCard.innerHTML = `
        <div class="stat-card">
          <h3>${name}</h3>
          <p>${desc || "No description provided"}</p>
          <small><strong>Deadline:</strong> ${deadline || "Not set"}</small>
        </div>`;
      document.getElementById("projectCards").appendChild(newCard);

      const modal = bootstrap.Modal.getInstance(document.getElementById("addProjectModal"));
      modal.hide();
      document.getElementById("projectForm").reset();
    });

    
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

    logoutUser = function() {
        // Clear any session data if needed
        sessionStorage.clear();
        // Redirect to login page
        window.location.href = "/index.html";   
    }