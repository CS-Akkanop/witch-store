import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
    const token = generateCsrfToken();
    return new Response.json({ csrfToken: token });
}
