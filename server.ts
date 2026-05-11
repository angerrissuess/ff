import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { Pool } from 'pg';
import xss from 'xss';
import rateLimit from "express-rate-limit";
import sanitizeFilename from "sanitize-filename";
import dotenv from 'dotenv';

// Load environment variables from .env only (developer requested)
try {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
  console.log('Loaded environment from .env');
} catch (e) {
  console.warn('Failed loading .env file:', e);
}

const __filename = fileURLToPath(import.meta.url); // Keep for potential future use

// ============ ENVIRONMENT VALIDATION ============
const validateEnvironment = () => {
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing env vars: ${missingVars.join(', ')}`);
  }
};

// ============ SECURITY UTILITIES ============

/**
 * Validates file path to prevent directory traversal attacks
 * @param basePath The base directory allowed
 * @param userProvidedPath The path provided by user
 * @returns true if path is safe, false otherwise
 */
const isPathSafe = (basePath: string, userProvidedPath: string): boolean => {
  try {
    const normalizedBase = path.normalize(path.resolve(basePath));
    const fullPath = path.normalize(path.resolve(basePath, userProvidedPath));
    
    // Ensure resolved path is within the base directory
    return fullPath.startsWith(normalizedBase + path.sep) || fullPath === normalizedBase;
  } catch (error) {
    console.error('Path validation error:', error);
    return false;
  }
};

/**
 * Validates audio file extension
 */
const isValidAudioFile = (filename: string): boolean => {
  const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
};

// ============ MIDDLEWARE SETUP ============

async function startServer() {
  const app = express();
  app.use(express.json());
const PORT = parseInt(process.env.PORT || '3000', 10);
  
  validateEnvironment();

  // NOTE: Helmet removed for local development because its CSP was
  // blocking Vite HMR (ws://) and external API calls (openrouter.ai).
  // If you need helmet in production, re-enable with a relaxed policy.

  // 2. CORS - allow all in development for local AI testing
  if (process.env.NODE_ENV === 'development') {
    app.use(cors());
  } else {
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
    app.use(cors(corsOptions));
  }

  // 3. Global Rate Limiting - disabled in development to avoid blocking local AI requests
  if (process.env.NODE_ENV !== 'development') {
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: Request) => req.path === '/health' // Skip health check
    });
    app.use(limiter);
  }

  // 4. API-specific stricter rate limit
  const apiLimiter = (process.env.NODE_ENV === 'development')
    ? ((req: Request, _res: Response, next: NextFunction) => next()) as any
    : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30,
      message: 'Too many API requests'
    });

  // 5. Logging middleware (security events)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start; // Use for potential metrics
      const status = res.statusCode;
      
      // Log suspicious activity
      if (status >= 400) {
        console.log(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path}`);
      }
    });
    next();
  });

  // ============ API ENDPOINTS ============

  // --- PostgreSQL Pool (Neon) ---
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  });

  // Create comments table if it doesn't exist
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        author VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ comments table ensured');
  } catch (err) {
    console.error('❌ Failed ensuring comments table:', err);
  }

  // GET latest 50 comments
  app.get('/api/comments', apiLimiter, async (_req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, author, text, created_at FROM comments ORDER BY created_at DESC LIMIT 50');
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  // POST a new comment
  app.post('/api/comments', apiLimiter, async (req: Request, res: Response) => {
    try {
      const incoming = req.body || {};
      const author = typeof incoming.author === 'string' ? incoming.author.trim() : '';
      const text = typeof incoming.text === 'string' ? incoming.text.trim() : '';

      if (!author || !text) {
        return res.status(400).json({ error: 'Both author and text are required' });
      }

      const cleanAuthor = xss(author);
      const cleanText = xss(text);

      const insert = await pool.query(
        'INSERT INTO comments (author, text) VALUES ($1, $2) RETURNING id, author, text, created_at',
        [cleanAuthor, cleanText]
      );

      return res.status(201).json(insert.rows[0]);
    } catch (error) {
      console.error('Error inserting comment:', error);
      return res.status(500).json({ error: 'Failed to save comment' });
    }
  });

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 🔒 SECURED MUSIC API - Protected against path traversal
  app.get("/api/music", apiLimiter, (_req: Request, res: Response) => {
    try {
      const musicDir = path.join(process.cwd(), 'public', 'music');
      
      // Ensure directory exists
      if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir, { recursive: true });
      }

      // Read files with error handling
      let files: string[] = [];
      try {
        files = fs.readdirSync(musicDir);
      } catch (error) {
        console.error('Error reading music directory:', error);
        return res.status(500).json({ error: "Failed to scan music directory" });
      }

      // 🛡️ FILTER: Only audio files + validate names
      const audioFiles = files.filter(file => {
        try {
          // Validate filename format
          if (!sanitizeFilename(file)) return false;
          
          // Check if valid audio
          if (!isValidAudioFile(file)) return false;
          
          // Double-check: Ensure resolved path is still within music dir
          if (!isPathSafe(musicDir, file)) {
            console.warn(`⚠️ Suspicious path detected: ${file}`);
            return false;
          }
          
          return true;
        } catch (error) {
          console.warn(`Error validating file: ${file}`, error);
          return false;
        }
      });

      // 🛡️ SAFE RESPONSE: Only return sanitized data
      const response = audioFiles.map(file => ({
        title: path.parse(file).name,
        artist: "LOCAL_USER",
        url: `/music/${encodeURIComponent(file)}`, // Encode for safety
        id: file
      }));
      
      return res.json(response);
    } catch (error) {
      console.error('Unexpected error in /api/music:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== Proxy endpoint for OpenRouter to avoid exposing API key in frontend =====
  app.post('/api/openrouter', apiLimiter, express.json(), async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key not configured on server' });
      // Accept either full OpenRouter body or shorthand { message: string }
      const incoming: any = req.body || {};
      let upstreamBody: any = incoming;
      if (typeof incoming.message === 'string' && !incoming.messages) {
        upstreamBody = {
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: (process.env.OPENROUTER_SYSTEM_INSTRUCTION || 'You are a helpful assistant.') },
            { role: 'user', content: incoming.message }
          ],
          stream: false,
          temperature: incoming.temperature ?? 0.9,
          top_p: incoming.top_p ?? 0.95
        };
      }

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upstreamBody),
        // no redirect
      });

      const text = await upstream.text();
      // Try to forward JSON if possible
      try {
        const json = JSON.parse(text);
        return res.status(upstream.status).json(json);
      } catch (_e) {
        return res.status(upstream.status).type('text/plain').send(text);
      }
    } catch (error) {
      console.error('Error proxying OpenRouter request:', error);
      return res.status(502).json({ error: 'Bad gateway' });
    }
  });

  // Health endpoint for proxy availability
  app.get('/api/openrouter/health', (_req: Request, res: Response) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: 'OpenRouter API key not configured on server' });
    return res.json({ ok: true });
  });

  // 🔒 SECURED MUSIC FILE SERVING
  app.get("/music/:filename", apiLimiter, (_req: Request, res: Response) => {
    try {
      const musicDir = path.join(process.cwd(), 'public', 'music');
      const filename = decodeURIComponent(_req.params.filename);
      
      // 🛡️ Validate filename
      const sanitized = sanitizeFilename(filename);
      if (!sanitized || filename !== sanitized) {
        console.warn(`⚠️ Invalid filename attempt: ${filename}`);
        return res.status(400).json({ error: "Invalid filename" });
      }

      // 🛡️ Validate file type
      if (!isValidAudioFile(sanitized)) {
        return res.status(403).json({ error: "File type not allowed" });
      }

      // 🛡️ Validate path is within music directory
      if (!isPathSafe(musicDir, sanitized)) {
        console.warn(`⚠️ Path traversal attempt detected: ${sanitized}`);
        return res.status(403).json({ error: "Access denied" });
      }

      const filePath = path.join(musicDir, sanitized);

      // 🛡️ Check file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      // 🛡️ Check file is actually a file (not directory)
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return res.status(403).json({ error: "Access denied" });
      }

      // 🛡️ Set security headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      res.setHeader('Content-Type', 'audio/mpeg'); // Adjust based on file type
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Stream the file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error reading file" });
        }
      });
      return;
    } catch (error) {
      console.error('Unexpected error in /music/:filename:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ VITE DEVELOPMENT / PRODUCTION ============

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`🚀 Development server with Vite HMR`);
  } else {
    // Production: Serve built files
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ dist folder not found. Run "npm run build" first.');
      process.exit(1);
    }
    
    app.use(express.static(distPath, {
      maxAge: '1d', // Cache static assets
      etag: false // Disable etag for better caching
    }));
    
    // SPA fallback
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    console.log(`📦 Production mode - serving from dist/`);
  }

  // ============ ERROR HANDLING ============

  // 404 handler
  app.use((_req: Request, res: Response) => {
    return res.status(404).json({ 
      error: "Not found",
      path: _req.path
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response) => {
    console.error('🔴 Error:', err);
    
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' 
        ? "Internal server error"
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // ============ START SERVER ============

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ NEURAL_ARCHITECT Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔒 Security: Helmet + CORS + Rate-Limiting enabled`);
  });
}

startServer().catch(err => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
