"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/serveractions/auths";
import Swal from "sweetalert2";

export function ResetPasswordToken() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "รหัสผ่านไม่ตรงกัน!",
            });
            return;
        }

        if (form.newPassword.length < 8) {
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
            });
            return;
        }

        const formData = new FormData();
        formData.append("newPassword", form.newPassword);
        formData.append("passwordToken", token);

        startTransition(async () => {
            try {
                const result = await resetPassword(formData);

                if (result?.success) {
                    await Swal.fire({
                        icon: "success",
                        title: "สำเร็จ!",
                        text: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว",
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
                    รีเซ็ตรหัสผ่าน
                </h1>
                <p className="text-center text-sm text-gray-600 mb-6">
                    กรอกรหัสผ่านใหม่ของคุณ
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            รหัสผ่านใหม่
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={form.newPassword}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            minLength={8}
                            placeholder="อย่างน้อย 8 ตัวอักษร"
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 disabled:opacity-50"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            ยืนยันรหัสผ่านใหม่
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            minLength={8}
                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isPending ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-4">
                    จำรหัสผ่านได้แล้ว?{" "}
                    <a href="/login" className="text-purple-600 hover:underline">
                        เข้าสู่ระบบ
                    </a>
                </p>
            </div>
        </div>
    );
}