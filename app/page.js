"use client"

import Navbar from "@/Components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Swal from "sweetalert2";

export default function Homepage() {
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/product`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, []);

  const addToCart = async (product) => {
    const { value: email } = await Swal.fire({
      title: "ระบุจำนวน",
      input: "text",
      inputPlaceholder: "ระบุจำนวนที่ต้องการสั่งซื้อ",
      inputValidator: (value) => {
        if(!value) return "คุณต้องใส่จำนวน"
      }
    });
    if (email) {
      Swal.fire(`จำนวนสัั่ง: ${email}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
      <Navbar />

      {/* Main Content Container */}
      <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"> {/* Search Bar */} <div className="mb-4 sm:mb-6 max-w-4xl mx-auto"> <div className="relative"> <input type="text" placeholder="ค้นหาสินค้า..." className="w-full px-4 sm:px-5 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base" /> <svg className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg> </div> </div> {/* Promotion Banner */} <div className="mb-6 sm:mb-8 max-w-4xl mx-auto"> <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"> <Image src="/promotion.png" alt="โปรโมชั่น 10.10" width={1200} height={400} className="w-full h-auto object-cover" priority /> </div> </div>
        {/* Products Section */}

        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            สินค้าแนะนำ
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50 cursor-pointer"
                onClick={() => router.push(`/product?pname=${product.name}`)}
              >
                {/* Image */}
                <div className="relative aspect-square mb-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-purple-600 to-purple-300 rounded-full flex items-center justify-center shadow-lg">
                      <Image
                        src={product.image}
                        width={256}
                        height={256}
                        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white"
                        alt={product.name}
                      />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-purple-600">
                      {(product.price / 100).toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
                      className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 rounded-full text-white transition-all duration-200 hover:scale-110 shadow-md"
                      aria-label="Add to cart"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
