"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/Components/Navbar";

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        async function load() {
            try {
                const res = await fetch("/api/orders", { cache: "no-store" });
                if (!res.ok) throw new Error("โหลดรายการสั่งซื้อไม่สำเร็จ");
                const data = await res.json();
                if (!data?.success) throw new Error(data?.error || "โหลดรายการสั่งซื้อไม่สำเร็จ");
                if (isMounted) setOrders(data.orders || []);
            } catch (e) {
                if (isMounted) setError(e.message || "เกิดข้อผิดพลาด");
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
            <Navbar />
            <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-gray-800">ประวัติคำสั่งซื้อ</h1>
                        <Link href="/" className="text-sm text-purple-600 hover:text-purple-700">กลับหน้าหลัก</Link>
                    </div>

                    {loading && <p className="text-sm text-gray-500">กำลังโหลด...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {!loading && !error && (
                        orders.length === 0 ? (
                            <p className="text-sm text-gray-600">ยังไม่มีคำสั่งซื้อ</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {orders.map((o) => (
                                    <li key={o.order_id} className="py-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-800">หมายเลข: {o.order_id}</p>
                                            <p className="text-sm text-gray-500">สถานะ: <span className="font-medium">{o.status}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-purple-700 font-semibold">฿{(Number(o.total_amount) / 100).toFixed(2)}</p>
                                            <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
