/**
 * Nutmeg API Utilities
 * Shared helpers for authentication and API calls
 */

const API_BASE = "http://127.0.0.1:8000";

// -------- TOKEN MANAGEMENT --------

function getToken() {
    return localStorage.getItem("nutmeg_token");
}

function saveToken(token) {
    localStorage.setItem("nutmeg_token", token);
}

function clearToken() {
    localStorage.removeItem("nutmeg_token");
    localStorage.removeItem("nutmeg_user");
}

function saveUser(email) {
    localStorage.setItem("nutmeg_user", email);
}

function getCurrentUser() {
    return localStorage.getItem("nutmeg_user");
}

function isAuthenticated() {
    return !!getToken();
}

// -------- LOGOUT --------

function logout() {
    clearToken();
    window.location.href = "index.html";
}

// -------- AUTH CHECK --------

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = "index.html";
        return false;
    }
    return true;
}

// -------- API HELPERS --------

async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        clearToken();
        window.location.href = "index.html";
        throw new Error("Session expired");
    }

    return response;
}

async function apiGet(endpoint) {
    const response = await apiRequest(endpoint);
    return response.json();
}

async function apiPost(endpoint, data) {
    const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return response.json();
}

async function apiPut(endpoint, data) {
    const response = await apiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data)
    });
    return response.json();
}

async function apiDelete(endpoint) {
    const response = await apiRequest(endpoint, {
        method: "DELETE"
    });
    return response.json();
}

// -------- USER DISPLAY --------

function getDisplayName(email) {
    if (!email) return "guest";
    return email.split("@")[0];
}

function getInitials(email) {
    if (!email) return "?";
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase();
}
