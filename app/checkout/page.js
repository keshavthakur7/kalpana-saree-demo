"use client";

import Script from "next/script";
import Link from "next/link";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { clearCart, readCart } from "../../lib/cart";
import { emptyProfile, readProfile } from "../../lib/profile";
import { formatINR } from "../../lib/format";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(emptyProfile);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    setCart(readCart());
    setCustomer(readProfile());
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price_paise * item.quantity, 0);
  const shipping = subtotal >= 500000 ? 0 : 9900;
  const total = subtotal + shipping;

  function update(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function submitCheckout(event) {
    event.preventDefault();
    setError("");
    if (!cart.length) { setError("Your shopping bag is empty."); return; }
    setBusy(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            shippingAddress: {
              address1: customer.address1,
              address2: customer.address2,
              city: customer.city,
              state: customer.state,
              pincode: customer.pincode,
              country: "India"
            }
          },
          paymentMethod,
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity }))
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to create your order.");

      if (paymentMethod === "cod") {
        clearCart();
        setOrder(data.order);
        return;
      }

      if (!window.Razorpay || !data.razorpay) {
        throw new Error("Razorpay is not configured yet. Add Razorpay keys, or choose Cash on Delivery.");
      }

      const razorpay = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: "Kalpana Saree",
        description: `Order ${data.order.orderNumber}`,
        order_id: data.razorpay.orderId,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#4A0E17" },
        handler: () => {
          clearCart();
          setOrder(data.order);
        },
        modal: { ondismiss: () => setBusy(false) }
      });

      razorpay.open();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <main className="min-h-screen bg-royal-cream">
        <Header />
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
          <div className="w-full rounded-[2rem] bg-white p-10 text-center shadow-luxury">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-royal-burgundy text-2xl text-white">✓</div>
            <p className="mt-7 text-xs uppercase tracking-[.3em] text-royal-burgundy">Order received</p>
            <h1 className="mt-3 font-display text-5xl text-royal-burgundy">Thank you, {customer.name.split(" ")[0] || "there"}.</h1>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-black/60">
              Your Kalpana Saree order <strong>{order.orderNumber}</strong> has been created.
              {order.paymentMethod === "cod"
                ? " We’ll verify your COD order on WhatsApp before dispatch."
                : " Payment confirmation will be reflected after Razorpay verification."}
            </p>
            <div className="mt-8 text-2xl font-semibold">{formatINR(order.totalPaise)}</div>
            <Link href="/" className="mt-8 inline-block rounded-full bg-royal-burgundy px-7 py-3 text-sm text-white">Continue shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="min-h-screen bg-royal-cream">
        <Header />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-4xl text-royal-burgundy">Your bag is empty.</h1>
          <Link href="/" className="mt-7 inline-block underline">Return to collection</Link>
        </div>
      </main>
    );
  }

  const fields = [
    ["name", "Full name", "text"],
    ["email", "Email address", "email"],
    ["phone", "Mobile number", "tel"],
    ["address1", "Address line 1", "text"],
    ["address2", "Apartment / landmark", "text"],
    ["city", "City", "text"],
    ["state", "State", "text"],
    ["pincode", "PIN code", "text"]
  ];

  return (
    <main className="min-h-screen bg-royal-cream">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <p className="text-xs uppercase tracking-[.35em] text-royal-burgundy">Secure checkout</p>
        <h1 className="mt-3 font-display text-5xl text-royal-burgundy">Complete your order</h1>

        <form onSubmit={submitCheckout} className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-7 shadow-luxury">
              <h2 className="font-display text-3xl text-royal-burgundy">Contact & delivery</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {fields.map(([key, placeholder, type]) => (
                  <input
                    key={key}
                    type={type}
                    required={["name", "phone", "address1", "city", "state", "pincode"].includes(key)}
                    placeholder={placeholder}
                    value={customer[key] || ""}
                    onChange={(e) => update(key, e.target.value)}
                    className={["address1", "address2"].includes(key) ? "md:col-span-2" : ""}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-7 shadow-luxury">
              <h2 className="font-display text-3xl text-royal-burgundy">Payment</h2>
              <div className="mt-6 grid gap-3">
                <label className={`cursor-pointer rounded-2xl border p-5 ${paymentMethod === "razorpay" ? "border-royal-burgundy bg-royal-cream" : "border-black/10"}`}>
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} className="mr-3" />
                  <strong>Online payment</strong>
                  <div className="mt-1 pl-6 text-sm text-black/50">Razorpay · UPI · cards · net banking</div>
                </label>
                <label className={`cursor-pointer rounded-2xl border p-5 ${paymentMethod === "cod" ? "border-royal-burgundy bg-royal-cream" : "border-black/10"}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mr-3" />
                  <strong>Cash on Delivery</strong>
                  <div className="mt-1 pl-6 text-sm text-black/50">WhatsApp verification before dispatch</div>
                </label>
              </div>
            </section>

            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

            <button disabled={busy} className="w-full rounded-full bg-royal-burgundy px-7 py-4 text-sm font-semibold text-white hover:bg-royal-wine disabled:opacity-50">
              {busy ? "Processing…" : paymentMethod === "cod" ? "Place COD Order" : `Pay ${formatINR(total)}`}
            </button>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-7 shadow-luxury lg:sticky lg:top-28">
            <h2 className="font-display text-3xl text-royal-burgundy">Your order</h2>
            <div className="mt-6 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-black/65">{item.name} × {item.quantity}</span>
                  <span className="whitespace-nowrap font-medium">{formatINR(item.price_paise * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm">
              <div className="flex justify-between"><span className="text-black/55">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-black/55">Shipping</span><span>{shipping ? formatINR(shipping) : "Free"}</span></div>
              <div className="flex justify-between pt-2 text-lg font-semibold"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
