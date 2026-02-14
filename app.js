let currentUser = null;
let authToken = null;
let ws = null;
let selectedChatUser = null;
let typingTimeout = null;
let unreadCount = 0;

// Auth functions
function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

async function register() {
  const user = {
    name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value,
    title: document.getElementById('reg-title').value,
    company: document.getElementById('reg-company').value
  };

  if (!user.name || !user.email || !user.password) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  showLoading();
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    const data = await res.json();
    hideLoading();
    
    if (data.success) {
      showToast('Registration successful! Please login.', 'success');
      showLogin();
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    hideLoading();
    showToast('Error: ' + error.message, 'error');
  }
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      initApp();
    } else {
      alert('Email Not Found');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function logout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  if (ws) ws.close();
  document.getElementById('auth-screen').style.display = 'block';
  document.getElementById('main-screen').style.display = 'none';
}

// Auto-login if token exists
window.onload = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);
    initApp();
  }
};

// App initialization
function initApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'block';

  // Update UI with user info
  updateUserUI();

  // WebSocket connection
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register', userId: currentUser._id }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    if (msg.type === 'newMessage') {
      if (selectedChatUser && 
          (msg.data.from._id === selectedChatUser || msg.data.to._id === selectedChatUser)) {
        loadMessages(selectedChatUser);
      }
      loadConversations();
      updateMessageBadge();
    }
    
    if (msg.type === 'newStatus') {
      loadStatuses();
    }

    if (msg.type === 'userTyping') {
      showTypingIndicator(msg.data.from, msg.data.isTyping);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(() => {
      if (currentUser) initApp();
    }, 3000);
  };

  loadPosts();
  loadConversations();
  loadStatuses();
  loadSuggestions();
}

function updateUserUI() {
  const initial = currentUser.name.charAt(0).toUpperCase();
  
  // Update all avatar elements
  document.querySelectorAll('#nav-avatar, #menu-avatar, #sidebar-avatar, #post-avatar').forEach(el => {
    el.textContent = initial;
  });
  
  // Update profile info
  document.getElementById('menu-name').textContent = currentUser.name;
  document.getElementById('menu-title').textContent = currentUser.title || '';
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('sidebar-title').textContent = currentUser.title || '';
  
  // Profile section
  if (document.getElementById('profile-avatar')) {
    document.getElementById('profile-avatar').textContent = initial;
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-title').textContent = currentUser.title || '';
    document.getElementById('profile-company').textContent = currentUser.company || '';
    document.getElementById('exp-title').textContent = currentUser.title || '';
    document.getElementById('exp-company').textContent = currentUser.company || '';
  }
}

// API helper
async function apiCall(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  return response.json();
}

// Section navigation
function showSection(section) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(`${section}-section`).style.display = 'block';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  event.target.closest('.nav-link')?.classList.add('active');

  if (section === 'messages') {
    loadConversations();
  }
  if (section === 'network') {
    loadNetwork();
  }
}

// Profile dropdown
function toggleProfileMenu() {
  const menu = document.getElementById('profile-menu');
  menu.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.profile-dropdown')) {
    document.getElementById('profile-menu')?.classList.remove('show');
  }
});

// Posts
function expandPostBox() {
  document.getElementById('post-actions').style.display = 'flex';
}

async function createPost() {
  const content = document.getElementById('post-content').value;
  if (!content.trim()) return;

  showLoading();
  try {
    await apiCall('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content })
    });

    document.getElementById('post-content').value = '';
    document.getElementById('post-actions').style.display = 'none';
    hideLoading();
    showToast('Post created successfully!', 'success');
    loadPosts();
  } catch (error) {
    hideLoading();
    showToast('Error creating post: ' + error.message, 'error');
  }
}

async function loadPosts() {
  try {
    const posts = await apiCall('/api/posts');
    const container = document.getElementById('posts-container');
    
    container.innerHTML = posts.map(post => `
      <div class="post">
        <div class="post-header">
          <div class="post-avatar">${post.userId.name.charAt(0)}</div>
          <div class="post-info">
            <h3>${post.userId.name}</h3>
            <p>${post.userId.title || ''} ${post.userId.company ? '• ' + post.userId.company : ''}</p>
            <p class="muted">${formatTime(post.createdAt)}</p>
          </div>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
          <button class="${post.likes.includes(currentUser._id) ? 'liked' : ''}" 
                  onclick="likePost('${post._id}')">
            👍 Like ${post.likes.length > 0 ? '(' + post.likes.length + ')' : ''}
          </button>
          <button onclick="toggleComments('${post._id}')">
            💬 Comment ${post.comments.length > 0 ? '(' + post.comments.length + ')' : ''}
          </button>
          <button>🔄 Share</button>
        </div>
        <div id="comments-${post._id}" class="comments-section" style="display:none;">
          <div class="comments-list">
            ${post.comments.map(c => `
              <div class="comment">
                <strong>${c.userId.name}:</strong> ${c.text}
              </div>
            `).join('')}
          </div>
          <div class="comment-input">
            <input type="text" id="comment-text-${post._id}" placeholder="Write a comment...">
            <button onclick="addComment('${post._id}')">Post</button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Update posts count
    document.getElementById('posts-count').textContent = posts.filter(p => p.userId._id === currentUser._id).length;
  } catch (error) {
    console.error('Error loading posts:', error);
  }
}

async function likePost(postId) {
  try {
    await apiCall(`/api/posts/${postId}/like`, { method: 'POST' });
    loadPosts();
  } catch (error) {
    console.error('Error liking post:', error);
  }
}

function toggleComments(postId) {
  const commentsDiv = document.getElementById(`comments-${postId}`);
  commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
}

async function addComment(postId) {
  const text = document.getElementById(`comment-text-${postId}`).value;
  if (!text.trim()) return;

  try {
    await apiCall(`/api/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    loadPosts();
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

function filterPosts(filter) {
  document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  // Implement filtering logic here
  loadPosts();
}

// Messages
async function loadConversations() {
  try {
    const conversations = await apiCall('/api/conversations');
    const container = document.getElementById('chat-users');
    
    unreadCount = conversations.filter(c => c.unread).length;
    updateMessageBadge();
    
    container.innerHTML = conversations.map(conv => `
      <div class="chat-user ${conv.unread ? 'unread' : ''}" 
           onclick="selectChatUser('${conv.user._id}', '${conv.user.name}')">
        <div class="user-avatar-small">${conv.user.name.charAt(0)}</div>
        <div style="flex:1;">
          <div><strong>${conv.user.name}</strong></div>
          <div style="font-size:12px;color:var(--text-muted)">
            ${conv.lastMessage.substring(0, 30)}${conv.lastMessage.length > 30 ? '...' : ''}
          </div>
        </div>
        ${conv.unread ? '<div class="unread-badge"></div>' : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

function updateMessageBadge() {
  const badge = document.getElementById('message-badge');
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

async function selectChatUser(userId, userName) {
  selectedChatUser = userId;
  document.getElementById('chat-name').textContent = userName;
  document.getElementById('chat-status').textContent = 'Online';
  document.getElementById('chat-avatar').textContent = userName.charAt(0);
  
  document.querySelectorAll('.chat-user').forEach(el => el.classList.remove('active'));
  event.target.closest('.chat-user').classList.add('active');
  
  loadMessages(userId);
}

async function loadMessages(userId) {
  try {
    const messages = await apiCall(`/api/messages/${userId}`);
    const container = document.getElementById('messages-container');
    
    container.innerHTML = messages.map(msg => `
      <div class="message ${msg.from._id === currentUser._id ? 'sent' : ''}">
        <div class="message-sender">${msg.from.name}</div>
        <div class="message-bubble">${msg.text}</div>
        <div class="message-time">${formatTime(msg.createdAt)}</div>
      </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

function sendMessage() {
  const text = document.getElementById('message-text').value;
  if (!text.trim() || !selectedChatUser) return;

  const message = {
    from: currentUser._id,
    to: selectedChatUser,
    text
  };

  ws.send(JSON.stringify({ type: 'message', data: message }));
  document.getElementById('message-text').value = '';
}

// Enter key to send message
document.addEventListener('DOMContentLoaded', () => {
  const messageInput = document.getElementById('message-text');
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Typing indicator
    messageInput.addEventListener('input', () => {
      if (!selectedChatUser) return;
      
      ws.send(JSON.stringify({ 
        type: 'typing', 
        data: { from: currentUser._id, to: selectedChatUser, isTyping: true }
      }));

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        ws.send(JSON.stringify({ 
          type: 'typing', 
          data: { from: currentUser._id, to: selectedChatUser, isTyping: false }
        }));
      }, 1000);
    });
  }
});

function showTypingIndicator(userId, isTyping) {
  if (userId === selectedChatUser) {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.style.display = isTyping ? 'flex' : 'none';
    }
  }
}

// Status
function createStatus() {
  const text = document.getElementById('status-text').value;
  if (!text.trim()) return;

  const status = {
    userId: currentUser._id,
    text
  };

  ws.send(JSON.stringify({ type: 'status', data: status }));
  document.getElementById('status-text').value = '';
}

async function loadStatuses() {
  try {
    const statuses = await apiCall('/api/statuses');
    const container = document.getElementById('status-container');
    
    container.innerHTML = statuses.map(status => `
      <div class="status-item" onclick="viewStatus('${status._id}')">
        <div class="status-header">
          <div class="status-avatar">${status.userId.name.charAt(0)}</div>
          <strong>${status.userId.name}</strong>
        </div>
        <div>${status.text}</div>
        <div class="status-time">
          ${formatTime(status.createdAt)} • ${status.views.length} views
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading statuses:', error);
  }
}

async function viewStatus(statusId) {
  try {
    await apiCall(`/api/statuses/${statusId}/view`, { method: 'POST' });
    loadStatuses();
  } catch (error) {
    console.error('Error viewing status:', error);
  }
}

// Network
async function loadNetwork() {
  try {
    const users = await apiCall('/api/users');
    const container = document.getElementById('network-container');
    
    container.innerHTML = users.map(user => `
      <div class="network-user">
        <div class="network-user-info">
          <div class="network-avatar">${user.name.charAt(0)}</div>
          <div>
            <h3>${user.name}</h3>
            <p>${user.title || ''} ${user.company ? '• ' + user.company : ''}</p>
          </div>
        </div>
        <button onclick="connect('${user._id}')">
          <i class="fas fa-user-plus"></i> Connect
        </button>
      </div>
    `).join('');
    
    // Update connections count
    document.getElementById('connections-count').textContent = users.length;
  } catch (error) {
    console.error('Error loading network:', error);
  }
}

async function connect(userId) {
  try {
    await apiCall(`/api/connections/${userId}`, { method: 'POST' });
    showToast('Connection request sent!', 'success');
    loadNetwork();
  } catch (error) {
    console.error('Error connecting:', error);
    showToast('Failed to connect', 'error');
  }
}

function showNetworkTab(tab) {
  document.querySelectorAll('.network-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  loadNetwork();
}

// Suggestions
async function loadSuggestions() {
  try {
    const users = await apiCall('/api/users');
    const container = document.getElementById('suggestions-container');
    
    container.innerHTML = users.slice(0, 3).map(user => `
      <div class="network-user" style="margin-bottom: 15px;">
        <div class="network-user-info">
          <div class="user-avatar-small">${user.name.charAt(0)}</div>
          <div>
            <strong style="font-size: 14px;">${user.name}</strong>
            <p style="font-size: 12px; color: var(--text-muted);">${user.title || ''}</p>
          </div>
        </div>
        <button onclick="connect('${user._id}')" style="padding: 6px 12px; font-size: 12px;">
          Connect
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading suggestions:', error);
  }
}

// Search
let searchTimeout;
function handleSearch(event) {
  clearTimeout(searchTimeout);
  const query = event.target.value;
  
  if (query.length < 2) return;
  
  searchTimeout = setTimeout(async () => {
    try {
      const users = await apiCall(`/api/search?q=${encodeURIComponent(query)}`);
      console.log('Search results:', users);
      // Display search results in a dropdown
    } catch (error) {
      console.error('Error searching:', error);
    }
  }, 300);
}

// Modal functions
function showNewMessageModal() {
  document.getElementById('new-message-modal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('show');
  }
}

// Utility functions
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

// Notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  }
}

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}

// Dark mode toggle (optional feature)
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

// Online/Offline status
window.addEventListener('online', () => {
  console.log('Back online');
  if (currentUser && (!ws || ws.readyState !== WebSocket.OPEN)) {
    initApp();
  }
});

window.addEventListener('offline', () => {
  console.log('Connection lost');
});

// Prevent form submission on Enter in textareas
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA' && !e.shiftKey) {
    e.preventDefault();
  }
});
