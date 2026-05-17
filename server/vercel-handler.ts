import express from 'express';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './routes';

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug endpoint to check env vars (remove after debugging)
app.get('/api/debug-env', (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 20) || 'NOT SET',
  });
});

// Lazy initialization for serverless
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await registerRoutes(app);
    initialized = true;
  })();

  return initPromise;
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  // Handle debug endpoint before initialization
  if (req.url === '/api/debug-env') {
    return app(req, res);
  }

  try {
    await initializeApp();
    return app(req, res);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({
      error: 'Server initialization failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
