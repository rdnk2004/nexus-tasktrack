/**
 * Nutmeg Login Handler
 * Beautiful, calm authentication flow
 */

const phrases = [
    "aligning thoughts…",
    "warming up the workspace…",
    "quietly moving things forward…",
    "calm meets momentum…",
    "entering shared focus…",
    "nutmeg is listening…",
    "syncing with the team…",
    "preparing your desk…"
];

const phraseEl = document.getElementById("phrase");
const form = document.getElementById("loginForm");
const submitBtn = form.querySelector("button[type='submit']");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

let phraseIndex = 0;
let phraseInterval = null;
let isLoading = false;

// -------- PHRASE ANIMATION --------

function startPhraseLoop() {
    phraseInterval = setInterval(() => {
        phraseEl.classList.add("opacity-0");

        setTimeout(() => {
            phraseIndex = (phraseIndex + 1) % phrases.length;
            phraseEl.textContent = phrases[phraseIndex];
            phraseEl.classList.remove("opacity-0");
        }, 300);
    }, 1200);
}

function stopPhraseLoop() {
    if (phraseInterval) {
        clearInterval(phraseInterval);
        phraseInterval = null;
    }
}

// -------- UI STATES --------

function setLoading(loading) {
    isLoading = loading;
    submitBtn.disabled = loading;
    emailInput.disabled = loading;
    passwordInput.disabled = loading;

    if (loading) {
        submitBtn.innerHTML = `
            <span class="inline-block animate-pulse">entering workspace…</span>
        `;
        submitBtn.classList.add("opacity-80");
    } else {
        submitBtn.innerHTML = "Enter Workspace →";
        submitBtn.classList.remove("opacity-80");
    }
}

function showMessage(text, isError = false) {
    stopPhraseLoop();
    phraseEl.classList.remove("opacity-0");
    phraseEl.textContent = text;

    if (isError) {
        phraseEl.classList.remove("text-nutNeon");
        phraseEl.classList.add("text-red-400");
    } else {
        phraseEl.classList.remove("text-red-400");
        phraseEl.classList.add("text-nutNeon");
    }
}

function resetMessage() {
    phraseEl.classList.remove("text-red-400");
    phraseEl.classList.add("text-nutNeon");
    phraseEl.textContent = "syncing calm with momentum…";
}

// -------- LOGIN HANDLER --------

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("please fill in both fields", true);
        return;
    }

    setLoading(true);
    startPhraseLoop();

    try {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        stopPhraseLoop();

        if (!response.ok) {
            // Login failed
            setLoading(false);
            showMessage(data.detail || "something feels off…", true);

            // Shake animation on error
            form.classList.add("animate-shake");
            setTimeout(() => form.classList.remove("animate-shake"), 500);
            return;
        }

        // Success! Save token and user
        localStorage.setItem("nutmeg_token", data.access_token);
        localStorage.setItem("nutmeg_user", data.email);

        // Beautiful success state
        showMessage(`welcome back, ${data.email.split("@")[0]}…`);
        submitBtn.innerHTML = `
            <span class="inline-block">✓ entering…</span>
        `;

        // Smooth transition to workspace
        document.body.classList.add("opacity-0", "transition-opacity", "duration-500");

        setTimeout(() => {
            window.location.href = "workspace.html";
        }, 800);

    } catch (err) {
        stopPhraseLoop();
        setLoading(false);
        showMessage("could not reach the workspace…", true);
        console.error("Login error:", err);
    }
});

// -------- ON LOAD --------

// If already logged in, redirect to workspace
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("nutmeg_token");
    if (token) {
        window.location.href = "workspace.html";
    }

    // Focus email field
    emailInput.focus();
});
