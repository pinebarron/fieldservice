import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

// Lazy Supabase client - only created when first accessed
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabase;
}

// Proxy for backward compatibility
const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  }
});

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);

  // Login - redirect to Supabase Auth UI
  app.get('/api/login', (req, res) => {
    const redirectTo = `${req.protocol}://${req.get('host')}/api/auth/callback`;
    const supabaseUrl = process.env.SUPABASE_URL!;

    // Redirect to Supabase's hosted auth page
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    res.redirect(authUrl);
  });

  // Email/password login endpoint (for programmatic login)
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return res.status(401).json({ message: error?.message || 'Login failed' });
    }

    // Upsert user in local database
    await storage.upsertUser({
      id: data.session.user.id,
      email: data.session.user.email ?? null,
      firstName: data.session.user.user_metadata?.first_name ?? null,
      lastName: data.session.user.user_metadata?.last_name ?? null,
      profileImageUrl: data.session.user.user_metadata?.avatar_url ?? null,
    });

    // Set session cookies
    setAuthCookies(res, data.session.access_token, data.session.refresh_token);

    res.json({ user: data.session.user });
  });

  // Sign up endpoint
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (data.session) {
      // Auto-confirmed, set cookies
      await storage.upsertUser({
        id: data.session.user.id,
        email: data.session.user.email ?? null,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        profileImageUrl: null,
      });

      setAuthCookies(res, data.session.access_token, data.session.refresh_token);
      res.json({ user: data.session.user });
    } else {
      // Email confirmation required
      res.json({ message: 'Check your email for confirmation link' });
    }
  });

  // OAuth callback handler
  app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code as string;

    if (!code) {
      return res.redirect('/?error=no_code');
    }

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        console.error('Auth callback error:', error);
        return res.redirect('/?error=auth_failed');
      }

      // Upsert user in local database
      const user = data.session.user;
      await storage.upsertUser({
        id: user.id,
        email: user.email ?? null,
        firstName: user.user_metadata?.full_name?.split(' ')[0] ?? user.user_metadata?.first_name ?? null,
        lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? user.user_metadata?.last_name ?? null,
        profileImageUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      });

      // Set session cookies
      setAuthCookies(res, data.session.access_token, data.session.refresh_token);

      res.redirect('/');
    } catch (err) {
      console.error('Auth callback exception:', err);
      res.redirect('/?error=auth_exception');
    }
  });

  // Logout
  app.get('/api/logout', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.redirect('/');
  });

  // POST logout for API calls
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.json({ success: true });
  });
}

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    path: '/',
  };

  res.cookie('sb-access-token', accessToken, cookieOptions);
  res.cookie('sb-refresh-token', refreshToken, cookieOptions);
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // --- API key authentication (X-Client-ID + X-Client-Secret headers) ---
  const clientId = req.headers['x-client-id'] as string | undefined;
  const clientSecret = req.headers['x-client-secret'] as string | undefined;

  if (clientId && clientSecret) {
    try {
      const apiClient = await storage.verifyApiClient(clientId, clientSecret);
      if (apiClient) {
        const business = await storage.getBusiness(apiClient.businessId);
        if (business) {
          // Maintain same structure as before: req.user.claims.sub
          (req as any).user = { claims: { sub: business.ownerId } };
          return next();
        }
      }
    } catch {
      // fall through to session auth
    }
    return res.status(401).json({ message: 'Invalid API credentials' });
  }

  // --- Supabase session authentication (cookie-based) ---
  const accessToken = req.cookies?.['sb-access-token'];
  const refreshToken = req.cookies?.['sb-refresh-token'];

  if (!accessToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify the access token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // Token invalid or expired, try refresh
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (!refreshError && refreshData.session) {
          // Update cookies with new tokens
          setAuthCookies(res, refreshData.session.access_token, refreshData.session.refresh_token);

          // Set user on request - maintain same structure as before
          (req as any).user = { claims: { sub: refreshData.session.user.id } };
          return next();
        }
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // User validated - set on request (same structure as replitAuth)
    (req as any).user = { claims: { sub: user.id } };
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
