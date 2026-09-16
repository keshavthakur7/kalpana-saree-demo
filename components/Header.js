"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, readCart } from "../lib/cart";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(cartCount(readCart()));
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, []);

  const categories = [
    ["Silk Sarees", "Silk"],
    ["Wedding Sarees", "Wedding"],
    ["Party Wear", "Party Wear"],
    ["Cotton Sarees", "Cotton"],
    ["Festive Collection", "Festive"],
    ["New Arrivals", ""],
    ["Best Sellers", ""]
  ];

  return (
    <>
      <div className="bg-royal-burgundy px-4 py-2 text-center text-[10px] text-white sm:text-xs">
        Free Shipping on Orders Above ₹1,999 &nbsp; | &nbsp; Cash on Delivery Available &nbsp; | &nbsp; Authentic Sarees &nbsp; | &nbsp; Easy Returns
      </div>

      <header className="sticky top-0 z-50 border-b border-black/10 bg-royal-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-[#b78a42]/40" />
              <span className="font-display text-xl text-[#b78a42]">✺</span>
            </div>
            <div className="leading-none">
              <div className="font-display text-[27px] tracking-[.08em] text-[#b78a42]">KALPANA</div>
              <div className="mt-1 text-[9px] tracking-[.48em] text-royal-burgundy">SAREES</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] lg:flex">
            <Link className="hover:text-royal-burgundy" href="/">Home</Link>
            <Link className="hover:text-royal-burgundy" href="/shop">Shop</Link>
            <div className="group relative">
              <button type="button" className="py-3 hover:text-royal-burgundy">Categories⌄</button>
              <div className="invisible absolute left-1/2 top-full w-60 -translate-x-1/2 rounded-2xl border border-black/5 bg-white p-2 opacity-0 shadow-luxury transition group-hover:visible group-hover:opacity-100">
                {categories.map(([name, value]) => (
                  <Link
                    key={name}
                    href={value ? `/shop?category=${encodeURIComponent(value)}` : `/shop`}
                    className="block rounded-xl px-4 py-2.5 text-sm hover:bg-royal-cream hover:text-royal-burgundy"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
            <Link className="hover:text-royal-burgundy" href="/shop?sort=newest">New Arrivals</Link>
            <Link className="hover:text-royal-burgundy" href="/shop?sort=featured">Best Sellers</Link>
            <Link className="hover:text-royal-burgundy" href="/#story">About</Link>
            <Link className="hover:text-royal-burgundy" href="/#contact">Contact</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <form action="/shop" className="hidden xl:block">
              <input name="q" placeholder="Search sarees..." className="!min-h-10 !w-44 !rounded-md !bg-white/70 !px-4 text-xs" />
            </form>
            <Link href="/account" aria-label="Account" className="rounded-full p-2 text-xl hover:bg-white">♙</Link>
            <Link href="/shop" aria-label="Wishlist" className="rounded-full p-2 text-xl hover:bg-white">♡</Link>
            <Link href="/cart" aria-label="Shopping bag" className="relative rounded-full p-2 text-xl hover:bg-white">
              🛒
              {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-royal-burgundy px-1 text-[10px] font-bold text-white">{count}</span>}
            </Link>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-5 pb-2 lg:hidden lg:px-8">
          {categories.slice(0, 6).map(([name, value]) => (
            <Link
              key={name}
              href={value ? `/shop?category=${encodeURIComponent(value)}` : `/shop`}
              className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-xs"
            >
              {name.replace(" Sarees", "")}
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}
