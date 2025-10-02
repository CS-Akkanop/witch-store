import { getSession } from "@/lib/session";
import { promisePool } from "@/lib/db";
import { validateCsrfToken } from "@/lib/csrf";
import crypto from "crypto";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), { status: 401 });
        }

        const [rows] = await promisePool.query(
            `SELECT order_id, total_amount, status, created_at 
             FROM orders 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [session.user.userId]
        );

        return new Response(JSON.stringify({ success: true, orders: rows || [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Orders fetch error:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch orders" }), { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), { status: 401 });
        }

        const formData = await request.formData();
        const csrfToken = formData.get("csrfToken")?.toString();

        if (!await validateCsrfToken(csrfToken)) {
            return new Response(JSON.stringify({
                success: false,
                error: "Invalid CSRF token. Please refresh the page and try again."
            }), { status: 403 });
        }

        const address = JSON.parse(formData.get("address") || '{}');
        const items = JSON.parse(formData.get("items") || '[]');
        const clientTotal = parseInt(formData.get("total") || '0', 10);

        if (!address || !Array.isArray(items) || items.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: "Invalid order data"
            }), { status: 400 });
        }

        // Basic address validation
        const cleanAddress = {
            fullName: String(address.fullName || '').slice(0, 200),
            phone: String(address.phone || '').slice(0, 30),
            line1: String(address.line1 || '').slice(0, 300),
            line2: String(address.line2 || '').slice(0, 300),
            city: String(address.city || '').slice(0, 120),
            state: String(address.state || '').slice(0, 120),
            postalCode: String(address.postalCode || '').slice(0, 20),
        };
        if (!cleanAddress.fullName || !cleanAddress.phone || !cleanAddress.line1 || !cleanAddress.city || !cleanAddress.postalCode) {
            return new Response(JSON.stringify({ success: false, error: "Address incomplete" }), { status: 400 });
        }

        // Recompute total on server from product table to prevent tampering
        const productIds = [...new Set(items.map(i => Number(i.product_id)).filter(n => Number.isInteger(n) && n > 0))];
        if (productIds.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Empty cart" }), { status: 400 });
        }
        const [products] = await promisePool.query(
            `SELECT id, price FROM products WHERE id IN (?)`,
            [productIds]
        );
        const idToPrice = new Map(products.map(p => [Number(p.id), Number(p.price)]));
        let serverTotal = 0;
        const normalizedItems = [];
        for (const item of items) {
            const pid = Number(item.product_id);
            const qty = Math.max(1, Number(item.quantity) || 1);
            const price = idToPrice.get(pid);
            if (!price) continue;
            serverTotal += price * qty;
            normalizedItems.push({ product_id: pid, quantity: qty, unit_price: price });
        }
        if (normalizedItems.length === 0) {
            return new Response(JSON.stringify({ success: false, error: "No valid items" }), { status: 400 });
        }
        // Optional: ensure client-submitted total matches recomputed total
        if (Number.isFinite(clientTotal) && clientTotal !== serverTotal) {
            // We proceed with serverTotal but signal mismatch
            // Could also reject; choosing strictness:
            return new Response(JSON.stringify({ success: false, error: "Total mismatch" }), { status: 400 });
        }

        // Generate order ID
        const orderId = `ORD${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Create order
        await promisePool.query(
            `INSERT INTO orders (order_id, user_id, address, items, total_amount, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [orderId, session.user.userId, JSON.stringify(cleanAddress), JSON.stringify(normalizedItems), serverTotal]
        );

        await promisePool.query('UPDATE users SET address = ? WHERE user_id = ?', [session.user.userId, JSON.stringify(cleanAddress)])

        // Clear user's cart
        await promisePool.query(
            "DELETE FROM carts WHERE user_id = ?",
            [session.user.userId]
        );

        return new Response(JSON.stringify({
            success: true,
            orderId: orderId,
            message: "Order placed successfully"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Order creation error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to create order. Please try again."
        }), { status: 500 });
    }
}
