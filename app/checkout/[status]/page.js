"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Swal from "sweetalert2";
import Navbar from "@/Components/Navbar";

export default function CheckoutStatusPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const orderId = searchParams.get("orderId") || searchParams.get("order_id") || "";
        const status = params?.status || "success";

        if (shown) return;

        const title = status === "success" ? "สร้างคำสั่งซื้อสำเร็จ" : status === "failed" ? "การชำระเงินล้มเหลว" : "สถานะคำสั่งซื้อ";
        const icon = status === "success" ? "success" : status === "failed" ? "error" : "info";

        Swal.fire({
            icon,
            title,
            html: orderId ? `<div style="font-size:14px">หมายเลขสั่งซื้อ: <b>${orderId}</b></div>` : `<div style="font-size:14px">ไม่พบหมายเลขสั่งซื้อ</div>`,
            confirmButtonText: "กลับหน้าหลัก",
        }).then(() => {
            router.push("/");
        });

        setShown(true);
    }, [router, searchParams, params, shown]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
            <Navbar />
            <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-gray-100 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">กำลังประมวลผล...</h1>
                    <p className="text-gray-600 mt-2">โปรดรอสักครู่ ระบบจะแสดงหมายเลขคำสั่งซื้อ</p>
                </div>
            </main>
        </div>
    );
}
