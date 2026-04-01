"use client";

import Link from "next/link";
import Image from "next/image";
import { useBasket } from "@/components/BasketContext";

export default function BasketPage() {
  const { items, updateQuantity, removeItem, totalPrice, deliveryFee } = useBasket();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Your basket is empty</h1>
        <p className="text-gray-400 mb-8">Browse our signage range and add items to get started.</p>
        <Link
          href="/"
          className="inline-block bg-brand-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-brand-primary-dark transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Your Basket</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.code}
            className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition"
          >
            <div className="w-20 h-20 bg-brand-gray rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              ) : (
                <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
              {item.size && <p className="text-sm text-gray-400 mt-0.5">{item.size}</p>}
              {item.material && <p className="text-xs text-gray-300">{item.material}</p>}
              {item.customFieldValues && item.customFieldValues.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {item.customFieldValues.map((f) => (
                    <p key={f.key} className="text-xs text-brand-primary">
                      {f.label}: <span className="text-gray-600">{f.value}</span>
                    </p>
                  ))}
                </div>
              )}
              {item.customSizeData && !item.customSizeData.requiresQuote && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Priced as {item.customSizeData.matchedSize}
                  {item.customSizeData.matchedFromProduct && (
                    <span> from {item.customSizeData.matchedFromProduct}</span>
                  )}
                </p>
              )}
              <p className="mt-1.5">
                <span className="inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-2 py-0.5 rounded-full border border-amber-200 text-[11px] tracking-wide">TBD</span>
              </p>
            </div>

            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => removeItem(item.code)}
                className="text-gray-300 hover:text-red-500 transition p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center bg-brand-gray rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.code, item.quantity - 1)}
                  className="px-2.5 py-1.5 hover:bg-brand-gray-dark text-sm text-gray-500 transition"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-brand-navy">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.code, item.quantity + 1)}
                  className="px-2.5 py-1.5 hover:bg-brand-gray-dark text-sm text-gray-500 transition"
                >
                  +
                </button>
              </div>

              <span className="inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-1.5 py-0.5 rounded-full border border-amber-200 text-[10px] tracking-wide">TBD</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500">Subtotal (ex. VAT)</span>
          <span className="inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 text-xs tracking-wide">TBD</span>
        </div>
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-gray-500">Delivery</span>
          <span className="inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 text-xs tracking-wide">TBD</span>
        </div>
        <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
          <span>VAT (20%)</span>
          <span className="inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 text-xs tracking-wide">TBD</span>
        </div>
        <div className="flex justify-between items-center mb-6 border-t border-gray-100 pt-4">
          <span className="text-lg font-bold text-brand-navy">Total (inc. VAT)</span>
          <span className="inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-3 py-1 rounded-full border border-amber-200 text-sm tracking-wide">TBD</span>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium text-sm"
          >
            Continue Shopping
          </Link>
          <Link
            href="/checkout"
            className="flex-1 bg-brand-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-primary-dark transition text-center"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
