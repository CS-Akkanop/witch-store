export const config = {
    api: {
        bodyParser: false, // ต้องปิด ถ้า verify signature
    },
};

import { promisePool } from "@/lib/db";
import { subscribePayment } from "@/lib/eventBus";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const ref1 = searchParams.get("ref1");
    const ref2 = searchParams.get("ref2");
    const ref3 = searchParams.get("ref3");

    if (!ref1 || !ref2) {
        return new Response(JSON.stringify({ success: false, error: "Missing ref1/ref2" }), { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            function sendEvent(data) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }

            // Immediate check in case the status is already success
            try {
                const params = [ref1, ref2];
                let query = "SELECT order_id, status FROM payments WHERE ref1 = ? AND ref2 = ?";
                if (ref3) {
                    query += " AND ref3 = ?";
                    params.push(ref3);
                }
                query += " ORDER BY id DESC LIMIT 1";
                const [rows] = await promisePool.query(query, params);
                if (Array.isArray(rows) && rows.length > 0 && rows[0].status === "success") {
                    sendEvent({ success: true, status: "success", order_id: rows[0].order_id });
                    controller.close();
                    return;
                }
            } catch (_) { }

            // Subscribe for real-time push from callback
            const unsubscribe = subscribePayment(ref1, ref2, ref3, (payload) => {
                sendEvent(payload);
                unsubscribe();
                controller.close();
            });

            // Heartbeat every 15s to keep connection alive (no polling)
            const interval = setInterval(() => {
                controller.enqueue(encoder.encode(": keep-alive\n\n"));
            }, 15000);

            // Close cleanup
            controller.signal?.addEventListener?.("abort", () => {
                clearInterval(interval);
                unsubscribe();
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    });
}