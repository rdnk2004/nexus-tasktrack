# Nexus Task Tracker

A modern, lightweight project management tool built for small teams. Track projects, tasks, and team activity with ease.

## ✨ Features

- 👤 **User Authentication** - Secure login with JWT tokens
- 📊 **Project Management** - Create and track up to 2 active projects per user
- ✅ **Task Tracking** - Organize tasks with priorities and status updates
- 📈 **Activity Logs** - Real-time activity feed for team collaboration
- 🎨 **Clean UI** - Modern, responsive design
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## 🚀 Quick Start

### Local Development

1. **Prerequisites**
   - Docker Desktop installed and running
   - Git

2. **Clone and Run**
   ```powershell
   # Clone the repository
   git clone https://github.com/YOUR_USERNAME/nutmeg-tasktracker.git
   cd nutmeg

   # Start all services
   docker-compose up -d

   # Check services are running
   docker-compose ps
   ```

3. **Access the App**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python) + SQLModel + PostgreSQL
- **Frontend:** HTML/CSS/JavaScript + Nginx
- **Authentication:** JWT with bcrypt password hashing
- **Database:** PostgreSQL
- **Deployment:** Docker + Railway

## 📁 Project Structure

```
nutmeg/
├── backend/               # FastAPI backend
│   ├── app/               # Application modules
│   │   ├── models.py      # Database models
│   │   ├── security.py    # Password hashing
│   │   ├── db.py          # Database connection
│   │   └── config.py      # Configuration
│   ├── main.py            # Main application file
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Backend container
├── frontend/              # Static frontend
│   ├── *.html             # HTML pages
│   ├── *.js               # JavaScript files
│   ├── *.css              # Stylesheets
│   ├── nginx.conf         # Nginx configuration
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Local development setup
└── RAILWAY_DEPLOYMENT.md  # Deployment guide
```

## 🔧 Development

### Stop Services
```powershell
docker-compose down
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Rebuild After Changes
```powershell
# Rebuild specific service
docker-compose build backend
docker-compose up -d

# Rebuild all
docker-compose build
docker-compose up -d
```

## 🌐 Network Access

### Access from Another Device (Same Wi-Fi)

1. Find your IP address:
   ```powershell
   ipconfig
   ```

2. Update `frontend/utils.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000';
   ```

3. Rebuild frontend:
   ```powershell
   docker-compose build frontend
   docker-compose up -d
   ```

4. Open Windows Firewall ports:
   ```powershell
   New-NetFirewallRule -DisplayName "Docker Frontend" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Docker Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```

5. Access from other devices at: `http://YOUR_IP_ADDRESS`

## 🔒 Security Notes

- Default passwords are for **local development only**
- Always change passwords after first login
- Never commit `.env` files to Git
- Use strong passwords in production
- Railway deployment uses secure environment variables

## 📝 License

This project is for educational and personal use.

## 🤝 Contributing

Built for a small team of 4 users. Feel free to fork and customize!

---

**Need Help?** Check out the [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md) or review logs with `docker-compose logs -f`
