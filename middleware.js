import { NextResponse } from 'next/server';

const protectedRoutes = ['/cart', '/checkout'];
const authRoutes = ['/login', '/register'];

export function middleware(request) {
    const path = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // Read session cookie directly
    const session = request.cookies.get('session')?.value;
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};