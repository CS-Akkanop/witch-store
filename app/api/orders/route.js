import { getSession } from "@/lib/session";
import { promisePool } from "@/lib/db";
import { validateCsrfToken } from "@/lib/csrf";
import crypto from "crypto";

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

        const address = JSON.parse(formData.get("address"));
        const items = JSON.parse(formData.get("items"));
        const total = parseInt(formData.get("total"));

        if (!address || !items || items.length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Invalid order data" 
            }), { status: 400 });
        }

        // Generate order ID
        const orderId = `ORD${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        
        // Create order
        await promisePool.query(
            `INSERT INTO orders (order_id, user_id, address, items, total_amount, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [orderId, session.user.userId, JSON.stringify(address), JSON.stringify(items), total]
        );

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
