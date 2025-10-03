"use client"

import Navbar from "@/Components/Navbar";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Swal from "sweetalert2";
import { generateQRPayment } from "@/serveractions/payments";

import { toDataURL } from "qrcode";

export default function CheckoutPage() {
    const router = useRouter();
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [csrfToken, setCsrfToken] = useState("");
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [orderId, setOrderId] = useState("");
    const [addressErrors, setAddressErrors] = useState({});
    // Minimal QR state (shown after order is created)
    const [showQR, setShowQR] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState("");
    // Address

    const qrRef = useRef(null);

    const [address, setAddress] = useState({
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
    });

    useEffect(() => {
        let isMounted = true;
        async function loadCart() {
            try {
                const res = await fetch("/api/cart", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load cart");
                const data = await res.json();
                if (!data?.success) throw new Error("Unable to get cart");
                if (isMounted) setCarts(data.carts || []);
            } catch (e) {
                if (isMounted) setError(e.message || "Error loading cart");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        async function loadCsrfToken() {
            try {
                const res = await fetch("/api/csrf");
                const data = await res.json();
                if (isMounted) setCsrfToken(data.token);
            } catch (e) {
                console.error("Failed to load CSRF token:", e);
            }
        }

        async function loadProfile() {
            try {
                const res = await fetch("/api/profile", { cache: "no-store" });
                if (!res.ok) return; // unauthenticated or server error; skip prefill
                const data = await res.json();
                if (data?.success && data.address) {
                    if (isMounted) setAddress(prev => ({
                        ...prev,
                        fullName: data.address.fullName || "",
                        phone: data.address.phone || "",
                        line1: data.address.line1 || "",
                        line2: data.address.line2 || "",
                        city: data.address.city || "",
                        state: data.address.state || "",
                        postalCode: data.address.postalCode || "",
                    }));
                }
            } catch (e) {
                // ignore profile prefill errors
            }
        }

        loadCart();
        loadCsrfToken();
        loadProfile();
        return () => {
            isMounted = false;
        };
    }, []);

    // Scroll QR into view when shown
    useEffect(() => {
        if (showQR && qrRef.current) {
            try {
                qrRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch { }
        }
    }, [showQR]);

    const subtotal = useMemo(() => {
        return carts.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    }, [carts]);

    const formattedSubtotal = useMemo(() => (subtotal / 100).toFixed(2), [subtotal]);

    const validateAddress = () => {
        const errors = {};

        if (!address.fullName.trim()) {
            errors.fullName = "กรุณากรอกชื่อ-นามสกุล";
        }

        if (!address.phone.trim()) {
            errors.phone = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (!/^0[0-9]{8,9}$/.test(address.phone.replace(/[-\s]/g, ""))) {
            errors.phone = "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง";
        }

        if (!address.line1.trim()) {
            errors.line1 = "กรุณากรอกที่อยู่";
        }

        if (!address.city.trim()) {
            errors.city = "กรุณากรอกอำเภอ/เขต";
        }

        if (!address.postalCode.trim()) {
            errors.postalCode = "กรุณากรอกรหัสไปรษณีย์";
        } else if (!/^[0-9]{5}$/.test(address.postalCode)) {
            errors.postalCode = "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";
        }

        setAddressErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const canPlaceOrder = useMemo(() => {
        return (
            address.fullName.trim() !== "" &&
            address.phone.trim() !== "" &&
            address.line1.trim() !== "" &&
            address.city.trim() !== "" &&
            address.postalCode.trim() !== "" &&
            carts.length > 0 &&
            Object.keys(addressErrors).length === 0
        );
    }, [address, carts, addressErrors]);

    const handleAddressChange = (field) => (e) => {
        const value = e.target.value;
        setAddress((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (addressErrors[field]) {
            setAddressErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handlePlaceOrder = async () => {
        if (!csrfToken) {
            setOrderError("CSRF token not loaded. Please refresh the page.");
            return;
        }

        if (!validateAddress()) {
            setOrderError("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
            return;
        }

        if (carts.length === 0) {
            setOrderError("ตะกร้าของคุณว่างเปล่า");
            return;
        }

        setOrderLoading(true);
        setOrderError("");

        try {
            const formData = new FormData();
            formData.append("csrfToken", csrfToken);
            formData.append("address", JSON.stringify(address));
            formData.append("items", JSON.stringify(carts));
            formData.append("total", subtotal.toString());

            const response = await fetch("/api/orders", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setOrderId(result.orderId);

                setQrLoading(true);
                setQrError("");
                try {
                    const formData = new FormData();
                    formData.append("csrfToken", csrfToken);
                    formData.append("totalAmount", formattedSubtotal);
                    formData.append("orderId", result.orderId);
                    formData.append("name", address.fullName);
                    formData.append("phonenumber", address.phone);

                    const qrResult = await generateQRPayment(formData);

                    if (qrResult.success) {
                        const qr = await toDataURL(qrResult.qrData);
                        await Swal.fire({
                            imageUrl: qr,
                            imageAlt: "QRCode Payment",
                            text: `จำนวนเงิน: ${formattedSubtotal} บาท`,
                            showConfirmButton: false,
                            showConfirmButton: true,
                            cancelButtonText: "ยกเลิกรายการ",
                        }).then((result) => {
                            if (result.isDenied) {
                                Swal.fire({
                                    title: "ยกเลิกการชำระเงิน",
                                    icon: "error"
                                });
                            }
                        })

                    } else {
                        setQrError(qrResult.error || "QR Payment failed");
                        await Swal.fire({ title: "ไม่สามารถสร้าง QR ได้", text: qrResult.error || "เกิดข้อผิดพลาด", icon: "error" });
                    }
                } catch (e) {
                    setQrError("QR Payment failed");
                } finally {
                    setQrLoading(false);
                }
            } else {
                setOrderError(result.error || "Failed to place order");
            }
        } catch (err) {
            setOrderError("Failed to place order. Please try again.");
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
            <Navbar />
            <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 space-y-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">ที่อยู่จัดส่ง</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">ชื่อ-นามสกุล</label>
                                    <input
                                        value={address.fullName}
                                        onChange={handleAddressChange("fullName")}
                                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${addressErrors.fullName
                                            ? "border-red-300 focus:ring-red-400"
                                            : "border-gray-200 focus:ring-purple-400"
                                            }`}
                                        placeholder="ชื่อ-นามสกุล"
                                    />
                                    {addressErrors.fullName && (
                                        <p className="text-xs text-red-600 mt-1">{addressErrors.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">เบอร์โทรศัพท์</label>
                                    <input
                                        value={address.phone}
                                        onChange={handleAddressChange("phone")}
                                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${addressErrors.phone
                                            ? "border-red-300 focus:ring-red-400"
                                            : "border-gray-200 focus:ring-purple-400"
                                            }`}
                                        placeholder="08x-xxx-xxxx"
                                    />
                                    {addressErrors.phone && (
                                        <p className="text-xs text-red-600 mt-1">{addressErrors.phone}</p>
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm text-gray-600 mb-1">ที่อยู่</label>
                                    <input value={address.line1} onChange={handleAddressChange("line1")} className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${addressErrors.line1 ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-purple-400"}`} placeholder="บ้านเลขที่ หมู่ ถนน" />
                                    {addressErrors.line1 && (
                                        <p className="text-xs text-red-600 mt-1">{addressErrors.line1}</p>
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm text-gray-600 mb-1">ที่อยู่เพิ่มเติม (ไม่บังคับ)</label>
                                    <input value={address.line2} onChange={handleAddressChange("line2")} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="ตึก/ชั้น/ห้อง" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                                    <input value={address.city} onChange={handleAddressChange("city")} className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${addressErrors.city ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-purple-400"}`} placeholder="อำเภอ/เขต" />
                                    {addressErrors.city && (
                                        <p className="text-xs text-red-600 mt-1">{addressErrors.city}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                                    <input value={address.state} onChange={handleAddressChange("state")} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" nplaceholder="จังหวัด" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                                    <input value={address.postalCode} onChange={handleAddressChange("postalCode")} className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${addressErrors.postalCode ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-purple-400"}`} placeholder="10xxx" />
                                    {addressErrors.postalCode && (
                                        <p className="text-xs text-red-600 mt-1">{addressErrors.postalCode}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">สรุปรายการ</h2>
                            {loading ? (
                                <p className="text-sm text-gray-500">กำลังโหลดตะกร้า...</p>
                            ) : error ? (
                                <p className="text-sm text-red-600">{error}</p>
                            ) : carts.length === 0 ? (
                                <div className="text-sm text-gray-600">
                                    ตะกร้าของคุณว่างเปล่า
                                    <button onClick={() => router.push("/")} className="ml-2 text-purple-600 hover:underline">ไปหน้าสินค้า</button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <ul className="divide-y divide-gray-100">
                                        {carts.map((item) => (
                                            <li key={item.product_id} className="py-2 flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center overflow-hidden">
                                                    <Image src={item.image} alt={item.name} width={48} height={48} className="object-contain w-10 h-10" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                                                </div>
                                                <div className="text-sm font-semibold text-purple-700">฿{((item.price * item.quantity) / 100).toFixed(2)}</div>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="pt-3 border-t border-gray-100 space-y-1 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>ยอดรวม</span>
                                            <span>฿{formattedSubtotal}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-gray-800">
                                            <span>ชำระทั้งหมด</span>
                                            <span>฿{formattedSubtotal}</span>
                                        </div>
                                    </div>

                                    {orderError && (
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{orderError}</p>
                                        </div>
                                    )}

                                    <button onClick={handlePlaceOrder} disabled={!canPlaceOrder || orderLoading || !csrfToken} className={`w-full mt-3 py-2.5 rounded-xl text-white font-medium transition-colors ${canPlaceOrder && csrfToken ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-300 cursor-not-allowed"}`}>
                                        {orderLoading ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

