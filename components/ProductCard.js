"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { formatINR } from "../lib/format";
import { getProductImage } from "../lib/productImage";

export default function ProductCard({ product }) {
  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-[6px] bg-white shadow-[0_8px_26px_rgba(47,20,24,.08)]">
        <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5]">
          <Image
            src={getProductImage(product)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="product-image object-cover"
          />
          <button
            type="button"
            aria-label={`Wishlist ${product.name}`}
            onClick={(event) => event.preventDefault()}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-xl text-white backdrop-blur-sm transition hover:bg-royal-burgundy"
          >
            ♡
          </button>
        </Link>
      </div>

      <div className="pt-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="truncate font-sans text-[15px] font-medium text-[#2f2023] transition hover:text-royal-burgundy">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 font-semibold">{formatINR(product.price_paise)}</div>
        <div className="mt-1 flex items-center gap-1 text-[#e4a32b]" aria-label="4.5 out of 5 stars">
          <span className="text-sm tracking-[.1em]">★★★★★</span>
          <span className="ml-1 text-[10px] text-black/40">({Math.min(32, 14 + product.id?.length || 18)})</span>
        </div>
        <div className="mt-3">
          <AddToCartButton compact product={product} />
        </div>
      </div>
    </article>
  );
}
