import { getSession } from "@/lib/session";

export async function GET() {
    const session = await getSession();

    if (!session) {
        return Response.json({
            success: false,
            message: "Session not found!"
        })
    }
    return Response.json({
        success: true,
        message: "Session Found!"
    })
}