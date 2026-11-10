// BhoomiBandhu 2.0 - Universal Header Auth Integration
(function() {
  function initAuthNav() {
    const nav = document.querySelector('header nav');
    if (!nav) return;

    const token = localStorage.getItem('bb_token');
    const userRaw = localStorage.getItem('bb_user');

    // Create auth controls wrapper
    const authWrapper = document.createElement('div');
    authWrapper.className = 'bb-nav-auth-slot';
    authWrapper.style.display = 'inline-flex';
    authWrapper.style.alignItems = 'center';
    authWrapper.style.gap = '8px';
    authWrapper.style.marginLeft = '12px';

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        let dashUrl = '/dashboard/farmer';
        let roleBadge = '🌾 Farmer';
        if (user.role === 'admin') {
          dashUrl = '/dashboard/admin';
          roleBadge = '🛡️ Admin';
        } else if (user.role === 'service_provider') {
          dashUrl = '/dashboard/provider';
          roleBadge = '🚜 Provider';
        }

        const firstName = (user.full_name || 'Farmer').split(' ')[0];
        authWrapper.innerHTML = `
          <a href="${dashUrl}" style="background:#2d6a4f; color:#ffffff; padding:6px 14px; border-radius:20px; font-weight:700; font-size:0.85rem; text-decoration:none; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(45,106,79,0.3);">
            <span>${roleBadge}</span>
            <span>${firstName}'s Dashboard</span>
          </a>
          <button onclick="bbLogout()" style="background:#fee2e2; border:1px solid #fca5a5; color:#991b1b; padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.82rem; cursor:pointer;">
            Logout
          </button>
        `;
      } catch (e) {
        renderLoggedOut();
      }
    } else {
      renderLoggedOut();
    }

    function renderLoggedOut() {
      authWrapper.innerHTML = `
        <a href="login.html" style="background:#f4f0e6; border:1px solid #d5ccba; color:#1b4332; padding:6px 14px; border-radius:20px; font-weight:700; font-size:0.85rem; text-decoration:none;">
          Sign In
        </a>
        <a href="register.html" style="background:#2d6a4f; color:#ffffff; padding:6px 14px; border-radius:20px; font-weight:700; font-size:0.85rem; text-decoration:none; box-shadow:0 2px 8px rgba(45,106,79,0.3);">
          Register
        </a>
      `;
    }

    nav.appendChild(authWrapper);
  }

  window.bbLogout = function() {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      window.location.href = 'login.html';
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthNav);
  } else {
    initAuthNav();
  }
})();
