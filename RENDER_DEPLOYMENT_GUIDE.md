# Render Deployment Checklist for Nutmeg

## ✅ Pre-Deployment Preparation (COMPLETED)

- [x] **Backend build script created** (`backend/render_build.sh`)
- [x] **Database URL support added** - Backend now supports Render's `DATABASE_URL` env var
- [x] **Frontend API URL made configurable** - Can switch between local and production
- [x] **.gitignore configured** - Secrets and .env files properly excluded

---

## 📝 What You Need to Do Next

### **Step 1: Push to GitHub**
```bash
# Review your changes
git status

# Stage all changes
git add .

# Commit with a meaningful message
git commit -m "Prepare for Render deployment: add build scripts and env config"

# Push to GitHub
git push origin main
```

### **Step 2: Deploy PostgreSQL Database on Render**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - Name: `nutmeg-db`
   - Database: `nutmeg_db`
   - User: `nutmeg_user`
   - Region: Choose closest to you
   - Plan: **Free**
4. **COPY the "Internal Database URL"** after creation (you'll need this!)

### **Step 3: Deploy Backend API**
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `nutmeg-backend`
   - **Region**: SAME as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Python 3**
   - **Build Command**: `chmod +x render_build.sh && ./render_build.sh`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**

4. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable"
   
   - **DATABASE_URL**: Paste the Internal Database URL from Step 2
   - **JWT_SECRET_KEY**: Generate a strong random string (use https://randomkeygen.com/)
   - **JWT_ALGORITHM**: `HS256`
   - **JWT_EXPIRATION_MINUTES**: `1440`

5. Click **"Create Web Service"** and wait for deployment
6. **COPY YOUR BACKEND URL** (e.g., `https://nutmeg-backend-xxxx.onrender.com`)

### **Step 4: Update Frontend with Backend URL**
You need to update your frontend HTML files to use the production backend URL.

**IMPORTANT**: Do this AFTER you have your backend URL from Step 3!

In **EACH** of these HTML files:
- `login.html`
- `tasks.html`
- Any other HTML files that make API calls

Add this script **RIGHT BEFORE** the `</head>` closing tag:

```html
<!-- Production API Configuration -->
<script>
  window.NUTMEG_API_URL = 'https://your-actual-backend-url.onrender.com';
</script>
```

Replace `https://your-actual-backend-url.onrender.com` with your ACTUAL backend URL from Step 3.

**Then commit and push these changes:**
```bash
git add frontend/*.html
git commit -m "Configure frontend to use production backend URL"
git push origin main
```

### **Step 5: Update Backend CORS**
Your backend needs to allow requests from your frontend domain.

In `backend/main.py` around line 35, you have:
```python
allow_origins=["*"],
```

This is fine for now (allows all origins), but for production security, you should update it to:
```python
allow_origins=[
    "http://localhost:80",  # Local development
    "https://nutmeg-frontend-xxxx.onrender.com",  # Your actual frontend URL
    "https://nutmeg-frontend.onrender.com",  # Alternative URL pattern
],
```

**You can do this later** once you have your frontend URL.

### **Step 6: Deploy Frontend**
1. Click **"New +"** → **"Web Service"**
2. Connect your repository again
3. Configure:
   - **Name**: `nutmeg-frontend`
   - **Region**: SAME as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: **Docker**
   - **Plan**: **Free**

4. Click **"Create Web Service"**
5. **COPY YOUR FRONTEND URL** (e.g., `https://nutmeg-frontend-xxxx.onrender.com`)

---

## 🎉 Testing Your Deployment

1. Visit your frontend URL: `https://nutmeg-frontend-xxxx.onrender.com`
2. Try logging in with one of your test users:
   - Email: `nikhil@nutmeg.com`
   - Password: `nutmeg123`
3. Test creating a project, adding tasks, etc.

---

## ⚠️ Important Notes

### **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Database has 1GB storage limit

### **Security Reminders:**
- ❌ NEVER commit `.env` files
- ✅ Always use environment variables for secrets
- ✅ Generate NEW production secrets (don't reuse local ones)
- ✅ Keep your GitHub repository private if it contains sensitive business logic

### **Troubleshooting:**
- If backend fails to start: Check the **Logs** tab in Render dashboard
- If frontend can't connect: Verify `window.NUTMEG_API_URL` is set correctly
- If database connection fails: Ensure you copied the **Internal Database URL** (not public)

---

## 📚 Files Modified for Deployment

1. **`backend/render_build.sh`** - New file: Build script for Render
2. **`backend/app/config.py`** - Updated to support `DATABASE_URL` env var
3. **`frontend/utils.js`** - Made API URL configurable for production
4. **`frontend/RENDER_CONFIG.html`** - Reference guide for frontend configuration

---

**You're all set!** Follow the steps above and your Nutmeg app will be live on Render.
