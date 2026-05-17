import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lazy initialization for serverless
let initialized = false;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

async function initializeApp() {
  if (initError) throw initError;
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import to avoid top-level errors
      const { registerRoutes } = await import('./routes.js');
      await registerRoutes(app);
      initialized = true;
    } catch (err) {
      initError = err as Error;
      console.error('Failed to initialize app:', err);
      throw err;
    }
  })();

  return initPromise;
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
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
