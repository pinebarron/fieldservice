import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug endpoint - runs BEFORE any other imports
app.get('/api/debug-env', (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 30) || 'NOT SET',
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET',
  });
});

// Lazy initialization for serverless
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Dynamic import to avoid top-level crashes
    const { registerRoutes } = await import('./routes');
    await registerRoutes(app);
    initialized = true;
  })();

  return initPromise;
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  // Handle debug endpoint BEFORE initialization
  if (req.url?.startsWith('/api/debug-env')) {
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
