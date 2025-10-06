"use client"

import Navbar from "@/Components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Homepage() {
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetch(`/api/product`)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
      .then(data => { setProducts(data); setFilteredProducts(data); })
      .catch(error => console.error("Fetch error:", error))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (!products) return;
    setFilteredProducts(value.trim() === "" ? products : products.filter(p => p.name.toLowerCase().includes(value.toLowerCase())));
  };

  const SearchIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const ChevronIcon = () => (
    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
      <Navbar />
      <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 max-w-4xl mx-auto">
          <div className="relative">
            <input type="text" placeholder="ค้นหาสินค้า..." value={search} onChange={handleChange} className="w-full px-4 sm:px-5 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm text-sm sm:text-base" />
            <SearchIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>

          {/* Search Results */}
          {search && (
            <div className="mt-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">ผลการค้นหา: {search}</h3>
              </div>

              {filteredProducts.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">พบสินค้าที่ชื่อคล้ายกัน <span className="font-bold text-purple-600">{filteredProducts.length}</span> รายการ</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer" onClick={() => router.push(`/product?pname=${product.name}`)}>
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-300 rounded-full flex items-center justify-center text-white text-xs font-semibold">{index + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-purple-600 font-semibold">฿{(product.price / 100).toFixed(2)}</p>
                        </div>
                        <ChevronIcon />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">ไม่พบสินค้าที่ชื่อคล้ายกัน</p>
              )}
            </div>
          )}
        </div>

        {/* Promotion Banner */}
        <div className="mb-6 sm:mb-8 max-w-4xl mx-auto">
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <Image src={`https://cdn.jakethewitcher.shop/img/promotion.png`} priority={true} alt="โปรโมชั่น 10.10" width={1200} height={400} className="w-full h-auto object-cover" priority />
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">{search ? `ผลการค้นหา (${filteredProducts.length})` : "สินค้าแนะนำ"}</h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-3xl">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-base mb-4">ไม่พบสินค้าที่ต้องการ</p>
              <button onClick={() => { setSearch(""); setFilteredProducts(products); }} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-sm transition-colors">ล้างการค้นหา</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50 cursor-pointer" onClick={() => router.push(`/product?pname=${product.name}`)}>
                  <div className="relative aspect-square mb-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-purple-600 to-purple-300 rounded-full flex items-center justify-center shadow-lg">
                        <Image src={`https://cdn.jakethewitcher.shop/img${product.image}`} priority={true} width={64} height={64} className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" alt={product.name} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 truncate">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base md:text-lg font-bold text-purple-600">฿{(product.price / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}