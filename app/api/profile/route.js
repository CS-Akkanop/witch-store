import { getSession } from "@/lib/session";
import { promisePool } from "@/lib/db";

function normalizeAddressRow(row) {
	let parsed = null;
	try {
		if (row?.address) parsed = typeof row.address === 'string' ? JSON.parse(row.address) : row.address;
		if (Buffer.isBuffer(row?.address)) parsed = JSON.parse(row.address.toString('utf8'));
	} catch {}
	return {
		fullName: parsed?.fullName ?? row?.fullname ?? "",
		phone: parsed?.phone ?? row?.phonenumber ?? "",
		line1: parsed?.line1 ?? "",
		line2: parsed?.line2 ?? "",
		city: parsed?.city ?? "",
		state: parsed?.state ?? "",
		postalCode: parsed?.postalCode ?? "",
	};
}

export async function GET() {
	try {
		const cookie = await getSession();
		if (!cookie?.user?.userId) {
			return new Response(JSON.stringify({ success: false, message: "Not authenticated" }), { status: 401 });
		}

		const [rows] = await promisePool.query(
			"SELECT fullname, phonenumber, address FROM users WHERE user_id = ? LIMIT 1",
			[cookie.user.userId]
		);

		if (!rows || rows.length === 0) {
			return Response.json({ success: true, address: { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "" } });
		}

		const address = normalizeAddressRow(rows[0]);
		return Response.json({ success: true, address });
	} catch (err) {
		return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
	}
}
