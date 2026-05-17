

# NEURAL_ARCHITECT - AI-Powered Desktop Environment

A high-performance monochrome terminal desktop environment for deep work, with React + Express + TypeScript.

🔒 **Security-Hardened for Production** | 🚀 **Ready for Render Deployment**

## 🌟 Features

- **Terminal Emulator** - Interactive command-line interface
- **Music Player** - Local audio file streaming with visualizer
- **Code Editor** - Syntax-highlighted code display
- **System Monitor** - Real-time CPU/Memory stats (btop)
- **Social Links** - Quick access to external profiles

---

## 📋 Requirements

- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- **Gemini API Key** (get free from https://ai.studio/)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:
```env
GEMINI_API_KEY=your_key_here
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000 (Express API)

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🌐 Deploy to Render

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Security hardening & production ready"
git push origin main
```

### 2. Create Render Web Service
- Go to https://render.com
- Click "New" → "Web Service"
- Connect your GitHub repo
- Select Branch: `main`

### 3. Configure Build Settings
```
Build Command:    npm install && npm run build
Start Command:    npm run start
Environment:      Node
Node Version:     18
```

### 4. Add Environment Variables
In Render Dashboard → Environment tab:
```
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_production_api_key
CORS_ORIGIN=https://your-app-name.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Deploy
- Click "Create Web Service"
- Render will automatically build and deploy
- Your app will be live at: `https://your-app-name.onrender.com`

---

## 🔐 Security Features

✅ **API Key Protection** - Sensitive data kept server-side only  
✅ **Path Traversal Protection** - File system access secured  
✅ **Helmet.js** - HTTP security headers  
✅ **CORS Protection** - Cross-origin request validation  
✅ **Rate Limiting** - DDoS/brute force protection  
✅ **Input Sanitization** - XSS prevention  
✅ **Strict TypeScript** - Type safety at compile time  

📚 **For detailed security information, see [SECURITY.md](SECURITY.md)**

---

## 📁 Project Structure

```
├── src/
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── public/
│   └── music/           # Local audio files
├── server.ts            # Express backend (hardened)
├── vite.config.ts       # Vite build config
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
├── .env.local           # Local environment (not in git)
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── SECURITY.md          # Security documentation
└── README.md            # This file
```

---

## 📦 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (with HMR) |
| `npm run build` | Build for production |
| `npm run start` | Serve production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check TypeScript errors |
| `npm run clean` | Remove dist/ folder |

---

## 🎵 Adding Music Files

1. Place audio files in `public/music/`
   - Supported: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac`
2. Restart dev server
3. Files appear automatically in Music Player

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm run dev
```

### CORS Errors in Production
Ensure `CORS_ORIGIN` in `.env` matches your Render URL exactly.

### Music Files Not Loading
- Check `public/music/` directory exists
- Verify file formats are supported
- Check browser console for errors

### Render Deployment Fails
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure `npm run build` succeeds locally first

---

## 📝 License

Apache License 2.0

---

## 🤝 Contributing

Found a security issue? Please report privately to maintainers.

---

**Status**: ✅ Production Ready | 🔒 Security Hardened | 🚀 Render Optimized  
**Last Updated**: May 10, 2026
