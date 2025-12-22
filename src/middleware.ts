import { NextResponse, type NextRequest } from 'next/server'

// Define your protected routes here
const protectedRoutes = [
  '/upload', // Example protected route
  '/settings', // Example protected route
];

export async function middleware(request: NextRequest) {
  // We're not doing server-side Supabase session management here for CSR auth strategy.
  // This middleware's job is purely to redirect if a protected route is accessed directly.

  const { pathname } = request.nextUrl;

  // If the path is in the protected routes list
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl
      ? new URL(supabaseUrl).hostname.split('.')[0]
      : null
    const cookiePrefix = projectRef ? `sb-${projectRef}-auth-token` : null
    const hasAuthCookie = cookiePrefix
      ? request.cookies.has(cookiePrefix) ||
        request.cookies.has(`${cookiePrefix}.0`) ||
        request.cookies
          .getAll()
          .some(cookie => cookie.name.startsWith(cookiePrefix))
      : request.cookies
          .getAll()
          .some(cookie => cookie.name.includes('auth-token'))

    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
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
