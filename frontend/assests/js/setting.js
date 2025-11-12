 // Theme change interactive
  document.getElementById('themeSelect').addEventListener('change', function() {
    if(this.value === 'dark'){
      document.body.style.background = '#1e1e2d';
      document.body.style.color = '#fff';
    } else {
      document.body.style.background = 'linear-gradient(to right, #f6f7fb, #f3f4f9)';
      document.body.style.color = '#000';
    }
  });

  // Show toast message on save
  document.getElementById('saveBtn').addEventListener('click', function() {
    const toast = document.getElementById('toastMsg');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
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