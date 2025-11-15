const API_URL = 'http://localhost:8080/api';

/* ========== LOGIN ========== */
document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const messageEl = document.getElementById('responseMessage');
  
  const formData = new FormData(form);
  const body = {
    email: formData.get('email'),
    password: formData.get('password')
  };

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Logging in...';
  if (messageEl) {
    messageEl.className = '';
    messageEl.textContent = '';
    messageEl.style.display = 'none';
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    
    if (!res.ok) {
      showMessage(messageEl, data.error || 'Login failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
      return;
    }
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('name', data.user.name);
    
    showMessage(messageEl, 'Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      if (data.user.role === 'physician') location.href = 'triage.html';
      else location.href = 'dashboard.html';
    }, 1000);
  } catch (error) {
    showMessage(messageEl, 'Network error. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Login';
  }
});

/* ========== REGISTER ========== */
document.getElementById('registerForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const messageEl = document.getElementById('responseMessage');
  
  const formData = new FormData(form);
  const password = formData.get('password');
  
  // Validate password
  if (password.length < 6) {
    showMessage(messageEl, 'Password must be at least 6 characters long', 'error');
    return;
  }

  const body = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: password,
    role: formData.get('role') || 'patient'
  };

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Creating account...';
  if (messageEl) {
    messageEl.className = '';
    messageEl.textContent = '';
    messageEl.style.display = 'none';
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      // If response is not JSON, it's likely a 404 or server error
      if (res.status === 404) {
        showMessage(messageEl, 'Server route not found. Please make sure the server is running on http://localhost:8080', 'error');
      } else {
        showMessage(messageEl, `Server error (${res.status}). Please check if the server is running.`, 'error');
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign Up';
      return;
    }
    
    if (!res.ok) {
      const errorMsg = data.error || data.message || 'Registration failed';
      // Clean up error message to remove long URLs if present
      const cleanError = errorMsg.includes('API route not found') 
        ? 'Server route not found. Please make sure the server is running.' 
        : errorMsg;
      showMessage(messageEl, cleanError, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign Up';
      return;
    }
    
    showMessage(messageEl, 'Account created successfully! Redirecting...', 'success');
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('name', data.user.name);
    
    setTimeout(() => {
      if (data.user.role === 'physician') location.href = 'triage.html';
      else location.href = 'dashboard.html';
    }, 1000);
  } catch (error) {
    // Network error - server is likely not running
    const errorMsg = error.message.includes('Failed to fetch') || error.message.includes('NetworkError')
      ? 'Cannot connect to server. Please make sure the server is running on http://localhost:8080'
      : `Network error: ${error.message}. Please make sure the server is running on http://localhost:8080`;
    showMessage(messageEl, errorMsg, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign Up';
  }
});


/* ========== FORM TOGGLE ========== */
document.getElementById('toggleForm')?.addEventListener('click', () => {
  document.querySelector('.form-section').classList.add('hidden');
  document.getElementById('registerSection').classList.remove('hidden');
});
document.getElementById('backToLogin')?.addEventListener('click', () => {
  document.getElementById('registerSection').classList.add('hidden');
  document.querySelector('.form-section').classList.remove('hidden');
});

/* ========== HELPER FUNCTIONS ========== */
function showMessage(element, message, type = 'info') {
  if (!element) return;
  element.textContent = message;
  element.className = `show ${type}`;
  element.style.display = 'block';
  element.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
  element.style.backgroundColor = type === 'error' ? 'rgba(239, 68, 68, 0.1)' : type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)';
  element.style.border = `1px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'}`;
  element.style.padding = '1rem';
  element.style.borderRadius = '10px';
}

/* ========== DASHBOARD (PATIENT) ========== */
async function loadDashboard() {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');
  if (!token) {
    location.href = 'login.html';
    return;
  }

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.innerText = name || 'Patient';
  
  const appointmentsEl = document.getElementById('appointments');
  if (!appointmentsEl) return;

  try {
    const res = await fetch(`${API_URL}/appointments/mine`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    
    appointmentsEl.innerHTML = '';
    
    if (!data.list || data.list.length === 0) {
      appointmentsEl.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7;">No appointments yet. <a href="booking.html">Book your first appointment</a></p>';
      return;
    }
    
    data.list.forEach((a, index) => {
      const card = document.createElement('div');
      card.className = 'card slide-up appointment-card';
      card.style.animationDelay = `${index * 0.1}s`;
      const statusClass = a.status ? `status-${a.status.toLowerCase()}` : 'status-pending';
      card.innerHTML = `
        <h3>${a.specialty || 'Pending Triage'}</h3>
        <p><strong>Doctor:</strong> ${a.physicianId?.name || 'Not Assigned'}</p>
        <p><strong>Date:</strong> ${a.datetime ? new Date(a.datetime).toLocaleString() : 'To be scheduled'}</p>
        <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${a.status || 'Pending'}</span></p>
      `;
      appointmentsEl.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    appointmentsEl.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7;">Error loading appointments. Please try again later.</p>';
  }
}

/* ========== TRIAGE QUEUE ========== */
async function loadTriageQueue() {
  const token = localStorage.getItem('token');
  if (!token) {
    location.href = 'login.html';
    return;
  }

  const root = document.getElementById('queue');
  if (!root) return;

  try {
    const res = await fetch(`${API_URL}/appointments/triage-queue`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    
    root.innerHTML = '';
    
    if (!data.queue || data.queue.length === 0) {
      root.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7; grid-column: 1 / -1;">No pending triage cases.</p>';
      return;
    }
    
    data.queue.forEach((a, index) => {
      const div = document.createElement('div');
      div.className = 'card slide-up';
      div.style.animationDelay = `${index * 0.1}s`;
      div.innerHTML = `
        <h3>${a.patientId?.name || 'Unknown Patient'}</h3>
        <p><strong>Reason:</strong> ${a.reason || 'No reason provided'}</p>
        <p><strong>Date:</strong> ${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}</p>
        <button class="btn btn-primary" onclick="triage('${a._id}')">Assign Doctor</button>
      `;
      root.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading triage queue:', error);
    root.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7; grid-column: 1 / -1;">Error loading triage queue. Please try again later.</p>';
  }
}

async function triage(id) {
  const assignedSpecialty = prompt('Assign specialty (e.g., Cardiologist, Dermatologist):');
  if (!assignedSpecialty) return;
  
  const assignedPhysicianId = prompt('Physician ID (optional - leave empty if not assigning specific physician):');
  const datetime = prompt('Set date/time (YYYY-MM-DDTHH:MM) or leave empty:');
  const notes = prompt('Notes (optional):');
  
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Not authenticated. Please login again.');
    location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/appointments/triage/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ assignedSpecialty, assignedPhysicianId: assignedPhysicianId || undefined, datetime: datetime || undefined, notes: notes || undefined })
    });
    const data = await res.json();
    
    if (res.ok) {
      alert('Appointment triaged successfully!');
      loadTriageQueue();
    } else {
      alert(data.error || 'Error triaging appointment');
    }
  } catch (error) {
    console.error('Error triaging:', error);
    alert('Network error. Please try again.');
  }
}

/* ========== LOGOUT ========== */
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    location.href = 'login.html';
  }
}

// ========== THEME TOGGLE ==========
function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Update theme toggle button icon
  const themeButtons = document.querySelectorAll('.theme-toggle');
  themeButtons.forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}

// ========== MOBILE MENU TOGGLE ==========
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Load theme preference
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    const themeButtons = document.querySelectorAll('.theme-toggle');
    themeButtons.forEach(btn => {
      btn.textContent = '☀️';
      btn.title = 'Switch to Light Mode';
    });
  }
  
  // Add mobile menu toggle button
  const nav = document.querySelector('.nav, .navbar');
  if (nav && !document.querySelector('.menu-toggle')) {
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.setAttribute('aria-label', 'Toggle menu');
    menuToggle.onclick = (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    };
    const navElement = nav.querySelector('nav, ul.nav-links');
    if (navElement) {
      nav.insertBefore(menuToggle, navElement);
    } else {
      nav.appendChild(menuToggle);
    }
  }
  
  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) navLinks.classList.remove('active');
      }
    }, 250);
  });
  
  // Load dashboard if on dashboard page
  if (document.getElementById('appointments') && typeof loadDashboard === 'function') {
    loadDashboard();
  }
  
  // Load triage queue if on triage page
  if (document.getElementById('queue') && typeof loadTriageQueue === 'function') {
    loadTriageQueue();
  }
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    if (navLinks && menuToggle && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
      navLinks.classList.remove('active');
    }
  });

  // Lazy load images - fade in when loaded
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function() {
        this.classList.add('loaded');
      });
      img.addEventListener('error', function() {
        this.classList.add('loaded'); // Show even if error to avoid blank space
      });
    }
  });
});
async function loadAvailability() {
  const specialtySelect = document.getElementById('specialtySelect');
  specialtySelect?.addEventListener('change', async () => {
    const specialty = specialtySelect.value;
    const section = document.getElementById('availabilitySection');
    const slotSelect = document.getElementById('slotSelect');
    if (specialty === "Uncertain" || !specialty) {
      section.classList.add('hidden');
      return;
    }

    try {
      // Fetch available slots from backend
      const res = await fetch(`${API_URL}/availability/${specialty}`);
      
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('Error parsing availability response:', jsonError);
        if (res.status === 404) {
          console.error('Availability route not found. Please make sure the server is running.');
        }
        return;
      }

      if (!res.ok) {
        console.error('Error fetching availability:', data.error || 'Unknown error');
        return;
      }

      section.classList.remove('hidden');
      slotSelect.innerHTML = "";
      
      if (data.slots && data.slots.length > 0) {
        data.slots.forEach(slot => {
          const opt = document.createElement('option');
          opt.value = slot.datetime;
          opt.textContent = new Date(slot.datetime).toLocaleString();
          slotSelect.appendChild(opt);
        });
      } else {
        slotSelect.innerHTML = '<option value="">No available slots</option>';
      }
    } catch (error) {
      console.error('Network error fetching availability:', error);
    }
  });
}
// ==========================
// Physician Help Page Logic
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const physicianForm = document.getElementById("physicianForm");

  if (physicianForm) {
    physicianForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const patientName = document.getElementById("patientName").value.trim();
      const email = document.getElementById("email").value.trim();
      const symptoms = document.getElementById("symptoms").value.toLowerCase();
      const urgency = document.getElementById("urgency").value;

      const recommendationSection = document.getElementById("recommendationSection");
      const recommendationText = document.getElementById("recommendationText");

      let specialist = "General Physician";

      if (symptoms.includes("heart") || symptoms.includes("chest")) {
        specialist = "Cardiologist (Heart Specialist)";
      } else if (symptoms.includes("skin") || symptoms.includes("rash")) {
        specialist = "Dermatologist (Skin Specialist)";
      } else if (symptoms.includes("headache") || symptoms.includes("nerves") || symptoms.includes("dizzy")) {
        specialist = "Neurologist (Brain & Nerves)";
      } else if (symptoms.includes("pregnant") || symptoms.includes("menstrual") || symptoms.includes("women")) {
        specialist = "Gynecologist (Women’s Health)";
      } else if (symptoms.includes("child") || symptoms.includes("baby")) {
        specialist = "Pediatrician (Child Specialist)";
      } else if (symptoms.includes("cough") || symptoms.includes("flu") || symptoms.includes("fever")) {
        specialist = "General Practitioner";
      }

      // Show result on screen
      recommendationSection.style.display = "block";
      recommendationText.textContent = `Based on your symptoms, ${patientName}, you should consult a ${specialist}.`;

      // Optional: send data to backend
      try {
        const response = await fetch("/physician-help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName,
            email,
            symptoms,
            urgency,
            specialist
          }),
        });

        if (!response.ok) throw new Error("Failed to send data");
        console.log("✅ Data sent successfully");
      } catch (err) {
        console.error("❌ Error:", err);
      }

      // Clear form
      physicianForm.reset();
    });
  }
});
// --- Existing JS code above (for menu toggle, etc.) ---

// --- Booking Form Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("appointmentForm");
  if (!form) return;

  const responseMessage = document.getElementById("responseMessage");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const patientName = document.getElementById("patientName").value.trim();
    const patientEmail = document.getElementById("patientEmail").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const doctorName = document.getElementById("doctorName").value;
    const appointmentDate = document.getElementById("appointmentDate").value;

    if (!patientName || !patientEmail || !phone || !doctorName || !appointmentDate) {
      showMessage(responseMessage, "Please fill in all fields.", "error");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientEmail)) {
      showMessage(responseMessage, "Please enter a valid email address.", "error");
      return;
    }

    // Validate date is in the future
    if (new Date(appointmentDate) < new Date()) {
      showMessage(responseMessage, "Please select a future date and time.", "error");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Booking...';

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { Authorization: 'Bearer ' + token })
        },
        body: JSON.stringify({ 
          reason: `Appointment with ${doctorName}`,
          patientName,
          patientEmail,
          phone,
          doctorName,
          appointmentDate
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        // If response is not JSON, it's likely a 404 or server error
        if (res.status === 404) {
          showMessage(responseMessage, "❌ Server route not found. Please make sure the server is running on http://localhost:8080", "error");
        } else {
          showMessage(responseMessage, `❌ Server error (${res.status}). Please check if the server is running.`, "error");
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Book Appointment';
        return;
      }

      if (res.ok) {
        showMessage(responseMessage, "✅ " + (data.message || "Appointment booked successfully!"), "success");
        form.reset();
        
        // Save to localStorage as fallback
        localStorage.setItem('lastAppointment', JSON.stringify({
          patientName,
          patientEmail,
          phone,
          doctorName,
          appointmentDate
        }));

        // Redirect after 2 seconds
        setTimeout(() => {
          location.href = 'appointment.html';
        }, 2000);
      } else {
        const errorMsg = data.error || data.message || "Something went wrong";
        showMessage(responseMessage, "❌ " + errorMsg, "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Book Appointment';
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))
        ? "Cannot connect to server. Please make sure the server is running on http://localhost:8080"
        : `Network error: ${err.message}. Please check your connection.`;
      showMessage(responseMessage, "❌ " + errorMsg, "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Book Appointment';
    }
  });
});
