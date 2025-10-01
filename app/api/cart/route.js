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
        const { itemId, quantity } = body;

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            const items = [{ product_id: Number(itemId), quantity: Number(quantity) }];
            await promisePool.query(
                "INSERT INTO carts (user_id, items) VALUES (?, ?)",
                [cookie.user.userId, JSON.stringify(items)]
            );
        } else {
            const items = normalizeItems(rows[0].items);
            const index = items.findIndex(i => i.product_id === Number(itemId));

            if (index >= 0) {
                const nextQuantity = Number(items[index].quantity) + Number(quantity);
                items[index].quantity = nextQuantity;
            } else {
                items.push({ product_id: Number(itemId), quantity: Number(quantity) });
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
        const { itemId, quantity } = body;

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: "Cart not found" }), { status: 404 });
        }

        const items = normalizeItems(rows[0].items);
        const updatedItems = items.map(item =>
            item.product_id === Number(itemId) ? { ...item, quantity: Number(quantity) } : item
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
            return Response.json({ success: true, carts: [] });
        }

        const items = normalizeItems(rows[0].items)

        // ดึงข้อมูล product จริงจากตาราง products
        const productIds = items.map(i => i.product_id);
        if (productIds.length === 0) return Response.json({ success: true, carts: [] });

        const [products] = await promisePool.query(
            `SELECT id, name, description, price, discount_percent, image 
             FROM products WHERE id IN (?)`,
            [productIds]
        );

        const carts = items.map(item => {
            const product = products.find(p => p.id === item.product_id);
            return product ? { ...product, product_id: product.id, quantity: Number(item.quantity) } : null;
        }).filter(Boolean);

        return Response.json({ success: true, carts });
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
        const { itemId } = body;

        const [rows] = await promisePool.query(
            "SELECT items FROM carts WHERE user_id = ?",
            [cookie.user.userId]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: "Cart is empty" }), { status: 404 });
        }

        const items = normalizeItems(rows[0].items);
        const updatedItems = items.filter(item => item.product_id !== Number(itemId));

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
