document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authError = document.getElementById('authError');

  function showError(msg) {
    if (authError) {
      authError.textContent = msg;
      authError.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  function handleAuthSuccess(result) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    if (result.user.role === 'Admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (result.user.role === 'Equipment Owner') {
      window.location.href = 'owner-dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = loginForm.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Logging in...';

      try {
        const result = await apiCall('/auth/login', 'POST', { email, password });
        handleAuthSuccess(result);
      } catch (err) {
        showError(err.message);
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      const btn = registerForm.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Signing up...';

      try {
        const result = await apiCall('/auth/register', 'POST', { name, email, password, role });
        handleAuthSuccess(result);
      } catch (err) {
        showError(err.message);
        btn.disabled = false;
        btn.textContent = 'Sign Up';
      }
    });
  }
});
