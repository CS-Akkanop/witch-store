"use server"

import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function getCsrfToken() {
    const cookieStore = await cookies();
    const existingToken = cookieStore.get("csrfToken")?.value;

    if (existingToken) return existingToken;

    const token = randomBytes(32).toString("hex");

    cookieStore.set("csrfToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });

    return token;
}

export async function validateCsrfToken(clientToken) {
    if (!clientToken) return false;
    
    const cookieStore = await cookies();
    const serverToken = cookieStore.get("csrfToken")?.value;
    return clientToken && serverToken && clientToken === serverToken;
}
