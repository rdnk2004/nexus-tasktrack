/**
 * Nutmeg / Nexus Task Tracker - Core Client & Shared Utilities
 * Senior Architecture v5.0
 * 
 * Includes:
 * - Dynamic API Base URL Resolution
 * - Session & Token State Management
 * - Resilient Authenticated Fetch Client (401 Interception & Error Normalization)
 * - Accessible Stacked Toast Notification System
 * - Accessible Modal & Confirm Dialog Handlers
 * - Defensive Date & Time Formatting
 * - XSS HTML Sanitization & Avatar Color Generators
 */

// ============================================================================
// 1. DYNAMIC API BASE URL RESOLUTION
// ============================================================================

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

// ============================================================================
// 2. STORAGE KEYS & SESSION MANAGEMENT
// ============================================================================

const TOKEN_KEY = 'nutmeg_token';
const USER_KEY = 'nutmeg_user';

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

// ============================================================================
// 3. SECURITY & HTML SANITIZATION (Prevents Stored XSS)
// ============================================================================

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// 4. AUTHENTICATED FETCH CLIENT
// ============================================================================

async function authFetch(endpoint, options = {}) {
    const token = getToken();
    const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

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
            showToast('Session expired. Redirecting to login...', 'warning');
            removeToken();
            removeCurrentUser();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
            return null;
        }

        return response;
    } catch (error) {
        console.error(`Fetch network error on ${url}:`, error);
        throw error;
    }
}

// ============================================================================
// 5. TOAST NOTIFICATION SYSTEM (Stacked, Accessible & Smooth)
// ============================================================================

function getToastContainer() {
    let container = document.getElementById('nexus-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'nexus-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.className = 'fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'info', duration = 4000) {
    const container = getToastContainer();

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto transform translate-x-12 opacity-0 transition-all duration-300 ease-out';
    toast.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');

    const config = {
        success: {
            border: 'border-emerald-500/40',
            bg: 'bg-neutral-900/95',
            text: 'text-emerald-400',
            icon: 'check-circle',
            glow: 'shadow-[0_4px_24px_-4px_rgba(16,185,129,0.25)]'
        },
        error: {
            border: 'border-rose-500/40',
            bg: 'bg-neutral-900/95',
            text: 'text-rose-400',
            icon: 'alert-circle',
            glow: 'shadow-[0_4px_24px_-4px_rgba(244,63,94,0.25)]'
        },
        warning: {
            border: 'border-amber-500/40',
            bg: 'bg-neutral-900/95',
            text: 'text-amber-400',
            icon: 'alert-triangle',
            glow: 'shadow-[0_4px_24px_-4px_rgba(245,158,11,0.25)]'
        },
        info: {
            border: 'border-blue-500/40',
            bg: 'bg-neutral-900/95',
            text: 'text-blue-400',
            icon: 'info',
            glow: 'shadow-[0_4px_24px_-4px_rgba(59,130,246,0.25)]'
        }
    };

    const style = config[type] || config.info;

    toast.innerHTML = `
        <div class="${style.bg} backdrop-blur-xl border ${style.border} ${style.glow} p-4 rounded-xl flex items-start gap-3 relative overflow-hidden">
            <div class="flex-shrink-0 mt-0.5">
                <i data-lucide="${style.icon}" class="w-5 h-5 ${style.text}"></i>
            </div>
            <div class="flex-1 min-w-0 pr-2">
                <p class="text-sm font-medium text-gray-200 leading-snug break-words">${escapeHtml(message)}</p>
            </div>
            <button type="button" aria-label="Close notification" class="text-gray-500 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/5 flex-shrink-0">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
        toast.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.remove();
            }
        }, 250);
    };

    closeBtn.addEventListener('click', dismiss);

    let dismissTimer = setTimeout(dismiss, duration);

    // Pause on hover
    toast.addEventListener('mouseenter', () => clearTimeout(dismissTimer));
    toast.addEventListener('mouseleave', () => {
        dismissTimer = setTimeout(dismiss, duration / 2);
    });

    container.appendChild(toast);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-12', 'opacity-0');
    });
}

// ============================================================================
// 6. ACCESSIBLE CONFIRM MODAL (Keyboard Trapped & Accessible)
// ============================================================================

function showConfirm({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false
} = {}) {
    return new Promise((resolve) => {
        const existing = document.getElementById('nexus-confirm-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nexus-confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'confirm-modal-title');
        overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md opacity-0 transition-opacity duration-200';

        const modal = document.createElement('div');
        modal.className = 'bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 opacity-0 transition-all duration-200 relative';

        const accentColor = danger ? 'bg-rose-500' : 'bg-amber-500';
        const iconColor = danger ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        const iconName = danger ? 'alert-triangle' : 'help-circle';
        const confirmBtnClass = danger
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/50';

        modal.innerHTML = `
            <div class="h-1 w-full ${accentColor}"></div>
            <div class="p-6">
                <div class="flex items-start gap-4 mb-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center border ${iconColor} flex-shrink-0">
                        <i data-lucide="${iconName}" class="w-5 h-5"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 id="confirm-modal-title" class="text-lg font-bold text-white mb-1 tracking-tight">${escapeHtml(title)}</h3>
                        ${message ? `<p class="text-sm text-gray-400 leading-relaxed">${escapeHtml(message)}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="border-t border-white/5 px-6 py-4 bg-black/40 flex items-center justify-end gap-3">
                <button type="button" id="confirm-cancel-btn" class="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                    ${escapeHtml(cancelText)}
                </button>
                <button type="button" id="confirm-action-btn" class="px-5 py-2.5 rounded-xl ${confirmBtnClass} text-sm font-bold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                    ${escapeHtml(confirmText)}
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const cancelBtn = modal.querySelector('#confirm-cancel-btn');
        const actionBtn = modal.querySelector('#confirm-action-btn');

        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            modal.classList.remove('scale-95', 'opacity-0');
            actionBtn.focus();
        });

        const close = (result) => {
            overlay.classList.add('opacity-0');
            modal.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                }
            }, 200);
            document.removeEventListener('keydown', keyHandler);
            resolve(result);
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape') close(false);
            if (e.key === 'Enter' && document.activeElement !== cancelBtn) close(true);
        };

        document.addEventListener('keydown', keyHandler);
        cancelBtn.addEventListener('click', () => close(false));
        actionBtn.addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
    });
}

// ============================================================================
// 7. DEFENSIVE DATE & TIME FORMATTING HELPERS
// ============================================================================

function isValidDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (!isValidDate(date)) return '-';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getDaysUntil(dateString) {
    if (!dateString) {
        return { text: 'No deadline', color: 'text-gray-500', urgency: 'low', diffDays: null };
    }
    const deadline = new Date(dateString);
    if (!isValidDate(deadline)) {
        return { text: 'No deadline', color: 'text-gray-500', urgency: 'low', diffDays: null };
    }

    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            text: `${Math.abs(diffDays)}d overdue`,
            color: 'text-rose-400',
            urgency: 'high',
            diffDays
        };
    }
    if (diffDays === 0) {
        return { text: 'Due today', color: 'text-rose-400', urgency: 'high', diffDays: 0 };
    }
    if (diffDays === 1) {
        return { text: 'Tomorrow', color: 'text-amber-400', urgency: 'medium', diffDays: 1 };
    }
    if (diffDays <= 3) {
        return { text: `${diffDays}d left`, color: 'text-amber-400', urgency: 'medium', diffDays };
    }
    return { text: `${diffDays}d left`, color: 'text-gray-400', urgency: 'low', diffDays };
}

function getRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (!isValidDate(date)) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
}

// ============================================================================
// 8. UI & AVATAR HELPERS
// ============================================================================

function getFirstName(email) {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function getAvatarColor(email) {
    if (!email) return 'bg-neutral-800 text-gray-400 border-white/10';
    const colors = [
        'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'bg-rose-500/20 text-rose-300 border-rose-500/30',
        'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        'bg-teal-500/20 text-teal-300 border-teal-500/30',
        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function showSkeletons(containerId, count = 3, heightClass = 'h-20') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `w-full ${heightClass} rounded-xl bg-neutral-900/60 border border-white/5 animate-pulse mb-3`;
        container.appendChild(skeleton);
    }
}
