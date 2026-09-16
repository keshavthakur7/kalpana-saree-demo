let tokenCache = {
  token: null,
  expiresAt: 0
};

async function getShiprocketToken() {
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    })
  });

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`);
  }

  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000
  };

  return tokenCache.token;
}

export async function createShiprocketOrder(order) {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    return { skipped: true, reason: "Shiprocket is not configured." };
  }

  const token = await getShiprocketToken();
  const response = await fetch(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        order_id: order.orderNumber,
        order_date: new Date(order.createdAt).toISOString(),
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
        billing_customer_name: order.customerName,
        billing_last_name: "",
        billing_address: order.shippingAddress.address1,
        billing_address_2: order.shippingAddress.address2 || "",
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: order.shippingAddress.country || "India",
        billing_email: order.customerEmail || "",
        billing_phone: order.customerPhone,
        shipping_is_billing: true,
        order_items: order.items.map((item) => ({
          name: item.productName,
          sku: item.sku,
          units: item.quantity,
          selling_price: item.unitPricePaise / 100
        })),
        payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
        sub_total: order.subtotalPaise / 100,
        length: 25,
        breadth: 20,
        height: 8,
        weight: 0.8
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Shiprocket order creation failed: ${JSON.stringify(data)}`);
  }

  return data;
}
