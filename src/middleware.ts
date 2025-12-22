import { NextResponse, type NextRequest } from 'next/server'

// Define your protected routes here
const protectedRoutes = [
  '/profile',
  '/upload', // Example protected route
  '/settings', // Example protected route
];

export async function middleware(request: NextRequest) {
  // We're not doing server-side Supabase session management here for CSR auth strategy.
  // This middleware's job is purely to redirect if a protected route is accessed directly.

  const { pathname } = request.nextUrl;

  // If the path is in the protected routes list
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // In a pure CSR auth setup, the server doesn't know the auth state.
    // It's safer to redirect to login and let the client-side AuthGuard
    // determine the actual auth status and navigate if logged in.
    // This prevents direct access to protected routes if a user tries to bypass client-side checks.
    // The client-side AuthGuard on /profile will then redirect back if not logged in.
    // This might cause a brief double-redirect but ensures server-side protection.
    
    // To minimize server roundtrips, we might check for a very basic auth cookie presence
    // but the most reliable way to avoid the SSR auth issue is to delegate full auth check to client.
    
    // For this CSR strategy, we'll redirect to login and let client AuthGuard handle it.
    // This means anyone directly navigating to /profile will briefly see /login before
    // AuthGuard kicks in and potentially redirects them back to /profile if they are logged in.
    
    // You could optionally add a very basic cookie check here if you ONLY want to redirect if NO cookie exists at all.
    // const hasAuthCookie = request.cookies.has('sb-tzdhnkscbtwpwsgabvit-auth-token'); // Replace with your actual project ID
    // if (!hasAuthCookie) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

    // Simpler: just redirect if it's a protected route. AuthGuard on client will sort it out.
    // This is a "fail-safe" for direct server navigation to protected routes.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match protected routes (example)
    '/profile/:path*',
    '/upload/:path*',
    '/settings/:path*',
    // Exclude API routes and static assets from this middleware if not already handled by Next.js defaults
    // You might need to adjust this based on your actual route structure
    '/((?!api|_next/static|_next/image|favicon.ico|auth|login|signup).*)',
  ],
}
