import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export function generateCsrfToken() {
    const token = randomBytes(32).toString("hex");

    const cookieStore = cookies();
    cookieStore.set("csrfToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });

    return token;
}

export function validateCsrfToken(clientToken) {
    const cookieStore = cookies();
    const serverToken = cookieStore.get("csrfToken")?.value;
    return clientToken && serverToken && clientToken === serverToken;
}
