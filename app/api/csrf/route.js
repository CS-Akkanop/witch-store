import { getCsrfToken } from "@/lib/csrf";

export async function GET() {
    const token = await getCsrfToken();
    return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
