import { promisePool } from '@/lib/db';

export async function GET(request) {
    const productName = request.nextUrl.searchParams.get("pname");

    try {
        console.log(true)

        if (productName) {
            // หา product ตามชื่อ
            const [rows] = await promisePool.query("SELECT * FROM products WHERE name = ?", [productName]);

            if (rows.length > 0) {

                return new Response(
                    JSON.stringify({
                        id: rows[0].id,
                        name: rows[0].name,
                        description: rows[0].description,
                        price: rows[0].price,
                        discount_percent: rows[0].discount_percent,
                        image: rows[0].image,
                    }),
                    { status: 200 }
                );
            } else {
                return new Response(JSON.stringify({ error: "Product not found" }), {
                    status: 404,
                });
            }
        } else {
            // ถ้าไม่มี pname ให้ดึงสินค้าทั้งหมด
            const [products, _] = await promisePool.query("SELECT * FROM products");

            return new Response(JSON.stringify(products), { status: 200 });
        }
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "Failed to read products" }),
            { status: 500 }
        );
    }
}
