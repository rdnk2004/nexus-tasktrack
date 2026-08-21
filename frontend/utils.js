// Nutmeg / Nexus Task Tracker - Shared Utilities & Core Client

// 1. Dynamic API Base URL Resolution
function resolveApiBaseUrl() {
    if (window.NUTMEG_API_URL) {
        return window.NUTMEG_API_URL.replace(/\/+$/, '');
    }
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://' + hostname + ':8000';
    }
    // In production container (Nginx reverse proxy or cloud domain)
    return origin.replace(/\/+$/, '');
}

const API_BASE_URL = resolveApiBaseUrl();

// 2. Storage Keys
const TOKEN_KEY = 'nutmeg_token';
const USER_KEY = 'nutmeg_user';

// 3. Security & HTML Sanitization (Prevents Stored XSS)
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 4. Token & Session Management
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    try {
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

function removeCurrentUser() {
    localStorage.removeItem(USER_KEY);
}

function logout() {
    removeToken();
    removeCurrentUser();
    window.location.href = 'login.html';
}

function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
    }
}

async function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Session invalid or expired');
        }

        const user = await response.json();
        setCurrentUser({ email: user.email });
        return user;
    } catch (error) {
        console.warn('Authentication check failed:', error);
        removeToken();
        removeCurrentUser();
        window.location.href = 'login.html';
        return null;
    }
}

// 5. Authenticated Fetch Client (Handles Auto 401 Interception)
async function authFetch(endpoint, options = {}) {
    const token = getToken();
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            showToast('Session expired. Please log in again.', 'warning');
            removeToken();
            removeCurrentUser();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return null;
        }

        return response;
    } catch (error) {
        console.error(`Fetch error on ${url}:`, error);
        throw error;
    }
}

// 6. Formatting & UI Helpers (DRY Across All Pages)
function getFirstName(email) {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function getAvatarColor(email) {
    if (!email) return 'bg-neutral-800 text-gray-400 border-white/10';
    const colors = [
        'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'bg-green-500/20 text-green-400 border-green-500/30',
        'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'bg-pink-500/20 text-pink-400 border-pink-500/30',
        'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'bg-teal-500/20 text-teal-400 border-teal-500/30'
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getDaysUntil(dateString) {
    if (!dateString) return { text: 'No deadline', color: 'text-gray-500', urgency: 'low' };
    const deadline = new Date(dateString);
    const now = new Date();
    const diffMs = deadline - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-400', urgency: 'high' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-red-400', urgency: 'high' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-yellow-400', urgency: 'medium' };
    if (diffDays <= 3) return { text: `${diffDays}d left`, color: 'text-yellow-400', urgency: 'medium' };
    return { text: `${diffDays}d left`, color: 'text-gray-400', urgency: 'low' };
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function showSkeletons(containerId, count = 3, heightClass = 'h-20') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton ${heightClass} rounded-xl opacity-20 mb-3`;
        container.appendChild(skeleton);
    }
}

// 7. Toast Notification System
function getIconName(type) {
    const iconMap = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    return iconMap[type] || iconMap.info;
}

function getShadowColor(type) {
    const shadowMap = {
        success: 'rgba(34,197,94,0.6)',
        error: 'rgba(239,68,68,0.6)',
        warning: 'rgba(234,179,8,0.6)',
        info: 'rgba(59,130,246,0.6)'
    };
    return shadowMap[type] || shadowMap.info;
}

function showToast(message, type = 'info') {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.style.opacity = '0';
        setTimeout(() => existingToast.remove(), 200);
    }

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed top-6 right-6 z-[100] transform transition-all duration-300 ease-out translate-x-12 opacity-0';

    const styles = {
        success: {
            border: 'border-green-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-green-400',
            shadow: 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]'
        },
        error: {
            border: 'border-red-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-red-400',
            shadow: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]'
        },
        warning: {
            border: 'border-yellow-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-yellow-400',
            shadow: 'shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]'
        },
        info: {
            border: 'border-blue-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-blue-400',
            shadow: 'shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]'
        }
    };

    const style = styles[type] || styles.info;

    const container = document.createElement('div');
    container.className = `${style.bg} backdrop-blur-xl border ${style.border} pl-4 pr-6 py-4 rounded-xl ${style.shadow} flex items-center gap-4 min-w-[320px] max-w-md relative overflow-hidden group`;

    const glowEffect = document.createElement('div');
    glowEffect.className = 'absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none';
    container.appendChild(glowEffect);

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'flex-shrink-0';
    const iconElement = document.createElement('i');
    iconElement.setAttribute('data-lucide', getIconName(type));
    iconElement.className = `w-5 h-5 ${style.text} drop-shadow-[0_0_8px_${getShadowColor(type)}]`;
    iconWrapper.appendChild(iconElement);
    container.appendChild(iconWrapper);

    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex-1';
    const messageText = document.createElement('p');
    messageText.className = 'font-medium text-gray-200 text-sm leading-snug';
    messageText.textContent = message;
    messageWrapper.appendChild(messageText);
    container.appendChild(messageWrapper);

    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-white transition-colors flex-shrink-0 p-1 hover:bg-white/10 rounded-full';
    closeButton.onclick = function () {
        const toastEl = this.closest('#toast-notification');
        if (toastEl) toastEl.remove();
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-4 h-4');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    svg.appendChild(path);
    closeButton.appendChild(svg);
    container.appendChild(closeButton);

    toast.appendChild(container);
    document.body.appendChild(toast);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-12', 'opacity-0');
    });

    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (document.body.contains(toast)) toast.remove();
            }, 300);
        }
    }, 5000);
}

// 8. Custom Confirm Dialog
function showConfirm({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
        const existing = document.getElementById('nexus-confirm-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nexus-confirm-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);opacity:0;transition:opacity 0.2s ease;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:1.25rem;box-shadow:0 0 60px -10px rgba(0,0,0,1),0 0 0 1px rgba(255,255,255,0.05);width:100%;max-width:400px;overflow:hidden;transform:translateY(20px) scale(0.97);transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s ease;opacity:0;position:relative;';

        const accentLine = document.createElement('div');
        accentLine.style.cssText = `position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right, transparent, ${danger ? 'rgba(239,68,68,0.6)' : 'rgba(234,179,8,0.5)'}, transparent);`;
        modal.appendChild(accentLine);

        const content = document.createElement('div');
        content.style.cssText = 'padding:2rem 2rem 1.5rem;';

        const iconWrap = document.createElement('div');
        iconWrap.style.cssText = `width:48px;height:48px;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;border:1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'};background:${danger ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)'};`;
        iconWrap.innerHTML = danger
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="rgba(239,68,68,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="rgba(234,179,8,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        content.appendChild(iconWrap);

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = 'font-size:1.125rem;font-weight:700;color:#fff;margin-bottom:0.5rem;letter-spacing:-0.01em;';
        content.appendChild(titleEl);

        if (message) {
            const msgEl = document.createElement('p');
            msgEl.textContent = message;
            msgEl.style.cssText = 'font-size:0.875rem;color:rgba(156,163,175,1);line-height:1.6;';
            content.appendChild(msgEl);
        }

        modal.appendChild(content);

        const divider = document.createElement('div');
        divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.07);';
        modal.appendChild(divider);

        const btnArea = document.createElement('div');
        btnArea.style.cssText = 'display:flex;gap:0.75rem;padding:1.25rem 2rem;background:rgba(0,0,0,0.2);';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = 'flex:1;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(156,163,175,1);font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.15s ease;';
        cancelBtn.onmouseenter = () => { cancelBtn.style.background = 'rgba(255,255,255,0.1)'; cancelBtn.style.color = '#fff'; };
        cancelBtn.onmouseleave = () => { cancelBtn.style.background = 'rgba(255,255,255,0.05)'; cancelBtn.style.color = 'rgba(156,163,175,1)'; };

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmText;
        const confirmColor = danger ? '#dc2626' : '#ca8a04';
        const confirmHover = danger ? '#b91c1c' : '#a16207';
        confirmBtn.style.cssText = `flex:1;padding:0.75rem 1rem;border-radius:0.75rem;border:none;background:${confirmColor};color:${danger ? '#fff' : '#000'};font-size:0.875rem;font-weight:700;cursor:pointer;transition:all 0.15s ease;letter-spacing:0.02em;`;
        confirmBtn.onmouseenter = () => { confirmBtn.style.background = confirmHover; confirmBtn.style.transform = 'scale(1.02)'; };
        confirmBtn.onmouseleave = () => { confirmBtn.style.background = confirmColor; confirmBtn.style.transform = 'scale(1)'; };

        btnArea.appendChild(cancelBtn);
        btnArea.appendChild(confirmBtn);
        modal.appendChild(btnArea);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translateY(0) scale(1)';
        });

        function close(result) {
            overlay.style.opacity = '0';
            modal.style.transform = 'translateY(10px) scale(0.97)';
            modal.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
            document.removeEventListener('keydown', keyHandler);
            resolve(result);
        }

        function keyHandler(e) {
            if (e.key === 'Escape') close(false);
            if (e.key === 'Enter') close(true);
        }

        document.addEventListener('keydown', keyHandler);
        cancelBtn.addEventListener('click', () => close(false));
        confirmBtn.addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    });
}

