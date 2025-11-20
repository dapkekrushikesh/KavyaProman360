document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  const emailInput = form.email;
  const passwordInput = form.password;
  const otpInput = document.getElementById("otp");

  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const otpError = document.getElementById("otp-error");

  const otpSection = document.getElementById("otp-section");
  const loginBtn = document.getElementById("login-btn");

  let otpRequested = false;
  let userEmail = "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous error messages
    emailError.textContent = "";
    passwordError.textContent = "";
    otpError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const otp = otpInput.value.trim();

    let isValid = true;

    if (!otpRequested) {
      // STEP 1: Validate credentials and request OTP
      
      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        emailError.textContent = "Email is required.";
        isValid = false;
      } else if (!emailRegex.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        isValid = false;
      } else if (!email.toLowerCase().endsWith("@kavyainfoweb.com")) {
        emailError.textContent = "Email must end with @kavyainfoweb.com";
        isValid = false;
      }

      // Password validation
      if (!password) {
        passwordError.textContent = "Password is required.";
        isValid = false;
      } else if (password.length < 6) {
        passwordError.textContent = "Password must be at least 6 characters.";
        isValid = false;
      } else if (!/[A-Z]/.test(password)) {
        passwordError.textContent = "Password must contain at least one uppercase letter.";
        isValid = false;
      } else if (!/\d/.test(password)) {
        passwordError.textContent = "Password must contain at least one number.";
        isValid = false;
      }

      if (isValid) {
        try {
          loginBtn.disabled = true;
          loginBtn.textContent = "Sending OTP...";

          const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
          const res = await fetch(`${API_URL}/api/auth/request-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          
          if (res.ok) {
            // OTP sent successfully
            userEmail = email;
            otpRequested = true;
            
            // Show OTP section and update UI
            otpSection.style.display = "block";
            loginBtn.textContent = "Verify OTP";
            loginBtn.disabled = false;
            
            // Disable email and password fields
            emailInput.disabled = true;
            passwordInput.disabled = true;
            
            // Focus on OTP input
            otpInput.focus();
            
            alert("✅ " + data.message);
          } else {
            passwordError.textContent = data.message || "Failed to send OTP.";
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
          }
        } catch (err) {
          passwordError.textContent = "Server error. Please try again.";
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }
      }
    } else {
      // STEP 2: Verify OTP
      
      if (!otp) {
        otpError.textContent = "OTP is required.";
        isValid = false;
      } else if (!/^\d{6}$/.test(otp)) {
        otpError.textContent = "OTP must be 6 digits.";
        isValid = false;
      }

      if (isValid) {
        try {
          loginBtn.disabled = true;
          loginBtn.textContent = "Verifying...";

          const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
          const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, otp })
          });
          const data = await res.json();
          
          if (res.ok && data.token) {
            localStorage.setItem("token", data.token);
            alert("✅ Login successful!");
            window.location.href = "dashboard.html";
          } else {
            otpError.textContent = data.message || "Invalid or expired OTP.";
            loginBtn.disabled = false;
            loginBtn.textContent = "Verify OTP";
          }
        } catch (err) {
          otpError.textContent = "Server error. Please try again.";
          loginBtn.disabled = false;
          loginBtn.textContent = "Verify OTP";
        }
      }
    }
  });
});


// REGISTER FORM VALIDATION SCRIPT

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const username = document.querySelector('input[placeholder="Enter username"]');
  const email = document.querySelector('input[type="email"]');
  const role = document.querySelector('select[name="role"]');
  const password = document.querySelector('input[placeholder="Enter your password"]');
  const confirmPassword = document.querySelector('input[placeholder="Re-enter password"]');

  if (!form || !username) return; // Not on signup page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Trim inputs
    const userVal = username.value.trim();
    const emailVal = email.value.trim();
    const roleVal = role ? role.value.trim() : '';
    const passVal = password.value.trim();
    const confirmVal = confirmPassword.value.trim();

    // Validation checks
    if (!userVal || !emailVal || !roleVal || !passVal || !confirmVal) {
      alert("⚠️ Please fill in all fields!");
      return;
    }

    // Email validation (simple regex)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
      alert("📧 Invalid email address!");
      return;
    }

    // Password length check
    if (passVal.length < 6) {
      alert("🔒 Password must be at least 6 characters long!");
      return;
    }

    // Confirm password match
    if (passVal !== confirmVal) {
      alert("❌ Passwords do not match!");
      return;
    }

    try {
      const API_URL = window.API_CONFIG?.BASE_URL || 'https://kavyaproman360-backend.onrender.com';
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userVal, email: emailVal, role: roleVal, password: passVal })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        alert("✅ Registration successful! Redirecting to login...");
        form.reset();
        // Redirect to login page immediately
        window.location.href = "index.html";
      } else {
        alert("❌ " + (data.message || "Registration failed"));
      }
    } catch (err) {
      alert("Server error. Please try again.");
    }
  });
});
