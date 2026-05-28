import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Admin-only routes that technicians cannot access
const ADMIN_ROUTES = [
  '/settings',
  '/team',
  '/vendors',
  '/pricing',
  '/forms',
];

// Routes that technicians CAN access (subset of protected routes)
const TECH_ALLOWED_ROUTES = [
  '/tech',
  '/schedule', // They'll be redirected from schedule to /tech if technician
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          );
        },
      },
    }
  );

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = [
    '/dashboard',
    '/properties',
    '/work-logs',
    '/estimates',
    '/schedule',
    '/settings',
    '/team',
    '/vendors',
    '/pricing',
    '/forms',
    '/onboarding',
    '/tech',
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/schedule', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/accept-invite|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
