import { getSession } from '@/lib/session';
import { promisePool } from "@/lib/db";

// Normalize `items` column from DB which may be JSON string or object
function normalizeItems(rawItems) {
    if (!rawItems) return [];
    if (Array.isArray(rawItems)) return rawItems;
    try {
        if (typeof rawItems === 'string') return JSON.parse(rawItems);
        // Some drivers can return Buffer for JSON
        if (Buffer.isBuffer(rawItems)) return JSON.parse(rawItems.toString('utf8'));
    } catch (e) {
        console.error('Failed to parse cart items JSON:', e);
    }
    // Fallback
    return [];
}

export async function POST(request) {
    try {
        const cookie = await getSession();
        if (!cookie) return new Response(JSON.stringify({ success: false, message: "Not authenticated" }), { status: 401 });

        const body = await request.json();
        const { itemId, quantity } = body || {};
        const productIdNum = Number(itemId);
        const quantityNum = Number(quantity);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0 || !Number.isInteger(quantityNum) || quantityNum <= 0) {
            return new Response(JSON.stringify({ success: false, message: "Invalid itemId or quantity" }), { status: 400 });
        }

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            const items = [{ product_id: productIdNum, quantity: quantityNum }];
            await promisePool.query(
                "INSERT INTO carts (user_id, items) VALUES (?, ?)",
                [cookie.user.userId, JSON.stringify(items)]
            );
        } else {
            const items = normalizeItems(rows[0].items);
            const index = items.findIndex(i => i.product_id === productIdNum);

            if (index >= 0) {
                const nextQuantity = Number(items[index].quantity) + quantityNum;
                items[index].quantity = nextQuantity;
            } else {
                items.push({ product_id: productIdNum, quantity: quantityNum });
            }

            await promisePool.query(
                "UPDATE carts SET items = ? WHERE user_id = ?",
                [JSON.stringify(items), cookie.user.userId]
            );
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const cookie = await getSession();
        if (!cookie) return new Response(JSON.stringify({ success: false, message: "Not authenticated" }), { status: 401 });

        const body = await request.json();
        const { itemId, quantity } = body || {};
        const productIdNum = Number(itemId);
        const quantityNum = Number(quantity);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0 || !Number.isInteger(quantityNum) || quantityNum <= 0) {
            return new Response(JSON.stringify({ success: false, message: "Invalid itemId or quantity" }), { status: 400 });
        }

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: "Cart not found" }), { status: 404 });
        }

        const items = normalizeItems(rows[0].items);
        const updatedItems = items.map(item =>
            item.product_id === productIdNum ? { ...item, quantity: quantityNum } : item
        );

        await promisePool.query(
            "UPDATE carts SET items = ? WHERE user_id = ?",
            [JSON.stringify(updatedItems), cookie.user.userId]
        );

        return Response.json({ success: true });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

export async function GET() {
    try {
        const cookie = await getSession();
        if (!cookie) return new Response(JSON.stringify({ success: false, message: "Not authenticated" }), { status: 401 });

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            // Try to include last successful order_id if exists
            const [lastPay] = await promisePool.query(
                "SELECT order_id FROM payments WHERE created_by = ? AND status = 'success' ORDER BY id DESC LIMIT 1",
                [cookie.user.userId]
            );
            const orderId = Array.isArray(lastPay) && lastPay.length > 0 ? lastPay[0].order_id : null;
            return Response.json({ success: true, carts: [], order_id: orderId });
        }

        const items = normalizeItems(rows[0].items)

        // ดึงข้อมูล product จริงจากตาราง products
        const productIds = [...new Set(items.map(i => Number(i.product_id)).filter(n => Number.isInteger(n) && n > 0))];
        if (productIds.length === 0) return Response.json({ success: true, carts: [] });

        const [products] = await promisePool.query(
            `SELECT id, name, description, price, discount_percent, image 
             FROM products WHERE id IN (?)`,
            [productIds]
        );

        const carts = items.map(item => {
            const product = products.find(p => p.id === Number(item.product_id));
            return product ? { ...product, product_id: product.id, quantity: Math.max(1, Number(item.quantity) || 1) } : null;
        }).filter(Boolean);

        // Also include last successful order_id if exists
        const [lastPay] = await promisePool.query(
            "SELECT order_id FROM payments WHERE created_by = ? AND status = 'success' ORDER BY id DESC LIMIT 1",
            [cookie.user.userId]
        );
        const orderId = Array.isArray(lastPay) && lastPay.length > 0 ? lastPay[0].order_id : null;

        return Response.json({ success: true, carts, order_id: orderId });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}


export async function DELETE(request) {
    try {
        const cookie = await getSession();
        if (!cookie) return new Response(JSON.stringify({ success: false, message: "Not authenticated" }), { status: 401 });

        const body = await request.json();
        const { itemId } = body || {};
        const productIdNum = Number(itemId);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return new Response(JSON.stringify({ success: false, message: "Invalid itemId" }), { status: 400 });
        }

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: "Cart is empty" }), { status: 404 });
        }

        const items = normalizeItems(rows[0].items);
        const updatedItems = items.filter(item => Number(item.product_id) !== productIdNum);

        await promisePool.query(
            "UPDATE carts SET items = ? WHERE user_id = ?",
            [JSON.stringify(updatedItems), cookie.user.userId]
        );

        return Response.json({ success: true });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}