"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const Navbar = dynamic(() => import("@/Components/Navbar"), { ssr: false });

export default function ProductPage() {
  const productName = useSearchParams().get("pname") || "";
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/product?pname=${productName}`);
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (productName) fetchProduct();

  }, [productName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-50">
      <Navbar />
      <main className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {loading && <p>Loading...</p>}

        {!loading && product && (
          <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6">
            {/* Product Image */}
            <div className="md:w-1/2 w-full bg-gray-100 rounded-2xl flex items-center justify-center p-4">
              <Image
                src={product.image}
                alt={product.name}
                width={512}
                height={512}
                className="object-contain rounded-2xl"
              />
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 w-full flex flex-col justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{productName || ""}</h1>
                <p className="text-purple-600 text-2xl font-bold mb-2">฿{(product.price / 100).toFixed(2) || ""}</p>
                <p className="text-gray-700 whitespace-pre-line">{product.description || ""}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-full hover:scale-105 transition transform">
                  เพิ่มลงตะกร้า
                </button>
                <button className="w-full border-2 border-purple-500 text-purple-600 font-semibold py-3 rounded-full hover:bg-gray-50 transition">
                  ซื้อเลย
                </button>
              </div>
            </div>
          </div>

        )}
      </main>
    </div>
  );
}
