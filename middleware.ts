import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Reserved subdomains that are not tenant-specific
const RESERVED_SUBDOMAINS = [
  'admin',
  'www',
  'api',
  'app',
  'mail',
  'ftp',
  'autocrm',
  'support',
  'help',
  'billing',
  'test',
  'demo',
  'staging',
  'dev',
];

// Public paths that don't require tenant context
const PUBLIC_PATHS = [
  '/register',
  '/register-company',
  '/pricing',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/api',
];

// Super admin paths
const SUPER_ADMIN_PATHS = ['/super-admin'];

// Auth paths that should work within tenant context
const AUTH_PATHS = ['/login'];

function getSubdomain(hostname: string): string | null {
  // For localhost development (e.g., company1.localhost:3000)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      // Handle localhost:port format
      const subdomain = parts[0].split(':')[0];
      if (subdomain !== 'localhost' && subdomain !== '127') {
        return subdomain;
      }
    }
    return null;
  }

  // For Vercel preview/deployment URLs (e.g., myapp.vercel.app)
  // The base domain is already 3 parts (project.vercel.app),
  // so a tenant subdomain would need 4+ parts (tenant.project.vercel.app)
  // Note: Vercel doesn't support wildcard subdomains on *.vercel.app,
  // so tenants require a custom domain with wildcard DNS.
  if (hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const subdomain = parts[0];
      if (!RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return subdomain;
      }
    }
    return null;
  }

  // For custom production domains (e.g., company1.rodar.uy)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return subdomain;
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const subdomain = getSubdomain(hostname);

  // Check if accessing super admin panel
  if (hostname.startsWith('admin.') || pathname.startsWith('/super-admin')) {
    // Allow super admin access - no tenant context needed
    const response = NextResponse.next();
    response.headers.set('x-is-super-admin', 'true');
    return response;
  }

  // Check if this is a public path (no tenant needed)
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublicPath && !subdomain) {
    return NextResponse.next();
  }

  // If there's a subdomain, set it in the headers/cookies for the app to use
  if (subdomain) {
    const response = NextResponse.next();

    // Set subdomain in cookie for client-side access
    response.cookies.set('tenant-subdomain', subdomain, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });

    // Also set in header for server-side access
    response.headers.set('x-tenant-subdomain', subdomain);

    return response;
  }

  // No subdomain and not a public path
  // For development, allow access to the main app without subdomain
  if (process.env.NODE_ENV === 'development') {
    // In development, if no subdomain but accessing app pages, redirect to login
    // or set a default tenant for testing
    const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
    if (!isAuthPath && pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon')) {
      // Could redirect to main domain or show tenant selection
      // For now, just continue and let the app handle it
      return NextResponse.next();
    }
  }

  // In production without subdomain, redirect to main site
  // For now, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
