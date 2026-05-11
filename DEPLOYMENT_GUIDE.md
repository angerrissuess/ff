# 🚀 Complete Deployment Guide

## Prerequisites Checklist

- [ ] GitHub account with repository access
- [ ] Render.com account (free tier available)
- [ ] Gemini API Key from https://ai.studio/
- [ ] Node.js 18+ installed locally
- [ ] Git installed

---

## Step 1: Local Testing (Critical!)

### 1.1 Verify Build Works Locally
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build for production
npm run build

# Test production build locally
NODE_ENV=production npm run start
```

Visit `http://localhost:3000` - app should load without errors.

### 1.2 Verify API Endpoints
```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}

# Music API
curl http://localhost:3000/api/music
# Expected: Array of audio files or []
```

### 1.3 Verify Environment Setup
```bash
# Check if .env.local exists
cat .env.local
# Should contain: GEMINI_API_KEY=your_key
```

⚠️ **If local build fails, deployment will also fail!**

---

## Step 2: Prepare GitHub Repository

### 2.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit - security hardened & production ready"
```

### 2.2 Update .gitignore
✅ Already includes `.env.local`, `.env`, and `node_modules`

### 2.3 Verify Sensitive Files NOT in Git
```bash
# Check what will be committed
git status

# These should NOT appear:
# - .env
# - .env.local
# - .env.production
# - GEMINI_API_KEY anywhere
```

### 2.4 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USER/sityarch.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Render

### 3.1 Connect Render to GitHub

1. Go to https://render.com
2. Sign up / Log in
3. Click "GitHub" to connect your account
4. Authorize Render to access your repositories
5. Select your `sityarch` repository

### 3.2 Create Web Service

**Click "New" → "Web Service"**

Fill in:
- **Name**: `sityarch` (or your preferred name)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Node Version**: `18`

### 3.3 Add Environment Variables

⚠️ **CRITICAL STEP - Do NOT skip!**

In the "Environment" section, add:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3000` | Server port |
| `GEMINI_API_KEY` | Your actual key | **KEEP SECRET!** |
| `CORS_ORIGIN` | *leave blank initially* | Will be auto-filled |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 minutes |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests per window |

### 3.4 Deploy Settings

- **Plan**: Free tier is fine (within limits)
- **Auto-deploy**: Enable for auto-redeploy on git push
- **Health Check**: Leave default

**Click "Create Web Service"**

---

## Step 4: Monitor First Deployment

### 4.1 Watch Build Logs

1. Go to Render dashboard
2. Click on your service
3. Watch "Build" logs for errors
4. Watch "Logs" for runtime output

Expected output:
```
✅ NEURAL_ARCHITECT Server running on http://localhost:3000
📍 Environment: production
🔒 Security: Helmet + CORS + Rate-Limiting enabled
```

### 4.2 Wait for Deployment

- Initial build: 2-5 minutes
- Deployment: 1-2 minutes
- Total: ~5-10 minutes

### 4.3 Access Your App

Once deployed, your URL will be:
```
https://sityarch.onrender.com
```

Or get it from Render dashboard → Settings → URL

### 4.4 Test Health Endpoint

```bash
curl https://sityarch.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"2026-05-10T..."}
```

---

## Step 5: Update CORS Setting

### 5.1 Get Your Render URL

From Render dashboard:
- Service: `sityarch`
- Settings → URL (e.g., `https://sityarch.onrender.com`)

### 5.2 Update Environment Variables

In Render dashboard → Environment:

Update `CORS_ORIGIN` to: `https://sityarch.onrender.com`

**Save** - This will trigger a redeployment.

---

## Step 6: Verify Production Deployment

### 6.1 Test Frontend
```bash
# Visit your app
https://sityarch.onrender.com

# Should load the desktop environment
# Terminal, music player, code editor should be visible
```

### 6.2 Test APIs
```bash
# Music API
curl https://sityarch.onrender.com/api/music

# Health endpoint
curl https://sityarch.onrender.com/health
```

### 6.3 Test Error Handling

Try invalid paths:
```bash
# Should return 404, not crash
curl https://sityarch.onrender.com/invalid-path
```

### 6.4 Add Music Files (Optional)

If you want music in production:
1. Create `public/music/` if needed
2. Add `.mp3` files
3. Push to GitHub
4. Render will redeploy
5. Music appears in app

---

## Troubleshooting Deployment Issues

### 🔴 Build Failed

**Check Render logs** for error messages.

Common issues:
```bash
# Missing dependencies
npm install

# TypeScript errors
npm run lint

# Environment variables missing
echo $GEMINI_API_KEY
```

### 🔴 Build Succeeded but App Won't Start

**Check Runtime logs** in Render dashboard.

Common issues:
- `PORT` not set in environment
- `GEMINI_API_KEY` missing (but not critical if not using AI)
- Out of memory (unlikely, but restart service)

**Restart service**:
Render dashboard → Service → More → Restart

### 🔴 CORS Errors

**Check `CORS_ORIGIN`** matches your Render URL exactly.

```bash
# Render dashboard → Environment
CORS_ORIGIN=https://sityarch.onrender.com  # NO trailing slash!
```

### 🔴 404 on Music Files

Ensure:
1. Files in `public/music/` directory
2. Only supported formats: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac`
3. Changes pushed to GitHub
4. Render redeployed

---

## Monitoring & Maintenance

### 4.1 View Logs

Render dashboard → Logs tab shows:
- Build progress
- Deployment status
- Runtime errors
- API requests (with rate limiting info)

### 4.2 Monitor Performance

- **Incidents**: Render alerts on crashes
- **Metrics**: CPU, RAM, Bandwidth usage
- **Free tier**: 750 hours/month (renewable daily)

### 4.3 Update App

To update after changes:
```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Render auto-deploys (if enabled) within 1-2 minutes.

---

## Security Checklist (Production)

- [ ] `.env.local` NOT in git
- [ ] `GEMINI_API_KEY` NOT visible in Render logs
- [ ] `CORS_ORIGIN` set to production URL
- [ ] Health check returns 200 OK
- [ ] API endpoints require rate limiting
- [ ] Error messages don't expose stack traces
- [ ] HTTPS enabled (Render provides automatically)
- [ ] CSP headers set by Helmet.js

---

## Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Service URL**: https://sityarch.onrender.com (replace with your URL)
- **Render Docs**: https://render.com/docs
- **GitHub Integration**: https://docs.github.com/en/apps/oauth-apps
- **Security Guide**: See [SECURITY.md](SECURITY.md)

---

## Quick Command Reference

```bash
# Local development
npm run dev                          # Start dev server

# Build & test locally
npm run build && npm run start       # Production build

# Git operations
git add . && git commit -m "msg"     # Commit changes
git push origin main                 # Push to GitHub

# Environment
cp .env.example .env.local           # Create env file
# Then edit with Gemini API key

# Troubleshooting
npm run lint                         # Check errors
npm run clean && npm install         # Clean install
```

---

**Deployment Status**: ✅ Ready for Render  
**Security Status**: ✅ Production Hardened  
**Last Updated**: May 10, 2026

