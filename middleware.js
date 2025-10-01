import { NextResponse } from 'next/server';
import { decrypt } from './lib/session';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Public routes that redirect to home if authenticated
const authRoutes = ['/login', '/register'];

export async function middleware(request) {
    const path = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // Get session
    const cookie = request.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    // Redirect to home if accessing auth routes with active session
    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};