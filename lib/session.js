// /lib/session.js

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;

export async function encrypt(payload) {
    return jwt.sign(payload, secretKey, { algorithm: "HS256", expiresIn: "24h" });

}

export async function decrypt(token) {
    try {
        return jwt.verify(token, secretKey, { algorithms: ["HS256"] });
    } catch (e) {
        return null;
    }
}

export async function createSession(user) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ user, expires });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    return session;
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) return null;

    return await decrypt(session);
}

// Delete session
export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

// Update session (refresh)
export async function updateSession() {
    const session = await getSession();
    if (!session) return null;

    const newSession = await encrypt({ userId: session.userId });
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set("session", newSession, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return newSession;
}
