"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Swal from "sweetalert2";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmpass: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);



        try {

            if (form.password !== form.confirmpass) {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Password does not match!"
                });
                setLoading(false);
                return;
            }

            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json", 'x-csrf-token': window.__CSRF_TOKEN__ || '' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                throw new Error("Register failed");
            }

            // สมัครสำเร็จ → redirect ไปหน้า login
            router.push("/login");
        } catch (err) {
            console.log(err)
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: err.message || "Something went wrong"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md border border-white/50">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-purple-700 mb-6">
                    สมัครสมาชิก
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmpass"
                            value={form.confirmpass}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
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
