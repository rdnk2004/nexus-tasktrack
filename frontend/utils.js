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
        existingToast.remove();
    }

    // Create toast container
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out translate-x-0';

    // Define colors and icons based on type
    const styles = {
        success: {
            bg: 'bg-green-500',
            icon: '✓',
            iconBg: 'bg-green-600'
        },
        error: {
            bg: 'bg-red-500',
            icon: '✕',
            iconBg: 'bg-red-600'
        },
        warning: {
            bg: 'bg-yellow-500',
            icon: '⚠',
            iconBg: 'bg-yellow-600'
        },
        info: {
            bg: 'bg-blue-500',
            icon: 'ℹ',
            iconBg: 'bg-blue-600'
        }
    };

    const style = styles[type] || styles.info;

    toast.innerHTML = `
        <div class="${style.bg} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md">
            <div class="${style.iconBg} w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                ${style.icon}
            </div>
            <p class="flex-1 font-medium">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 transition-colors ml-2 flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
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
