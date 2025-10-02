// /lib/session.js

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
    throw new Error("JWT_SECRET is not set. Refuse to start without a signing secret.");
}

export async function encrypt(payload) {
    // Include standard claims and short expiry; user payload should not contain sensitive secrets
    return jwt.sign(payload, secretKey, {
        algorithm: "HS256",
        expiresIn: "24h",
        issuer: "witch-drug-store",
        audience: "witch-drug-store:web",
    });
}

export async function decrypt(token) {
    try {
        return jwt.verify(token, secretKey, {
            algorithms: ["HS256"],
            issuer: "witch-drug-store",
            audience: "witch-drug-store:web",
        });
    } catch (e) {
        return null;
    }
}

export async function createSession(user) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ user, expAt: expires.getTime() });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    return session;
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) return null;

    const decoded = await decrypt(session);
    if (!decoded) {
        // Invalid/expired token; proactively clear it
        try { cookieStore.delete('session'); } catch { }
        return null;
    }
    // Additional safety: ensure expected shape
    if (!decoded.user || !decoded.exp) {
        return decoded; // still allow, jwt sets exp claim
    }
    return decoded;
}

// Delete session
export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('csrfToken');
}

// Update session (refresh)
export async function updateSession() {
    const session = await getSession();
    if (!session) return null;

    const newSession = await encrypt({ user: session.user });
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set("session", newSession, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });

    return newSession;
}
