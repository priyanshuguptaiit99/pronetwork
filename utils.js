// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               'info-circle';
  
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Loading Spinner
function showLoading() {
  document.getElementById('loading-spinner').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-spinner').style.display = 'none';
}

// Modal Functions
function showPostJobModal() {
  document.getElementById('post-job-modal').classList.add('show');
}

function showImageModal() {
  document.getElementById('image-preview-modal').classList.add('show');
}

// Dark Mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'success');
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) toggle.checked = true;
}

// Enhanced Section Navigation
function showSection(section) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(`${section}-section`).style.display = 'block';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-section') === section) {
      link.classList.add('active');
    }
  });

  // Load section-specific data
  if (section === 'messages') {
    loadConversations();
  } else if (section === 'network') {
    loadNetwork();
  } else if (section === 'notifications') {
    loadNotifications();
  } else if (section === 'jobs') {
    loadJobs();
  }
}

// Notifications
async function loadNotifications() {
  try {
    const notifications = await apiCall('/api/notifications');
    const container = document.getElementById('notifications-list');
    
    if (notifications.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-muted);">No notifications yet</p>';
      return;
    }
    
    container.innerHTML = notifications.map(notif => `
      <div class="notification-item ${notif.read ? '' : 'unread'}">
        <div class="notif-avatar">${notif.fromUser.name.charAt(0)}</div>
        <div class="notif-content">
          <p><strong>${notif.fromUser.name}</strong> ${notif.text}</p>
          <span class="muted">${formatTime(notif.createdAt)}</span>
        </div>
      </div>
    `).join('');
    
    // Update badge
    const unreadCount = notifications.filter(n => !n.read).length;
    updateNotificationBadge(unreadCount);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

// Jobs
function loadJobs() {
  // Placeholder for jobs loading
  showToast('Jobs section loaded', 'info');
}

// Image Upload
document.addEventListener('DOMContentLoaded', () => {
  const imageUpload = document.getElementById('image-upload');
  if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast('Image selected: ' + file.name, 'success');
        // Handle image upload here
      }
    });
  }
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      modal.classList.remove('show');
    });
  }
});

// Online Status
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
  showToast('You are back online', 'success');
});

window.addEventListener('offline', () => {
  isOnline = false;
  showToast('You are offline', 'error');
});

// Auto-save drafts
let draftTimeout;
function saveDraft(content, type) {
  clearTimeout(draftTimeout);
  draftTimeout = setTimeout(() => {
    localStorage.setItem(`draft_${type}`, content);
  }, 1000);
}

// Load drafts
function loadDraft(type) {
  return localStorage.getItem(`draft_${type}`) || '';
}

// Clear draft
function clearDraft(type) {
  localStorage.removeItem(`draft_${type}`);
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// Share functionality
function sharePost(postId) {
  if (navigator.share) {
    navigator.share({
      title: 'Check out this post',
      url: `${window.location.origin}/post/${postId}`
    }).then(() => {
      showToast('Post shared successfully', 'success');
    }).catch(() => {
      showToast('Share cancelled', 'info');
    });
  } else {
    copyToClipboard(`${window.location.origin}/post/${postId}`);
  }
}

// Export functions for use in other files
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showPostJobModal = showPostJobModal;
window.showImageModal = showImageModal;
window.toggleDarkMode = toggleDarkMode;
window.loadNotifications = loadNotifications;
window.sharePost = sharePost;
