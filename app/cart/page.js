"use client"

import Navbar from "@/Components/Navbar";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

function CartItem({ item, updateQuantity, removeItem }) {
    return (
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-purple-100 rounded-xl overflow-hidden flex items-center justify-center">
                <Image src={`https://cdn.jakethewitcher.shop/img${item.image}`} priority={true} alt={item.name} width={96} height={96} className="object-contain w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div className="flex-1 space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">{item.name}</h3>
                <p className="text-purple-600 font-bold text-sm sm:text-base">฿{(item.price / 100).toFixed(2)}</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300 transition" >
                        -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300 transition" >
                        +
                    </button>
                </div>
            </div>
            <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-600 transition" >
                ลบ
            </button>
        </div>
    );
}

export default function CartPage() {
    const router = useRouter();

    const [cart, setCart] = useState([]);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const res = await fetch("/api/cart");
                if (!res.ok) throw new Error("Failed to fetch cart");
                const data = await res.json();

                if (data.success && data.carts) {
                    setCart(data.carts);
                }
            } catch (err) {
                console.error("Error fetching cart:", err);
            }
        };
        fetchCart();
    }, []); 

    const updateQuantity = async (id, qty) => {
        if (qty < 1) return;

        const updatedCart = cart.map(item =>
            item.product_id === id ? { ...item, quantity: qty } : item
        );

        setCart(updatedCart);

        await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: id, quantity: qty }),
        });
    };

    const removeItem = async (id) => {
        const itemToRemove = cart.find(item => item.product_id === id);

        Swal.fire({
            title: "คุณแน่ใจใช่ไหม ?",
            text: "เพราะถ้าเอาออกจากตะกร้าแล้วคุณต้องใส่เพิ่มใหม่!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "ใช่ ลบเลย!",
            cancelButtonText: "ยกเลิก"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const updatedCart = cart.filter(item => item.product_id !== id);
                setCart(updatedCart);

                await fetch("/api/cart", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ itemId: id }),
                });
                Swal.fire({
                    title: "สำเร็จ!",
                    text: `ลบ${itemToRemove.name}สำเร็จแล้ว!`,
                    icon: "success"
                });
            }
        });

    };

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        if (cart.length === 0) {
            Swal.fire("ตะกร้าว่าง", "กรุณาเพิ่มสินค้าก่อนทำรายการ", "warning");
            return;
        }
        router.push('/checkout');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6">ตะกร้าสินค้า</h1>

                {cart.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 rounded-3xl shadow-sm">
                        <p className="text-gray-500 mb-4">ตะกร้าว่าง</p>
                        <button onClick={() => window.location.href = "/"} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition">
                            กลับไปเลือกซื้อสินค้า
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map(item => (
                            <CartItem key={item.product_id} item={item} updateQuantity={updateQuantity} removeItem={removeItem} />
                        ))}

                        <div className="mt-6 flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                            <span className="text-lg font-semibold text-gray-800">
                                รวมทั้งหมด: <span className="text-purple-600">฿{(totalPrice / 100).toFixed(2)}</span>
                            </span>
                            <button onClick={handleCheckout} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full transition">
                                ชำระเงิน
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
