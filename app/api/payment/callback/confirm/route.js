import { promisePool } from "@/lib/db";
import { publishPaymentSuccess } from "@/lib/eventBus";

export async function POST(request) {
	const startedAt = Date.now();
	const requestId = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
		? globalThis.crypto.randomUUID()
		: Math.random().toString(36).slice(2);

	const ua = request.headers.get('user-agent') || '';
	const xff = request.headers.get('x-forwarded-for') || '';
	const ct = request.headers.get('content-type') || '';
	const url = request.url || '';

	console.log(`[payment-confirm][${requestId}] received`, { url, ua, xff, ct });

	let data = null;
	try {
		const raw = await request.text();
		try {
			data = raw ? JSON.parse(raw) : {};
		} catch (parseErr) {
			console.error(`[payment-confirm][${requestId}] invalid JSON body`, { rawSnippet: raw?.slice(0, 500) });
			return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
		}

		const { billPaymentRef1, billPaymentRef2, billPaymentRef3 } = data || {};
		console.log(`[payment-confirm][${requestId}] parsed body`, {
			billPaymentRef1,
			billPaymentRef2,
			billPaymentRef3
		});

		if (!billPaymentRef1 || !billPaymentRef2) {
			console.warn(`[payment-confirm][${requestId}] missing refs`, { billPaymentRef1, billPaymentRef2 });
			return Response.json({ success: false, error: "Missing refs" }, { status: 400 });
		}

		const [rows] = await promisePool.query(
			"SELECT id, created_by, order_id, ref1, ref2, ref3, status FROM payments WHERE ref1=? AND ref2=? AND (ref3 = ? OR ? IS NULL) ORDER BY id DESC LIMIT 1",
			[billPaymentRef1, billPaymentRef2, billPaymentRef3 || null, billPaymentRef3 || null]
		);
		console.log(`[payment-confirm][${requestId}] payment lookup result`, { count: Array.isArray(rows) ? rows.length : -1 });

		if (!Array.isArray(rows) || rows.length === 0) {
			console.warn(`[payment-confirm][${requestId}] payment not found`);
			return Response.json({ success: false, error: "Payment not found" }, { status: 404 });
		}

		await promisePool.query(
			"UPDATE payments SET status = 'success', confirmed_at = NOW() WHERE id = ?",
			[rows[0].id]
		);
		console.log(`[payment-confirm][${requestId}] payment updated`, { id: rows[0].id, order_id: rows[0].order_id });

		// Push realtime event to SSE listeners
		publishPaymentSuccess(rows[0].ref1, rows[0].ref2, rows[0].ref3, {
			success: true,
			status: 'success',
			order_id: rows[0].order_id,
			transactionTime: data.transactionDateandTime
		});
		console.log(`[payment-confirm][${requestId}] event published`, { ref1: rows[0].ref1, ref2: rows[0].ref2 });

		return Response.json({ success: true, order_id: rows[0].order_id, transactionTime: data.transactionDateandTime });
	} catch (e) {
		console.error(`[payment-confirm][${requestId}] error`, { message: e?.message, stack: e?.stack });
		return Response.json({ success: false, error: "Callback error" }, { status: 500 });
	} finally {
		const durationMs = Date.now() - startedAt;
		console.log(`[payment-confirm][${requestId}] completed`, { durationMs });
	}
}