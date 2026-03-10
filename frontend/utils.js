// Nutmeg Task Tracker - Shared Utilities
// API Base URL - Can be overridden by setting window.NUTMEG_API_URL in production
// For Render deployment, set this in an inline script in your HTML files
const API_BASE_URL = window.NUTMEG_API_URL || 'http://localhost:8000';

// Local Storage Keys
const TOKEN_KEY = 'nutmeg_token';
const USER_KEY = 'nutmeg_user';

// Toast Notification System - Helper Functions
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

// Toast Notification System
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.style.opacity = '0';
        setTimeout(() => existingToast.remove(), 200);
    }

    // Create toast container
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

// ============================================================
// Custom Confirm Dialog (replaces browser confirm())
// Usage: const confirmed = await showConfirm({ title, message, confirmText, cancelText, danger })
// ============================================================
function showConfirm({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
        // Remove any existing confirm dialog
        const existing = document.getElementById('nexus-confirm-overlay');
        if (existing) existing.remove();

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'nexus-confirm-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);opacity:0;transition:opacity 0.2s ease;';

        // Modal box
        const modal = document.createElement('div');
        modal.style.cssText = 'background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:1.25rem;box-shadow:0 0 60px -10px rgba(0,0,0,1),0 0 0 1px rgba(255,255,255,0.05);width:100%;max-width:400px;overflow:hidden;transform:translateY(20px) scale(0.97);transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s ease;opacity:0;position:relative;';

        // Top accent line
        const accentLine = document.createElement('div');
        accentLine.style.cssText = `position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right, transparent, ${danger ? 'rgba(239,68,68,0.6)' : 'rgba(234,179,8,0.5)'}, transparent);`;
        modal.appendChild(accentLine);

        // Content area
        const content = document.createElement('div');
        content.style.cssText = 'padding:2rem 2rem 1.5rem;';

        // Icon
        const iconWrap = document.createElement('div');
        iconWrap.style.cssText = `width:48px;height:48px;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;border:1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'};background:${danger ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)'};`;
        iconWrap.innerHTML = danger
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="rgba(239,68,68,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="rgba(234,179,8,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        content.appendChild(iconWrap);

        // Title
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = 'font-size:1.125rem;font-weight:700;color:#fff;margin-bottom:0.5rem;letter-spacing:-0.01em;';
        content.appendChild(titleEl);

        // Message
        if (message) {
            const msgEl = document.createElement('p');
            msgEl.textContent = message;
            msgEl.style.cssText = 'font-size:0.875rem;color:rgba(156,163,175,1);line-height:1.6;';
            content.appendChild(msgEl);
        }

        modal.appendChild(content);

        // Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.07);';
        modal.appendChild(divider);

        // Buttons area
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

        // Animate in
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

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
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
