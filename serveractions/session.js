"use server";

import { getSession } from "@/lib/session";

export async function getUserSession() {
    const session = await getSession();
    if (!session) return null;
    return session.user; // return เฉพาะ user
}
