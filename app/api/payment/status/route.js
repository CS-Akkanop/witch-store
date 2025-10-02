export const config = {
    api: {
        bodyParser: false, // ต้องปิด ถ้าจะ verify signature
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
        return new Response(
            JSON.stringify({ success: false, error: "Missing ref1/ref2" }),
            { status: 400 }
        );
    }

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            const sendEvent = (data) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            (async () => {
                try {
                    // --- เช็ค DB ก่อนว่า success แล้วหรือยัง ---
                    const params = [ref1, ref2];
                    let query =
                        "SELECT order_id, status FROM payments WHERE ref1 = ? AND ref2 = ?";
                    if (ref3) {
                        query += " AND ref3 = ?";
                        params.push(ref3);
                    }
                    query += " ORDER BY id DESC LIMIT 1";

                    const [rows] = await promisePool.query(query, params);

                    if (
                        Array.isArray(rows) &&
                        rows.length > 0 &&
                        rows[0].status === "success"
                    ) {
                        sendEvent({
                            success: true,
                            status: "success",
                            order_id: rows[0].order_id,
                        });
                        controller.close();
                        return;
                    }
                } catch (err) {
                    sendEvent({ success: false, error: err.message });
                    controller.close();
                    return;
                }

                // --- ถ้ายังไม่ success → subscribe eventBus ---
                const unsubscribe = subscribePayment(ref1, ref2, ref3, (payload) => {
                    sendEvent(payload);
                    unsubscribe();
                    controller.close();
                });

                // --- ส่ง heartbeat ทุก 15 วิ ---
                const interval = setInterval(() => {
                    controller.enqueue(encoder.encode(": keep-alive\n\n"));
                }, 15000);

                // --- cleanup เมื่อ client ปิดการเชื่อมต่อ ---
                request.signal.addEventListener("abort", () => {
                    clearInterval(interval);
                    unsubscribe();
                    controller.close();
                });
            })();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // สำหรับ Nginx/Cloudflare ให้ไม่ buffer
        },
    });
}
