// Nutmeg Task Tracker - Shared Utilities
// API Base URL
const API_BASE_URL = 'http://localhost:8000';

// Local Storage Keys
const TOKEN_KEY = 'nutmeg_token';
const USER_KEY = 'nutmeg_user';

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

    // Define colors and icons based on type for NEXUS theme
    const styles = {
        success: {
            border: 'border-green-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-green-400',
            icon: `<i data-lucide="check-circle" class="w-5 h-5 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"></i>`,
            shadow: 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]'
        },
        error: {
            border: 'border-red-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-red-400',
            icon: `<i data-lucide="alert-circle" class="w-5 h-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"></i>`,
            shadow: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]'
        },
        warning: {
            border: 'border-yellow-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-yellow-400',
            icon: `<i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"></i>`,
            shadow: 'shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]'
        },
        info: {
            border: 'border-blue-500/50',
            bg: 'bg-neutral-900/90',
            text: 'text-blue-400',
            icon: `<i data-lucide="info" class="w-5 h-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"></i>`,
            shadow: 'shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]'
        }
    };

    const style = styles[type] || styles.info;

    toast.innerHTML = `
        <div class="${style.bg} backdrop-blur-xl border ${style.border} pl-4 pr-6 py-4 rounded-xl ${style.shadow} flex items-center gap-4 min-w-[320px] max-w-md relative overflow-hidden group">
            <!-- Glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div class="flex-shrink-0">
                ${style.icon}
            </div>
            <div class="flex-1">
                <p class="font-medium text-gray-200 text-sm leading-snug">${message}</p>
            </div>
            <button onclick="this.closest('#toast-notification').remove()" class="text-gray-500 hover:text-white transition-colors flex-shrink-0 p-1 hover:bg-white/10 rounded-full">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Initialize icons for the toast
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-12', 'opacity-0');
    });

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (document.body.contains(toast)) toast.remove();
            }, 300);
        }
    }, 5000);
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    // API request wrapper will go here
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

// Initialize Lucide Icons
function initIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initIcons);
