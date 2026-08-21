# NEXUS Task Tracker

A modern, high-performance project & directive management platform built for agile teams. Track projects, directives, Kanban workflows, operator stats, and team activity feeds.

---

## ✨ Features

- 👤 **Operator Authentication** - Secure authentication using bcrypt + PyJWT with auto-expiring tokens.
- 📊 **Project Governance** - Individual and collaborative directives with concurrency-safe member assignments.
- 📋 **Interactive Kanban Board** - Drag-and-drop workflow status updates (`Todo`, `In Progress`, `Done`).
- 🛡️ **Defensive Security** - Complete stored XSS mitigation, parameterized SQL queries, and project RBAC validation.
- ⚡ **Optimized Data Layer** - Batch IN-clause lookups eliminating N+1 query overhead.
- 📈 **Operator Intelligence** - Real-time activity logs, personal streaks, 28-day heatmaps, and leaderboard stats.
- 🐳 **Production Docker Setup** - Hardened multi-container stack with Nginx reverse proxy, health checks, and unbuffered logging.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Python 3.11+ (for local bare-metal development)

### 2. Configure Environment
```bash
# Copy the example environment template
cp .env.example .env
```

### 3. Start with Docker Compose
```bash
# Build and run all services in the background
docker-compose up --build -d

# Verify container health status
docker-compose ps
```

### 4. Access the Application
- **Frontend App:** [http://localhost](http://localhost)
- **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠️ Technology Stack

- **Backend:** FastAPI, SQLModel, SQLAlchemy 2.0, PostgreSQL / SQLite
- **Frontend:** Vanilla JS (ES6+), Tailwind CSS, Lucide Icons, SortableJS, Flatpickr, Nexus Theme
- **Web Server & Reverse Proxy:** Nginx Alpine with Gzip compression and security headers
- **Containerization:** Docker & Docker Compose

---

## 📁 Project Structure

```
nutmeg/
├── backend/
│   ├── app/
│   │   ├── config.py         # App configuration & settings
│   │   ├── db.py             # Session engine & connection pool
│   │   ├── dependencies.py   # Auth dependencies & DB injection
│   │   ├── jwt_utils.py      # JWT token issuance & verification
│   │   └── models.py         # SQLModel database schemas & indexes
│   ├── main.py               # REST API endpoints & route handlers
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container definition with healthchecks
├── frontend/
│   ├── dashboard.html        # Main overview & activity dashboard
│   ├── projects.html         # Project management & collaborative squads
│   ├── tasks.html            # Kanban board & task directives
│   ├── profile.html          # Operator profile, streaks & leaderboard
│   ├── login.html            # Authentication portal
│   ├── utils.js              # Centralized authFetch, XSS sanitizer & helpers
│   ├── nexus-theme.js        # Dynamic UI theme & background animations
│   ├── nginx.conf            # Reverse proxy & static caching rules
│   └── Dockerfile            # Nginx alpine container
├── .env.example              # Environment variable template
├── docker-compose.yml        # Multi-container orchestration
└── README.md
```

---

## 🔧 Useful Commands

### Local Backend Development (Without Docker)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### View Docker Logs
```bash
# Stream all logs
docker-compose logs -f

# Stream backend API logs only
docker-compose logs -f backend
```

### Stop Containers
```bash
docker-compose down
```

---

## 🔒 Security Best Practices

1. Change `JWT_SECRET_KEY` in `.env` before deploying to production.
2. In production environments, set `ALLOW_MASTER_PASSWORD_LOGIN=false`.
3. Never commit `.env` files into version control.
