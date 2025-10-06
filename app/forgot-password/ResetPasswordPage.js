"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { forgetPasswordSend } from "@/serveractions/auths";
import Swal from "sweetalert2";

export function ResetPasswordPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        email: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            try {
                const result = await forgetPasswordSend(formData);

                if (result?.success) {
                    await Swal.fire({
                        icon: "success",
                        title: "สำเร็จ!",
                        text: "ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว",
                        timer: 2000,
                        showConfirmButton: false,
                    });

                    // Redirect to login
                    router.push("/login");
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "เกิดข้อผิดพลาด",
                        text: result?.error || "กรุณาลองใหม่อีกครั้ง",
                    });
                }
            } catch (err) {
                console.error(err);
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: "กรุณาลองใหม่อีกครั้ง",
                });
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md border border-white/50">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-purple-700 mb-2">
                    ลืมรหัสผ่าน
                </h1>
                <p className="text-center text-sm text-gray-600 mb-6">
                    กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            อีเมล
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            placeholder="example@email.com"
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isPending ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-4">
                    มีบัญชีแล้ว?{" "}
                    <a href="/login" className="text-purple-600 hover:underline">
                        เข้าสู่ระบบ
                    </a>
                </p>
            </div>
        </div>
    );
}