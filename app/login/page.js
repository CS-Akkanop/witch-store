"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/serveractions/auths";
import Swal from "sweetalert2";

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            try {
                const result = await login(formData);

                if (result?.success) {
                    // Show success message
                    await Swal.fire({
                        icon: "success",
                        title: "สำเร็จ!",
                        text: "เข้าสู่ระบบเรียบร้อยแล้ว",
                        timer: 1500,
                        showConfirmButton: false,
                    });

                    // Store user info if needed (optional)
                    // sessionStorage.setItem('user', JSON.stringify(result.user));

                    // Redirect to home
                    router.push("/");
                } else {
                    // Show error message
                    Swal.fire({
                        icon: "error",
                        title: "เข้าสู่ระบบไม่สำเร็จ",
                        text: result?.error || "กรุณาลองใหม่อีกครั้ง",
                    });
                }
            } catch (err) {
                console.error(err);
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: "มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง",
                });
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md border border-white/50">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-purple-700 mb-6">
                    เข้าสู่ระบบ
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            ชื่อผู้ใช้
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 disabled:opacity-50"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            รหัสผ่าน
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-4">
                    ยังไม่มีบัญชี?{" "}
                    <a href="/register" className="text-purple-600 hover:underline">
                        สมัครสมาชิก
                    </a>
                </p>
            </div>
        </div>
    );
}