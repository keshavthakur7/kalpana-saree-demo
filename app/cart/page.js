"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { readCart, removeFromCart, updateCartQuantity } from "../../lib/cart";
import { formatINR } from "../../lib/format";

export default function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const refresh = () => setCart(readCart());
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price_paise * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 500000 ? 0 : 9900;
  const total = subtotal + shipping;

  return (
    <main className="min-h-screen bg-royal-cream">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <p className="text-xs uppercase tracking-[.35em] text-royal-burgundy">Your selection</p>
        <h1 className="mt-3 font-display text-5xl text-royal-burgundy">Shopping Bag</h1>

        {cart.length === 0 ? (
          <div className="mt-10 rounded-[2rem] bg-white p-12 text-center shadow-luxury">
            <h2 className="font-display text-3xl">Your bag is waiting.</h2>
            <p className="mx-auto mt-3 max-w-md text-black/60">Discover the handwoven pieces from the Kalpana Saree collection.</p>
            <Link href="/" className="mt-7 inline-block rounded-full bg-royal-burgundy px-7 py-3 text-sm text-white">Shop the collection</Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="grid grid-cols-[96px_1fr_auto] gap-4 rounded-3xl bg-white p-4 shadow-luxury sm:grid-cols-[120px_1fr_auto]">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                    <Image src={item.image_url} alt={item.name} fill sizes="120px" className="object-cover" />
                  </div>
                  <div className="py-2">
                    <Link href={`/products/${item.slug}`} className="font-display text-2xl text-royal-burgundy">{item.name}</Link>
                    <div className="mt-2 text-xs uppercase tracking-[.2em] text-black/40">{item.fabric}</div>
                    <div className="mt-4 font-semibold">{formatINR(item.price_paise)}</div>
                    <div className="mt-4 flex items-center gap-2">
                      <button className="h-8 w-8 rounded-full border border-black/10" onClick={() => { updateCartQuantity(item.id, item.quantity - 1); setCart(readCart()); }}>−</button>
                      <span className="w-7 text-center text-sm">{item.quantity}</span>
                      <button className="h-8 w-8 rounded-full border border-black/10" onClick={() => { updateCartQuantity(item.id, item.quantity + 1); setCart(readCart()); }}>+</button>
                    </div>
                  </div>
                  <button className="self-start p-2 text-xs text-black/40 hover:text-royal-burgundy" onClick={() => { removeFromCart(item.id); setCart(readCart()); }}>Remove</button>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-3xl bg-white p-7 shadow-luxury lg:sticky lg:top-28">
              <h2 className="font-display text-3xl text-royal-burgundy">Order Summary</h2>
              <div className="mt-7 space-y-4 border-b border-black/10 pb-5 text-sm">
                <div className="flex justify-between"><span className="text-black/55">Subtotal</span><span>{formatINR(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-black/55">Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
              </div>
              <div className="mt-5 flex justify-between text-lg font-semibold"><span>Total</span><span>{formatINR(total)}</span></div>
              <Link href="/checkout" className="mt-7 block rounded-full bg-royal-burgundy px-6 py-4 text-center text-sm font-medium text-white hover:bg-royal-wine">Proceed to Checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
