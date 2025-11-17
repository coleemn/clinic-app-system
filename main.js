const SUPABASE_URL = 'https://gjomgbwbqfbngozolede.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqb21nYndicWZibmdvem9sZWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTc0MzEsImV4cCI6MjA3NjA5MzQzMX0.KIeCSgZ5-E2x_gV4Scv7_vFFmMx-_vudvlyN4CW4hes';

// Initialize Supabase client
// Using the Supabase JS client library
let supabase = null;

function initSupabase() {
  try {
    // Check if Supabase is loaded via CDN
    // The CDN script exposes window.supabase.createClient
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase client initialized');
      return true;
    }
    
    console.warn('⚠️ Supabase not loaded yet, will retry on DOMContentLoaded');
    return false;
  } catch (e) {
    console.error('❌ Error initializing Supabase:', e);
    return false;
  }
}

// Try to initialize immediately
initSupabase();

// Also try when DOM is ready (in case script loads after this file)
document.addEventListener('DOMContentLoaded', () => {
  if (!supabase) {
    initSupabase();
  }
});

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
    if (!supabase) {
      showMessage(messageEl, 'Supabase client not initialized. Please refresh the page.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
      return;
    }

    // Use Supabase Auth for login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (authError) {
      showMessage(messageEl, authError.message || 'Login failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
      return;
    }

    // Get user profile from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', body.email)
      .single();

    if (userError || !userData) {
      showMessage(messageEl, 'User profile not found', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
      return;
    }

    // Store auth session and user data with verification for mobile
    try {
      if (authData.session) {
        // Set Supabase session first
        await supabase.auth.setSession(authData.session);
        
        // Store in localStorage
        localStorage.setItem('token', authData.session.access_token);
        localStorage.setItem('refresh_token', authData.session.refresh_token);
        localStorage.setItem('session', JSON.stringify(authData.session));
        
        // Verify localStorage write on mobile
        const tokenCheck = localStorage.getItem('token');
        if (!tokenCheck) {
          throw new Error('Failed to save session. Please try again.');
        }
      }
      
      localStorage.setItem('role', userData.role || 'patient');
      localStorage.setItem('name', userData.name || authData.user.email);
      localStorage.setItem('email', authData.user.email);
      localStorage.setItem('user_id', authData.user.id);
      
      // Verify email was saved
      const emailCheck = localStorage.getItem('email');
      if (!emailCheck) {
        throw new Error('Failed to save user data. Please try again.');
      }
      
      showMessage(messageEl, 'Login successful! Redirecting to dashboard...', 'success');
      
      // Ensure localStorage is committed before redirect (important for mobile)
      // Use requestAnimationFrame and longer delay for mobile browsers
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify token exists before redirecting
      const finalTokenCheck = localStorage.getItem('token');
      if (finalTokenCheck) {
        // Always redirect to dashboard after login
        location.href = 'dashboard.html';
      } else {
        throw new Error('Session not saved. Please try logging in again.');
      }
    } catch (storageError) {
      console.error('Storage error:', storageError);
      showMessage(messageEl, storageError.message || 'Failed to save session. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
    }
  } catch (error) {
    showMessage(messageEl, error.message || 'Network error. Please try again.', 'error');
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
    if (!supabase) {
      showMessage(messageEl, 'Supabase client not initialized. Please refresh the page.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign Up';
      return;
    }

    // Use Supabase Auth for registration
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
          role: body.role || 'patient'
        }
      }
    });

    if (authError) {
      showMessage(messageEl, authError.message || 'Registration failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign Up';
      return;
    }

    // Create user profile in users table (optional - auth user is already created)
    let userData;
    const { data: insertedUser, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: body.email,
        name: body.name,
        role: body.role || 'patient'
      }])
      .select()
      .single();

    if (userError) {
      // If user already exists in auth but not in users table, try to get it
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', body.email)
        .single();
      
      if (existingUser) {
        userData = existingUser;
      } else {
        // If users table has password column (shouldn't exist), skip it and proceed with auth user
        if (userError.message && userError.message.includes('password')) {
          console.warn('Users table has password column - should remove it. Password is handled by Supabase Auth.');
          // Create a minimal userData object from auth user
          userData = {
            id: authData.user.id,
            email: body.email,
            name: body.name,
            role: body.role || 'patient'
          };
        } else {
          // Other errors - show message but still allow login with auth user
          console.warn('Could not create user profile:', userError.message);
          // Create minimal userData from auth user
          userData = {
            id: authData.user.id,
            email: body.email,
            name: body.name,
            role: body.role || 'patient'
          };
        }
      }
    } else {
      userData = insertedUser;
    }

    // Account created successfully - redirect to login page
    showMessage(messageEl, 'Account created successfully! Redirecting to login...', 'success');
    
    // Clear any existing session (user should log in manually)
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      localStorage.removeItem('user_id');
      
      // Ensure localStorage is committed before redirect (important for mobile)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirect to login page after a short delay
      location.href = 'login.html';
    } catch (storageError) {
      console.error('Storage error:', storageError);
      // Redirect anyway after delay
      setTimeout(() => {
        location.href = 'login.html';
      }, 1500);
    }
  } catch (error) {
    showMessage(messageEl, error.message || 'Registration failed. Please try again.', 'error');
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
  // Wait for Supabase to be initialized
  if (!supabase) {
    await new Promise(resolve => {
      const checkSupabase = setInterval(() => {
        if (supabase) {
          clearInterval(checkSupabase);
          resolve();
        }
      }, 100);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkSupabase);
        resolve();
      }, 5000);
    });
  }

  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');
  
  if (!token) {
    location.href = 'login.html';
    return;
  }

  if (!supabase) {
    console.error('Supabase client not initialized');
    const appointmentsEl = document.getElementById('appointments');
    if (appointmentsEl) {
      appointmentsEl.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7;">Error: Supabase not loaded. Please refresh the page.</p>';
    }
    return;
  }

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.innerText = name || 'Patient';
  
  const appointmentsEl = document.getElementById('appointments');
  if (!appointmentsEl) {
    console.warn('Appointments element not found');
    return;
  }

  try {
    // Set auth session for Supabase client if available
    const sessionStr = localStorage.getItem('session');
    if (token && sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession(session);
        if (sessionError) {
          console.warn('Session error:', sessionError);
          // If session is invalid, try to refresh
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshData.session) {
              localStorage.setItem('token', refreshData.session.access_token);
              localStorage.setItem('session', JSON.stringify(refreshData.session));
              await supabase.auth.setSession(refreshData.session);
            }
          }
        } else if (sessionData.session) {
          // Ensure session is properly stored
          localStorage.setItem('token', sessionData.session.access_token);
          localStorage.setItem('session', JSON.stringify(sessionData.session));
        }
      } catch (e) {
        console.warn('Could not restore session:', e);
      }
    }

    // Wait a bit for session to be properly established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get user email - try multiple sources with retries
    let userEmail = localStorage.getItem('email');
    
    if (!userEmail) {
      // Try to get from Supabase auth with retries
      for (let i = 0; i < 3; i++) {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (user && user.email) {
            userEmail = user.email;
            localStorage.setItem('email', user.email);
            console.log('Retrieved email from Supabase auth:', userEmail);
            break;
          } else if (userError) {
            console.warn(`Error getting user (attempt ${i + 1}):`, userError);
            if (i < 2) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        } catch (e) {
          console.warn(`Error getting user email (attempt ${i + 1}):`, e);
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
    }

    // If still no email, check if we can get it from the current auth user
    if (!userEmail) {
      try {
        const currentUser = supabase.auth.user;
        if (currentUser && currentUser.email) {
          userEmail = currentUser.email;
          localStorage.setItem('email', userEmail);
          console.log('Retrieved email from current auth user:', userEmail);
        }
      } catch (e) {
        console.warn('Could not get email from auth user:', e);
      }
    }

    if (!userEmail) {
      console.error('Could not retrieve user email');
      appointmentsEl.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7;">Error: Could not identify user. Please <a href="login.html">log out and log back in</a>.</p>';
      return;
    }

    console.log('Loading appointments for:', userEmail);
    
    // Query appointments directly from Supabase with retry logic
    let data, error;
    for (let i = 0; i < 2; i++) {
      const result = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_email', userEmail)
        .order('appointment_date', { ascending: true });
      
      data = result.data;
      error = result.error;
      
      if (!error) {
        break;
      }
      
      if (error && i < 1) {
        console.warn(`Query error (attempt ${i + 1}), retrying...`, error);
        // Wait and retry after refreshing session
        await new Promise(resolve => setTimeout(resolve, 300));
        // Refresh session
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          } catch (e) {
            console.warn('Could not refresh session:', e);
          }
        }
      }
    }
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    appointmentsEl.innerHTML = '';
    
    if (!data || data.length === 0) {
      appointmentsEl.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7;">No appointments yet. <a href="booking.html">Book your first appointment</a></p>';
      return;
    }

    console.log('Loaded appointments:', data.length);
    
    data.forEach((a, index) => {
      const card = document.createElement('div');
      card.className = 'card slide-up appointment-card';
      card.style.animationDelay = `${index * 0.1}s`;
      const statusClass = a.status ? `status-${a.status.toLowerCase()}` : 'status-pending';
      card.innerHTML = `
        <h3>${a.specialty || a.reason || 'Pending Triage'}</h3>
        <p><strong>Doctor:</strong> ${a.doctor_name || 'Not Assigned'}</p>
        <p><strong>Date:</strong> ${a.appointment_date ? new Date(a.appointment_date).toLocaleString() : 'To be scheduled'}</p>
        <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${a.status || 'Pending'}</span></p>
        ${a.notes ? `<p><strong>Notes:</strong> ${a.notes}</p>` : ''}
      `;
      appointmentsEl.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    const errorMsg = error.message || 'Unknown error';
    appointmentsEl.innerHTML = `<p style="text-align: center; color: #ef4444; opacity: 0.9;">Error loading appointments: ${errorMsg}. Please try refreshing the page.</p>`;
  }
}

async function getCurrentUserEmail() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem('email', user.email);
      return user.email;
    }
  } catch (e) {
    console.error('Error getting user email:', e);
  }
  return null;
}

/* ========== TRIAGE QUEUE ========== */
async function loadTriageQueue() {
  const token = localStorage.getItem('token');
  if (!token || !supabase) {
    if (!token) location.href = 'login.html';
    return;
  }

  const root = document.getElementById('queue');
  if (!root) return;

  try {
    // Set auth session for Supabase client if available
    const sessionStr = localStorage.getItem('session');
    if (token && sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        await supabase.auth.setSession(session);
      } catch (e) {
        console.warn('Could not restore session, using token only');
      }
    }
    
    // Query pending appointments directly from Supabase
    // Get appointments with status 'Pending' or without doctor_name
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'Pending')
      .order('appointment_date', { ascending: true });
    
    if (error) throw error;
    
    root.innerHTML = '';
    
    if (!data || data.length === 0) {
      root.innerHTML = '<p style="text-align: center; color: var(--text-color); opacity: 0.7; grid-column: 1 / -1;">No pending triage cases.</p>';
      return;
    }
    
    data.forEach((a, index) => {
      const div = document.createElement('div');
      div.className = 'card slide-up';
      div.style.animationDelay = `${index * 0.1}s`;
      div.innerHTML = `
        <h3>${a.patient_name || 'Unknown Patient'}</h3>
        <p><strong>Email:</strong> ${a.patient_email || 'N/A'}</p>
        <p><strong>Reason:</strong> ${a.reason || 'No reason provided'}</p>
        <p><strong>Phone:</strong> ${a.phone || 'N/A'}</p>
        <p><strong>Date:</strong> ${a.created_at ? new Date(a.created_at).toLocaleDateString() : (a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'N/A')}</p>
        <button class="btn btn-primary" onclick="triage('${a.id}')">Assign Doctor</button>
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
  
  const assignedPhysicianId = prompt('Physician Name (optional - leave empty if not assigning specific physician):');
  const datetime = prompt('Set date/time (YYYY-MM-DDTHH:MM) or leave empty:');
  const notes = prompt('Notes (optional):');
  
  const token = localStorage.getItem('token');
  if (!token || !supabase) {
    alert('Not authenticated. Please login again.');
    location.href = 'login.html';
    return;
  }

  try {
    // Set auth session for Supabase client if available
    const sessionStr = localStorage.getItem('session');
    if (token && sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        await supabase.auth.setSession(session);
      } catch (e) {
        console.warn('Could not restore session, using token only');
      }
    }
    
    // Update appointment directly in Supabase
    const updateData = {
      specialty: assignedSpecialty,
      status: 'Scheduled',
      notes: notes || null,
    };
    
    if (assignedPhysicianId) {
      updateData.doctor_name = assignedPhysicianId;
    }
    
    if (datetime) {
      updateData.appointment_date = datetime;
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    alert('Appointment triaged successfully!');
    loadTriageQueue();
  } catch (error) {
    console.error('Error triaging:', error);
    alert('Error triaging appointment: ' + (error.message || 'Unknown error'));
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
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const themeButtons = document.querySelectorAll('.theme-toggle');
    themeButtons.forEach(btn => {
      btn.textContent = '☀️';
      btn.title = 'Switch to Light Mode';
    });
  } else {
    // Ensure light mode is applied (remove dark class if present)
    document.body.classList.remove('dark');
    const themeButtons = document.querySelectorAll('.theme-toggle');
    themeButtons.forEach(btn => {
      btn.textContent = '🌙';
      btn.title = 'Switch to Dark Mode';
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

  // Add smooth page transitions to navigation links
  const navLinks = document.querySelectorAll('.nav-links a:not([href^="#"])');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Only add transition if it's an internal link and not the same page
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const targetPage = href.split('/').pop();
        
        // Don't add transition if clicking on the same page
        if (currentPage !== targetPage && !this.classList.contains('logout-btn')) {
          e.preventDefault();
          
          // Add fade-out effect
          document.body.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
          document.body.style.opacity = '0';
          document.body.style.transform = 'translateY(-8px)';
          
          // Navigate after fade-out
          setTimeout(() => {
            window.location.href = href;
          }, 250);
        }
      }
    });
  });
  
  // Handle logo clicks for smooth transitions (make logo clickable)
  const logoElements = document.querySelectorAll('.logo:not(a)');
  logoElements.forEach(logo => {
    if (!logo.closest('a')) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', function() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage !== 'index.html') {
          document.body.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
          document.body.style.opacity = '0';
          document.body.style.transform = 'translateY(-8px)';
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 250);
        }
      });
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
      // Generate availability slots on the frontend
      // In a real app, you could query Supabase for actual doctor availability
      const slots = generateAvailabilitySlots(specialty);
      
      section.classList.remove('hidden');
      slotSelect.innerHTML = "";
      
      if (slots && slots.length > 0) {
        slots.forEach(slot => {
          const opt = document.createElement('option');
          opt.value = slot.datetime;
          opt.textContent = new Date(slot.datetime).toLocaleString();
          slotSelect.appendChild(opt);
        });
      } else {
        slotSelect.innerHTML = '<option value="">No available slots</option>';
      }
    } catch (error) {
      console.error('Error generating availability:', error);
    }
  });
}

function generateAvailabilitySlots(specialty) {
  // Generate mock availability slots for the next 7 days
  const slots = [];
  const now = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    
    // Generate 4 time slots per day (9 AM, 11 AM, 2 PM, 4 PM)
    const timeSlots = ['09:00', '11:00', '14:00', '16:00'];
    
    timeSlots.forEach(time => {
      const slotDateTime = new Date(date);
      const [hours, minutes] = time.split(':');
      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Only add future slots
      if (slotDateTime > now) {
        slots.push({
          datetime: slotDateTime.toISOString(),
          specialty: specialty,
          available: true
        });
      }
    });
  }
  
  return slots;
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
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("appointmentForm");
  if (!form) return;

  // Pre-fill email if user is logged in
  const patientEmailInput = document.getElementById("patientEmail");
  if (patientEmailInput) {
    // Wait a bit for localStorage and Supabase to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let userEmail = localStorage.getItem('email');
    
    if (!userEmail && supabase) {
      // Try to get from Supabase auth
      try {
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          await supabase.auth.setSession(session);
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          userEmail = user.email;
          localStorage.setItem('email', user.email);
        }
      } catch (e) {
        console.warn('Could not get user email for pre-fill:', e);
      }
    }
    
    if (userEmail && !patientEmailInput.value) {
      patientEmailInput.value = userEmail;
    }
    
    // Pre-fill name if available
    const patientNameInput = document.getElementById("patientName");
    if (patientNameInput) {
      const userName = localStorage.getItem('name');
      if (userName && !patientNameInput.value) {
        patientNameInput.value = userName;
      }
    }
  }

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
      if (!supabase) {
        showMessage(responseMessage, "❌ Supabase client not initialized. Please refresh the page.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Book Appointment';
        return;
      }

      const token = localStorage.getItem('token');
      
      // Set auth session if available
      const sessionStr = localStorage.getItem('session');
      if (token && sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          await supabase.auth.setSession(session);
        } catch (e) {
          console.warn('Could not restore session, using token only');
        }
      }

      // Get logged-in user's email if available (use this to ensure consistency)
      let loggedInEmail = localStorage.getItem('email');
      if (!loggedInEmail && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email) {
            loggedInEmail = user.email;
            localStorage.setItem('email', loggedInEmail);
          }
        } catch (e) {
          console.warn('Could not get logged-in user email:', e);
        }
      }
      
      // Use logged-in email if available, otherwise use form email
      const emailToUse = loggedInEmail || patientEmail;
      
      // Insert appointment directly into Supabase
      const appointmentData = {
        patient_name: patientName,
        patient_email: emailToUse, // Use logged-in email for consistency
        appointment_date: appointmentDate,
        phone: phone || null,
        reason: `Appointment with ${doctorName}`,
        status: 'Pending',
        doctor_name: doctorName || null,
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        // If doctor_name column doesn't exist, retry without it
        if (error.message && (error.message.includes('doctor_name') || (error.message.includes('column') && error.message.includes('doctor')))) {
          delete appointmentData.doctor_name;
          const { data: retryData, error: retryError } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()
            .single();
          
          if (retryError) throw retryError;
          
          showMessage(responseMessage, "✅ Appointment booked successfully!", "success");
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
          throw error;
        }
      } else {
        showMessage(responseMessage, "✅ Appointment booked successfully!", "success");
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
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err.message || "Something went wrong. Please try again.";
      showMessage(responseMessage, "❌ " + errorMsg, "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Book Appointment';
    }
  });
});

