# Nutmeg Task Tracker - Railway Deployment Guide

This is a step-by-step guide to deploy your Nutmeg Task Tracker to Railway.

## ✅ Before You Start

Make sure you have:
- [ ] A GitHub account
- [ ] Your code pushed to a GitHub repository
- [ ] A Railway account (sign up at [railway.app](https://railway.app))

---

## 🚂 Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

---

## 📦 Step 2: Create New Project

1. On Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `nutmeg` repository
4. Click **"Deploy Now"**

Railway will create an empty project. Now let's add services!

---

## 🗄️ Step 3: Add PostgreSQL Database

1. In your project, click **"+ New"** button (top right)
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically provision a PostgreSQL database
4. Click on the **PostgreSQL** service in your project
5. Go to the **"Variables"** tab
6. **Copy these values** (you'll need them later):
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_HOST` (use the **internal** hostname)
   - `POSTGRES_DB` (usually `railway`)

> 💡 **Tip**: Keep this tab open - you'll need these values for the backend!

---

## 🔧 Step 4: Deploy Backend Service

### 4a. Add Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `nutmeg` repository again
3. Railway will start deploying - click **"Cancel Deploy"** for now
4. Name this service: **"backend"**

### 4b. Configure Backend Settings

1. Click on the **backend** service
2. Go to **"Settings"** tab
3. Find **"Root Directory"** and set it to: `backend`
4. Find **"Start Command"** and set it to: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4c. Add Environment Variables

1. Go to **"Variables"** tab
2. Click **"+ New Variable"** and add these one by one:

```
DATABASE_TYPE=postgresql
POSTGRES_USER=<copy from database variables>
POSTGRES_PASSWORD=<copy from database variables>
POSTGRES_HOST=<copy PRIVATE NETWORKING hostname from database>
POSTGRES_PORT=5432
POSTGRES_DB=railway
```

> ⚠️ **Important**: Use the **internal/private** hostname for `POSTGRES_HOST`, not the public one!

### 4d. Deploy Backend

1. Click **"Deployments"** tab
2. Click **"Deploy"** on the latest deployment
3. Wait 2-3 minutes for deployment to complete
4. You should see ✅ **"Success"**

### 4e. Get Backend URL

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. **Copy this URL** (e.g., `backend-production-abc123.up.railway.app`)
5. Test it by opening `https://YOUR-BACKEND-URL.railway.app` in a browser
   - You should see: `{"status":"Nutmeg backend running 🚀"}`

---

## 🎨 Step 5: Update Frontend Configuration

Before deploying frontend, you **MUST** update the API URL!

### On your local computer:

1. Open `d:\nutmeg\frontend\utils.js`
2. Find line 3:
   ```javascript
   const API_BASE_URL = 'http://localhost:8000';
   ```
3. Change it to your Railway backend URL:
   ```javascript
   const API_BASE_URL = 'https://backend-production-abc123.up.railway.app';
   ```
   (Replace with YOUR actual backend URL from Step 4e)

4. Save the file

5. Commit and push to GitHub:
   ```powershell
   cd d:\nutmeg
   git add frontend/utils.js
   git commit -m "Update API URL for Railway deployment"
   git push
   ```

---

## 🌐 Step 6: Deploy Frontend Service

### 6a. Add Frontend Service

1. Back in Railway, click **"+ New"** → **"GitHub Repo"**
2. Select your `nutmeg` repository
3. Click **"Cancel Deploy"**
4. Name this service: **"frontend"**

### 6b. Configure Frontend Settings

1. Click on the **frontend** service
2. Go to **"Settings"** tab
3. Find **"Root Directory"** and set it to: `frontend`
4. Find **"Dockerfile Path"** and set it to: `frontend/Dockerfile`

### 6c. Deploy Frontend

1. Click **"Deployments"** tab
2. Click **"Deploy"** 
3. Wait 2-3 minutes
4. You should see ✅ **"Success"**

### 6d. Get Frontend URL

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. **This is your app URL!** 🎉

---

## 🎉 Step 7: Test Your Deployment

1. Open your frontend URL in a browser
2. You should see the **Nutmeg Login Page**!
3. Try logging in with:
   - Email: `nikhil@nutmeg.com`
   - Password: `nutmeg123`
4. Create a test project
5. Add a test task
6. ✅ **Success!** Your app is deployed!

---

## 📊 Check Usage & Costs

1. In Railway dashboard, click your profile (top right)
2. Click **"Usage"**
3. You should see your current usage
4. **Free tier**: $5/month credit
5. **Expected usage** for this app: ~$3-4/month (well within free tier!)

---

## 🔒 Security Recommendations

After deployment, please:

1. **Change default passwords**:
   - Log in to each account
   - Go to Profile → Change Password
   - Set unique passwords

2. **Update database password** (optional but recommended):
   - In Railway, go to PostgreSQL service
   - Variables → Change `POSTGRES_PASSWORD`
   - Update backend environment variables to match

---

## ⚙️ Useful Commands

### View Logs
1. Click on any service (backend/frontend/database)
2. Go to **"Deployments"** tab
3. Click on a deployment
4. Logs appear at the bottom

### Redeploy
1. Click on the service
2. **"Deployments"** → **"Deploy Latest"**

### Update Environment Variables  
1. **"Variables"** tab → Edit or add new variables
2. Service will automatically redeploy

---

## 🆘 Troubleshooting

### Frontend shows "Cannot connect to server"
- ✅ Check backend is deployed successfully
- ✅ Verify `utils.js` has the correct Railway backend URL
- ✅ Make sure you committed and pushed the updated `utils.js`
- ✅ Redeploy frontend

### Backend deployment fails
- ✅ Check deployment logs for errors
- ✅ Verify all environment variables are set
- ✅ Make sure `POSTGRES_HOST` uses the **internal** hostname

### Database connection error
- ✅ Verify database is running (green status)
- ✅ Check environment variables match database credentials
- ✅ Use internal hostname, not public URL

### Backend returns 503 or times out
- ✅ Railway might be deploying - wait 2-3 minutes
- ✅ Check logs for startup errors
- ✅ Verify all dependencies in `requirements.txt` are correct

---

## 🎊 You're Done!

Your Nutmeg Task Tracker is now:
- ✅ Deployed to Railway
- ✅ Accessible from anywhere
- ✅ Running 24/7 with **NO SLEEP TIME**
- ✅ Free (within $5/month credit)
- ✅ Automatically deploying when you push to GitHub

**Share your URL with your team and enjoy! 🚀**

---

## 📝 Your Deployment URLs

Fill these in for reference:

- **Frontend**: `https://_____________________.up.railway.app`
- **Backend**: `https://_____________________.up.railway.app`
- **API Docs**: `https://_____________________.up.railway.app/docs`
