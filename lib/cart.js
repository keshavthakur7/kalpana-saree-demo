export const CART_KEY = "kalpana-saree-cart";

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, 10);
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      fabric: product.fabric,
      price_paise: product.price_paise,
      image_url: product.image_url,
      quantity: 1
    });
  }

  writeCart(cart);
}

export function removeFromCart(id) {
  writeCart(readCart().filter((item) => item.id !== id));
}

export function updateCartQuantity(id, quantity) {
  writeCart(
    readCart().map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) }
        : item
    )
  );
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(cart = readCart()) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}
