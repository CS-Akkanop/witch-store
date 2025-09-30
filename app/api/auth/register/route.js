import { readFile } from 'fs/promises';
import { compare } from 'bcrypt';

export async function POST(request) {
    try {
        const origin = req.headers.get('origin');
        if (process.env.NODE_ENV === 'production' && origin !== process.env.NEXT_PUBLIC_SITE_URL) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const body = await req.json();
        const { username, email, password } = body;

        if (!username, !email, !password) {
            return Response.JSON({ error: "Missing Fields. " }, { status: 400 });
        }

        const userRaw = await readFile(process.cwd() + '/app/data/users.json')
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}