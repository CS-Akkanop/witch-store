"use client"

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/Components/Navbar";

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
                <Navbar />
                <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-gray-100 text-center">
                        <div className="animate-pulse">
                            <div className="w-16 h-16 bg-purple-200 rounded-full mx-auto mb-4"></div>
                            <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
            <Navbar />
            <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">คำสั่งซื้อสำเร็จ!</h1>
                    <p className="text-gray-600 mb-6">
                        ขอบคุณสำหรับการสั่งซื้อของคุณ เราได้รับคำสั่งซื้อแล้วและกำลังดำเนินการจัดส่ง
                    </p>
                    
                    {orderId && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-1">หมายเลขคำสั่งซื้อ</p>
                            <p className="text-lg font-mono font-semibold text-purple-700">{orderId}</p>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <Link 
                            href="/"
                            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                        >
                            กลับไปหน้าหลัก
                        </Link>
                        <div>
                            <Link 
                                href="/profile"
                                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                            >
                                ดูประวัติการสั่งซื้อ
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
