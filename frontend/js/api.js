const API_URL = 'http://localhost:5000/api';

// Utility for making API requests
async function apiCall(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Something went wrong');
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth State Management
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function updateNavbar() {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;
  
  if (isLoggedIn()) {
    const user = getUser();
    const dashboardLink = user.role === 'Admin' ? 'admin-dashboard.html' : 
                          user.role === 'Equipment Owner' ? 'owner-dashboard.html' : 
                          'dashboard.html';
                          
    navLinks.innerHTML = `
      <a href="equipment.html">Browse Equipment</a>
      <a href="${dashboardLink}">Dashboard</a>
      <a href="#" onclick="logout()" class="btn btn-outline" style="padding: 0.4rem 1rem;">Logout</a>
    `;
  } else {
    navLinks.innerHTML = `
      <a href="equipment.html">Browse Equipment</a>
      <a href="login.html">Login</a>
      <a href="register.html" class="btn btn-primary" style="padding: 0.4rem 1rem;">Sign Up</a>
    `;
  }
}

// Call on load if nav exists
document.addEventListener('DOMContentLoaded', updateNavbar);

// Route Guard
(function() {
  const protectedRoutes = ['dashboard.html', 'owner-dashboard.html', 'admin-dashboard.html', 'equipment.html', 'equipment-details.html', 'comparison.html', 'bookings.html'];
  const currentPath = window.location.pathname.split('/').pop();

  if (protectedRoutes.includes(currentPath)) {
    if (!isLoggedIn()) {
      window.location.replace('login.html');
    }
  }
})();
