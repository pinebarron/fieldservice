import express from 'express';
import cookieParser from 'cookie-parser';
import { registerRoutes } from '../server/routes.js';

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  await initializeApp();
  return app(req, res);
}
