"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getUserSession } from "@/serveractions/session";
import { logout } from "@/serveractions/auths";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [csrfToken, setCsrfToken] = useState("");

    useEffect(() => {
        const loadSession = async () => {
            const u = await getUserSession();
            setUser(u);
        };
        loadSession();

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        async function fetchToken() {
            const res = await fetch("/api/csrf");
            const data = await res.json();
            setCsrfToken(data.token);
        }
        fetchToken();
    }, []);

    // links สำหรับ guest
    const guestLinks = [
        { name: "Home", href: "/" },
        { name: "Login", href: "/login" },
        { name: "Register", href: "/register" },
    ];

    return (
        <nav
            className={`fixed left-1/2 transform -translate-x-1/2 transition-all duration-300 z-50 
                ${scrolled
                    ? "top-2 w-[95%] sm:w-[90%] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-4 sm:px-6 py-2 sm:py-2.5 rounded-[35px] sm:rounded-[45px] shadow-lg bg-white/90 backdrop-blur-md"
                    : "top-0 w-full rounded-none bg-white shadow-md px-4 sm:px-6 md:px-8 py-3 sm:py-4"
                }
            `}
        >
            <div className="flex justify-between items-center w-full">
                {/* Left: Logo + General Links */}
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
                        <Image src="/icon.png" width={40} height={40} alt="Logo" className={`transition-all duration-300  ${scrolled ? "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" : "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11"} `} />
                        <span className={`font-bold transition-all duration-300 whitespace-nowrap ${scrolled ? "text-sm sm:text-base md:text-lg" : "text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"} `} >
                            ร้านขายยา
                        </span>
                    </Link>

                    <Link href="/" className={`hidden md:block text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium ${scrolled ? "text-sm lg:text-base" : "text-sm lg:text-base xl:text-lg"}`} >
                        Home
                    </Link>

                    {/* Show Cart only when logged in */}
                    {user && (
                        <Link href="/cart" className={`hidden md:block text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium ${scrolled ? "text-sm lg:text-base" : "text-sm lg:text-base xl:text-lg"}`} >
                            Cart
                        </Link>
                    )}
                </div>

                {/* Right: User / Guest Menu */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6 relative">
                    {user ? (
                        <>
                            {/* Username Dropdown */}
                            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="text-gray-700 hover:text-blue-600 font-medium relative" >
                                ชื่อผู้ใช้: {user.username || "User"}
                            </button>
                            {userMenuOpen && (
                                <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-xl py-2 w-40">
                                    <Link href="/order-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50" >
                                        ประวัติการซื้อ
                                    </Link>
                                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50" >
                                        Profile
                                    </Link>
                                    <form action={logout}>
                                        <input type="hidden" name="csrfToken" value={csrfToken ?? ""} />
                                        <button type="submit" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" >
                                            Logout
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        guestLinks
                            .filter((link) => link.name !== "Home") // ตัด Home ออก (เพราะเราโชว์ด้านซ้ายแล้ว)
                            .map((link) => (
                                <Link key={link.name} href={link.href} className={`text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium ${scrolled ? "text-sm lg:text-base" : "text-sm lg:text-base xl:text-lg"}`}>
                                    {link.name}
                                </Link>
                            ))
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none transition-colors hover:cursor-pointer" aria-label="Toggle menu" >
                    {/* (ไอคอนเหมือนเดิม) */}
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`transition-all duration-300 ${scrolled ? "h-5 w-5" : "h-6 w-6"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`transition-all duration-300 ${scrolled ? "h-5 w-5" : "h-6 w-6"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>


            {/* Mobile Menu Dropdown */}
            {
                isOpen && (
                    <div className={`md:hidden bg-white shadow-lg transition-all duration-300
                    ${scrolled ? "mt-2 rounded-2xl" : "mt-3 rounded-lg"}`}>
                        <div className="px-3 py-2 space-y-1">
                            {user ? (
                                <>
                                    <Link href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50">Home</Link>
                                    <Link href="/cart" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50">Cart</Link>
                                    <Link href="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50">Profile</Link>
                                    <Link href="/order-history" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50">ประวัติการซื้อ</Link>
                                    <form action={logout}>
                                        <input type="hidden" name="csrfToken" value={csrfToken ?? ""} />
                                        <button type="submit" className="w-full text-left px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50" >
                                            Logout
                                        </button>
                                    </form>
                                </>
                            ) : (
                                guestLinks.map((link) => (
                                    <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50" >
                                        {link.name}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
