# 🔐 Security & Deployment Guide

## ⚠️ CRITICAL SECURITY FIXES APPLIED

### 1. **API Key Protection**
- ✅ **GEMINI_API_KEY moved to backend only** - No longer exposed in client code
- ✅ **Environment variables properly isolated** - Client never sees sensitive keys
- ✅ **Backend handles all AI requests** - Secure server-side proxy

### 2. **Path Traversal Protection**
- ✅ **Music API sanitized** - All file paths validated against traversal attacks
- ✅ **Input validation** - Filenames must match safe pattern
- ✅ **Directory escaping prevented** - `../` sequences blocked

### 3. **HTTP Security**
- ✅ **Helmet.js enabled** - Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc)
- ✅ **CORS protection** - Restricts cross-origin requests
- ✅ **Rate limiting** - Protects against DDoS/brute force attacks
- ✅ **Content Security Policy** - Prevents XSS and injection attacks

### 4. **Code Quality**
- ✅ **Strict TypeScript** - Catch errors at compile time
- ✅ **Input sanitization** - filename-sanitize package prevents malicious input
- ✅ **Error handling** - No stack traces exposed in production

### 5. **Git Security**
- ✅ **.gitignore updated** - Prevents accidentally committing secrets
- ✅ **Environment variables documented** - `.env.example` shows required config
- ✅ **No hardcoded credentials** - All secrets in environment

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Local Environment File
```bash
cp .env.example .env.local
```

### 3. Add Your Gemini API Key
Edit `.env.local` and add your API key from https://ai.studio/:
```env
GEMINI_API_KEY=your_actual_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

The app will run on:
- Frontend: `http://localhost:5173` (via Vite)
- Backend API: `http://localhost:3000`
- Requests automatically proxied through Vite dev server

---

## 📦 Production Build

### Build for Production
```bash
npm run build
```

This creates optimized files in `dist/` with:
- Minified code
- Hash-based filenames for cache busting
- Complete separation of sensitive data

### Verify Production Build Locally
```bash
npm run start
```

Set `NODE_ENV=production` to test production server locally.

---

## 🌐 Deployment to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Security hardening & deployment prep"
git push origin main
```

### Step 2: Create Render Service
1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `sityarch` (or your app name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: 18

### Step 3: Add Environment Variables
In Render dashboard → Environment:
```
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_production_key
CORS_ORIGIN=https://your-app.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

⚠️ **CRITICAL**: Enable "Auto-deploy" disabled initially. Deploy manually first to verify.

### Step 4: Verify Deployment
```bash
# After deployment succeeds, test:
curl https://your-app.onrender.com/health

# Should return:
# {"status":"ok","timestamp":"2026-05-10T..."}
```

---

## 🔒 API Endpoints

### Health Check
```
GET /health
Response: {"status":"ok","timestamp":"..."}
```

### Music API (Protected)
```
GET /api/music
Response: Array of audio files with safe URLs
Rate Limited: 30 requests/minute per IP
```

### Music File Streaming (Protected)
```
GET /music/:filename
- Only audio files allowed
- Path traversal attacks blocked
- Proper MIME types set
- Content-Disposition headers present
```

---

## 📋 Security Checklist

- [x] API keys not in frontend code
- [x] Environment variables properly configured
- [x] Rate limiting enabled
- [x] CORS restrictions set
- [x] Path traversal protected
- [x] Input validation enabled
- [x] Helmet security headers enabled
- [x] TypeScript strict mode enabled
- [x] .gitignore properly configured
- [x] Production build optimized
- [x] Error handling implemented
- [x] HTTPS ready (Render provides)
- [x] Logging for security events

---

## 🚨 Troubleshooting

### "Cannot find GEMINI_API_KEY"
- This is expected! Key is no longer accessible in client
- All AI requests should go through backend API
- Set `GEMINI_API_KEY` in `.env` or Render environment

### CORS Errors
- Ensure `CORS_ORIGIN` matches your deployment URL
- For local dev: Keep as `http://localhost:3000`

### 404 on Music Files
- Ensure files are in `public/music/` directory
- Only `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac` allowed
- Filenames cannot contain path traversal sequences

### Rate Limiting Too Strict
- Adjust `RATE_LIMIT_MAX_REQUESTS` in environment
- Default: 100 requests per 15 minutes globally
- API endpoints: 30 requests per minute

---

## 📚 Additional Resources

- [OWASP Security Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Render Documentation](https://render.com/docs)
- [Helmet.js](https://helmetjs.github.io/)
- [CORS](https://www.npmjs.com/package/cors)

---

**Last Updated**: May 10, 2026  
**Security Level**: HIGH (Production Ready)
