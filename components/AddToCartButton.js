"use client";

import { useState } from "react";
import { addToCart } from "../lib/cart";

export default function AddToCartButton({ product, compact = false }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`rounded-full bg-royal-burgundy font-medium text-white transition hover:bg-royal-wine ${
        compact ? "px-4 py-2 text-xs" : "w-full px-6 py-3 text-sm"
      }`}
    >
      {added ? "Added to Bag ✓" : "Add to Bag"}
    </button>
  );
}
