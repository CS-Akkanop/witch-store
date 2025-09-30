// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const links = [
        { name: "Home", href: "/" },
        { name: "Cart", href: "/about" },

    ];

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed left-1/2 transform -translate-x-1/2 transition-all duration-300 z-50 
                ${scrolled
                    ? "top-2 w-[95%] sm:w-[90%] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl px-4 sm:px-6 py-2 sm:py-2.5 rounded-[35px] sm:rounded-[45px] shadow-lg bg-white/90 backdrop-blur-md"
                    : "top-0 w-full rounded-none bg-white shadow-md px-4 sm:px-6 md:px-8 py-3 sm:py-4"
                }
            `}
        >
            <div className="flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
                    <Image
                        src="/icon.png"
                        width={40}
                        height={40}
                        alt="Logo"
                        className={`transition-all duration-300 
                            ${scrolled
                                ? "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9"
                                : "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11"
                            }
                        `}
                    />
                    <span
                        className={`font-bold transition-all duration-300 whitespace-nowrap
                            ${scrolled
                                ? "text-sm sm:text-base md:text-lg"
                                : "text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
                            }
                        `}
                    >
                        ร้านขายยา
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium
                                ${scrolled
                                    ? "text-sm lg:text-base"
                                    : "text-sm lg:text-base xl:text-lg"
                                }
                            `}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none transition-colors"
                    aria-label="Toggle menu"
                >
                    {isOpen ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-all duration-300 ${scrolled ? "h-5 w-5" : "h-6 w-6"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-all duration-300 ${scrolled ? "h-5 w-5" : "h-6 w-6"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div
                    className={`md:hidden bg-white shadow-lg transition-all duration-300
                        ${scrolled
                            ? "mt-2 rounded-2xl"
                            : "mt-3 rounded-lg"
                        }
                    `}
                >
                    <div className="px-3 py-2 space-y-1">
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium
                                    ${scrolled ? "text-sm" : "text-base"}
                                `}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}