# 🚀 Full-Stack Deployment Guide - ProNetwork

Complete guide to deploy your professional networking platform to production.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- ✅ MongoDB Atlas is set up (already done!)
- ✅ Environment variables are configured
- ✅ Application runs locally without errors
- ✅ All dependencies are in package.json

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free & Easy)
### Option 2: Railway (Fast & Simple)
### Option 3: Heroku (Popular)
### Option 4: Vercel + Railway (Frontend + Backend)
### Option 5: DigitalOcean (Full Control)

---

## 🎯 Option 1: Render (RECOMMENDED)

**Best for:** Full-stack apps with WebSocket support
**Cost:** Free tier available
**Difficulty:** Easy

### Step 1: Prepare Your Code

1. **Create a start script** (already done in package.json)
2. **Add a render.yaml** (optional but recommended)

### Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ProNetwork"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pronetwork.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. **Go to:** https://render.com
2. **Sign up** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect your GitHub repository**
5. **Configure:**
   - **Name:** pronetwork
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

6. **Add Environment Variables:**
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production

7. **Click "Create Web Service"**

8. **Wait 5-10 minutes** for deployment

9. **Your app will be live at:** `https://pronetwork.onrender.com`

### Step 4: Configure WebSocket (Important!)

Render supports WebSocket by default, no extra configuration needed!

---

## 🚂 Option 2: Railway (FASTEST)

**Best for:** Quick deployments
**Cost:** $5/month (free trial available)
**Difficulty:** Very Easy

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy on Railway

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Click "New Project"** → **"Deploy from GitHub repo"**
4. **Select your repository**
5. **Railway auto-detects Node.js**
6. **Add Environment Variables:**
   - Click on your service
   - Go to "Variables" tab
   - Add:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `NODE_ENV=production`

7. **Click "Deploy"**

8. **Get your URL:**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Your app: `https://pronetwork.up.railway.app`

---

## 🟣 Option 3: Heroku

**Best for:** Established platform
**Cost:** $5-7/month (no free tier anymore)
**Difficulty:** Medium

### Step 1: Install Heroku CLI

```bash
brew install heroku/brew/heroku
```

### Step 2: Login and Create App

```bash
# Login
heroku login

# Create app
heroku create pronetwork-app

# Add environment variables
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_secret"
heroku config:set NODE_ENV=production
```

### Step 3: Deploy

```bash
# Push to Heroku
git push heroku main

# Open your app
heroku open
```

Your app: `https://pronetwork-app.herokuapp.com`

---

## ▲ Option 4: Vercel (Frontend) + Railway (Backend)

**Best for:** Separating frontend and backend
**Cost:** Free for frontend, $5/month for backend
**Difficulty:** Medium

### Backend on Railway:

1. Deploy backend to Railway (see Option 2)
2. Get your backend URL: `https://api.railway.app`

### Frontend on Vercel:

1. **Create `vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

2. **Update API calls in app.js:**

```javascript
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.railway.app'
  : 'http://localhost:3000';
```

3. **Deploy to Vercel:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
```

---

## 🌊 Option 5: DigitalOcean (Full Control)

**Best for:** Production apps with custom needs
**Cost:** $6/month minimum
**Difficulty:** Advanced

### Step 1: Create Droplet

1. Go to DigitalOcean
2. Create Ubuntu droplet
3. SSH into server

### Step 2: Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Step 3: Deploy App

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/pronetwork.git
cd pronetwork

# Install dependencies
npm install

# Create .env file
nano .env
# Add your environment variables

# Start with PM2
pm2 start server.js --name pronetwork
pm2 save
pm2 startup
```

### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/pronetwork
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pronetwork /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 📦 Required Files for Deployment

### 1. Update package.json

```json
{
  "name": "professional-network",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  }
}
```

### 2. Create .gitignore

```
node_modules/
.env
.DS_Store
*.log
```

### 3. Create Procfile (for Heroku)

```
web: node server.js
```

### 4. Create render.yaml (for Render)

```yaml
services:
  - type: web
    name: pronetwork
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

---

## 🔒 Security Checklist

Before deploying:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use environment variables for all secrets
- [ ] Enable CORS properly
- [ ] Add rate limiting
- [ ] Use HTTPS (SSL certificate)
- [ ] Whitelist IPs in MongoDB Atlas
- [ ] Remove console.logs in production
- [ ] Add helmet.js for security headers
- [ ] Validate all user inputs
- [ ] Set secure cookie flags

---

## 🛠️ Post-Deployment Setup

### 1. Update MongoDB Atlas

1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Add your deployment server IP or use `0.0.0.0/0` (allow all)

### 2. Update CORS (if needed)

In `server.js`, add:

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### 3. Update WebSocket URL

In `app.js`, update:

```javascript
const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = process.env.NODE_ENV === 'production'
  ? `wss://${location.host}`
  : `ws://${location.host}`;
```

---

## 📊 Monitoring & Maintenance

### Check Logs:

**Render:**
- Dashboard → Logs tab

**Railway:**
- Dashboard → Deployments → View Logs

**Heroku:**
```bash
heroku logs --tail
```

**PM2 (DigitalOcean):**
```bash
pm2 logs pronetwork
pm2 monit
```

### Update Deployment:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Auto-deploys on Render/Railway/Vercel
# For Heroku:
git push heroku main
```

---

## 🎯 Recommended: Render Deployment

**I recommend Render because:**
- ✅ Free tier available
- ✅ WebSocket support out of the box
- ✅ Auto-deploy from GitHub
- ✅ Easy environment variables
- ✅ SSL certificate included
- ✅ Good for full-stack apps

---

## 🚀 Quick Start (Render)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main

# 2. Go to render.com
# 3. New Web Service
# 4. Connect GitHub repo
# 5. Add environment variables
# 6. Deploy!

# Done! Your app is live in 10 minutes! 🎉
```

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Heroku Docs: https://devcenter.heroku.com

---

**Your app will be live at:**
- Render: `https://pronetwork.onrender.com`
- Railway: `https://pronetwork.up.railway.app`
- Heroku: `https://pronetwork-app.herokuapp.com`

🎉 **Congratulations on deploying your full-stack app!**
