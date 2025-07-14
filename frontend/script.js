const api = "http://127.0.0.1:5000/generate";
const user = document.getElementById("user");
const go = document.getElementById("go");
const res = document.getElementById("result");
const out = document.getElementById("output");
const cpy = document.getElementById("copy");
const download = document.getElementById("download");
const preview = document.getElementById("preview");

// Tab functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Update active tab button
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update active tab pane
    tabPanes.forEach(pane => pane.classList.remove('active'));
    const targetPane = document.getElementById(`${targetTab}-tab`);
    if (targetPane) {
      targetPane.classList.add('active');
    }
    
    // Update preview when switching to preview tab
    if (targetTab === 'preview' && out && out.value) {
      updatePreview();
    }
  });
});

// Generate README functionality
go.onclick = async () => {
  if (!user.value.trim()) {
    showNotification("Please enter a GitHub username", "warning");
    user.focus();
    return;
  }
  
  setLoadingState(true);
  
  try {
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.value.trim() })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    out.value = data.readme;
    updatePreview();
    res.hidden = false;
    
    // Scroll to results
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Show success with generation time if available
    const successMsg = data.generation_time 
      ? `README generated in ${data.generation_time}s! 🎉`
      : "README generated successfully! 🎉";
    showNotification(successMsg, "success");
    
  } catch (error) {
    console.error('Generation error:', error);
    showNotification(`Error: ${error.message}`, "error");
  }
  
  setLoadingState(false);
};

// Copy functionality
cpy.onclick = async () => {
  if (!out.value) {
    showNotification("No content to copy", "warning");
    return;
  }
  
  try {
    await navigator.clipboard.writeText(out.value);
    
    const originalText = cpy.querySelector('.copy-text')?.textContent || "Copy";
    const originalIcon = cpy.querySelector('.copy-icon')?.textContent || "📋";
    
    if (cpy.querySelector('.copy-text')) {
      cpy.querySelector('.copy-text').textContent = "Copied!";
    }
    if (cpy.querySelector('.copy-icon')) {
      cpy.querySelector('.copy-icon').textContent = "✅";
    }
    cpy.style.background = "#3fb950"; // Success green
    
    setTimeout(() => {
      if (cpy.querySelector('.copy-text')) {
        cpy.querySelector('.copy-text').textContent = originalText;
      }
      if (cpy.querySelector('.copy-icon')) {
        cpy.querySelector('.copy-icon').textContent = originalIcon;
      }
      cpy.style.background = ""; // Reset to CSS default
    }, 2000);
    
    showNotification("Copied to clipboard!", "success");
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = out.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification("Copied to clipboard!", "success");
    } catch (fallbackError) {
      showNotification("Failed to copy to clipboard", "error");
    }
  }
};

// Download functionality
download.onclick = () => {
  if (!out.value) {
    showNotification("No content to download", "warning");
    return;
  }
  
  try {
    const blob = new Blob([out.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.value || 'profile'}-README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("README.md downloaded!", "success");
  } catch (error) {
    showNotification("Failed to download file", "error");
  }
};

// Enter key support
user.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !go.disabled) {
    go.click();
  }
});

// Loading state management
function setLoadingState(loading) {
  go.disabled = loading;
  
  const btnText = go.querySelector('.btn-text');
  const btnIcon = go.querySelector('.btn-icon');
  
  if (loading) {
    if (btnText) btnText.textContent = "Generating...";
    if (btnIcon) btnIcon.textContent = "⏳";
    go.style.background = "#656d76"; // Muted color
    go.style.cursor = "not-allowed";
  } else {
    if (btnText) btnText.textContent = "Generate README";
    if (btnIcon) btnIcon.textContent = "✨";
    go.style.background = ""; // Reset to CSS default
    go.style.cursor = "pointer";
  }
}

// Update markdown preview
function updatePreview() {
  if (!preview || !out.value) return;
  
  // Check if marked.js is available
  if (typeof marked !== 'undefined') {
    try {
      preview.innerHTML = marked.parse(out.value);
    } catch (error) {
      console.error('Markdown parsing error:', error);
      preview.innerHTML = `<pre style="white-space: pre-wrap; color: #f0f6fc;">${escapeHtml(out.value)}</pre>`;
    }
  } else {
    // Fallback: show as preformatted text
    preview.innerHTML = `<pre style="white-space: pre-wrap; color: #f0f6fc; line-height: 1.6;">${escapeHtml(out.value)}</pre>`;
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;">&times;</button>
  `;
  
  // Add notification styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '500',
    zIndex: '1000',
    display: 'flex',
    alignItems: 'center',
    maxWidth: '400px',
    boxShadow: '0 16px 32px 0 rgba(1, 4, 9, 0.85)',
    animation: 'slideIn 0.3s ease-out'
  });
  
  // Set background color based on type
  const colors = {
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    info: '#58a6ff'
  };
  notification.style.background = colors[type] || colors.info;
  
  // Add animation keyframes if not exists
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Initialize app
function init() {
  // Focus on username input
  if (user) {
    user.focus();
  }
  
  // Check if all required elements exist
  const requiredElements = ['user', 'go', 'result', 'output'];
  const missing = requiredElements.filter(id => !document.getElementById(id));
  
  if (missing.length > 0) {
    console.warn('Missing required elements:', missing);
  }
  
  // Test API connection
  fetch(api.replace('/generate', '/health'))
    .then(response => response.json())
    .then(data => {
      console.log('✅ API connection successful:', data);
    })
    .catch(error => {
      console.warn('⚠️ API connection failed:', error.message);
      showNotification('API connection failed. Please check if the backend is running.', 'warning');
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}