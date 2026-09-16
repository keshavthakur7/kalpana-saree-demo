import { z } from "zod";
import crypto from "crypto";
import { db, withTransaction } from "../../../lib/db";
import { getRazorpay } from "../../../lib/razorpay";
import { sendOrderConfirmation, sendCodVerification } from "../../../lib/whatsapp";
import { createShiprocketOrder } from "../../../lib/shiprocket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  idempotencyKey: z.string().min(12).max(120),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(255).optional().or(z.literal("")),
    phone: z.string().min(10).max(20),
    shippingAddress: z.object({
      address1: z.string().min(3).max(220),
      address2: z.string().max(220).optional().default(""),
      city: z.string().min(2).max(100),
      state: z.string().min(2).max(100),
      pincode: z.string().regex(/^\d{6}$/),
      country: z.string().default("India")
    })
  }),
  paymentMethod: z.enum(["razorpay", "cod"]),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(10)
    })
  ).min(1).max(20)
});

function buildOrderNumber() {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `AR-${Date.now().toString().slice(-8)}-${suffix}`;
}

function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && new URL(origin).origin !== new URL(appUrl).origin) {
    throw new Error("Invalid request origin.");
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request);

    const payload = checkoutSchema.parse(await request.json());

    // Idempotency prevents duplicate orders when clients retry due to network instability.
    const existing = await db.query(
      `SELECT order_number, razorpay_order_id, total_paise, payment_method, status
       FROM orders WHERE idempotency_key = $1 LIMIT 1`,
      [payload.idempotencyKey]
    );

    if (existing.rows[0]) {
      return Response.json({
        ok: true,
        replay: true,
        order: existing.rows[0]
      });
    }

    const order = await withTransaction(async (client) => {
      const ids = payload.items.map((item) => item.productId);

      const { rows: products } = await client.query(
        `SELECT id, sku, name, fabric, price_paise, stock_qty, active
         FROM products
         WHERE id = ANY($1::uuid[])
         FOR UPDATE`,
        [ids]
      );

      if (products.length !== payload.items.length) {
        throw new Error("One or more products are unavailable.");
      }

      const productMap = new Map(products.map((product) => [product.id, product]));
      const lineItems = payload.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product || !product.active) throw new Error("Product is unavailable.");
        if (product.stock_qty < item.quantity) {
          throw new Error(`${product.name} is out of stock.`);
        }

        const lineTotal = product.price_paise * item.quantity;
        return {
          product,
          quantity: item.quantity,
          lineTotal
        };
      });

      const subtotalPaise = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const shippingPaise = subtotalPaise >= 500000 ? 0 : 9900;
      const totalPaise = subtotalPaise + shippingPaise;
      const orderNumber = buildOrderNumber();

      const status = payload.paymentMethod === "cod"
        ? "cod_pending_verification"
        : "pending_payment";

      const paymentStatus = "pending";

      const inserted = await client.query(
        `INSERT INTO orders
          (order_number, customer_name, customer_email, customer_phone, shipping_address,
           subtotal_paise, shipping_paise, total_paise, payment_method, payment_status, status, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id, order_number, created_at, total_paise, payment_method, status`,
        [
          orderNumber,
          payload.customer.name,
          payload.customer.email || null,
          payload.customer.phone,
          payload.customer.shippingAddress,
          subtotalPaise,
          shippingPaise,
          totalPaise,
          payload.paymentMethod,
          paymentStatus,
          status,
          payload.idempotencyKey
        ]
      );

      const dbOrder = inserted.rows[0];

      for (const item of lineItems) {
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, product_name, sku, fabric, unit_price_paise, quantity, line_total_paise)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            dbOrder.id,
            item.product.id,
            item.product.name,
            item.product.sku,
            item.product.fabric,
            item.product.price_paise,
            item.quantity,
            item.lineTotal
          ]
        );

        await client.query(
          `UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2`,
          [item.quantity, item.product.id]
        );
      }

      return {
        ...dbOrder,
        customer: payload.customer,
        subtotalPaise,
        shippingPaise,
        totalPaise,
        items: lineItems.map((item) => ({
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPricePaise: item.product.price_paise
        }))
      };
    });

    let razorpayOrder = null;

    if (payload.paymentMethod === "razorpay") {
      const rz = await getRazorpay();
      razorpayOrder = await rz.orders.create({
        amount: order.totalPaise,
        currency: "INR",
        receipt: order.order_number,
        notes: {
          order_number: order.order_number
        }
      });

      await db.query(
        `UPDATE orders SET razorpay_order_id = $1, payment_status = 'pending'
         WHERE order_number = $2`,
        [razorpayOrder.id, order.order_number]
      );
    }

    // Notifications/integrations are deliberately outside the DB transaction.
    // A provider outage should not roll back the inventory reservation.
    try {
      if (payload.paymentMethod === "cod") {
        const wa = await sendCodVerification({
          phone: order.customer.phone,
          customerName: order.customer.name,
          orderNumber: order.order_number,
          total: `₹${Math.round(order.totalPaise / 100).toLocaleString("en-IN")}`
        });

        if (wa?.messages?.[0]?.id) {
          await db.query(
            `UPDATE orders SET whatsapp_message_id = $1 WHERE order_number = $2`,
            [wa.messages[0].id, order.order_number]
          );
        }
      } else {
        const wa = await sendOrderConfirmation({
          phone: order.customer.phone,
          customerName: order.customer.name,
          orderNumber: order.order_number,
          total: `₹${Math.round(order.totalPaise / 100).toLocaleString("en-IN")}`
        });

        if (wa?.messages?.[0]?.id) {
          await db.query(
            `UPDATE orders SET whatsapp_message_id = $1 WHERE order_number = $2`,
            [wa.messages[0].id, order.order_number]
          );
        }
      }
    } catch (error) {
      console.error("WhatsApp notification failed:", error);
    }

    // Shiprocket fulfillment is intentionally triggered only after payment
    // capture or after a separate verified-COD workflow.
    const shiprocket = null;

    return Response.json({
      ok: true,
      order: {
        orderNumber: order.order_number,
        totalPaise: order.totalPaise,
        paymentMethod: order.paymentMethod,
        status: order.status
      },
      razorpay: razorpayOrder
        ? {
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
          }
        : null,
      shiprocket
    }, { status: 201 });
  } catch (error) {
    console.error("Checkout error:", error);

    const message =
      error?.name === "ZodError"
        ? "Invalid checkout payload."
        : error?.message || "Unable to create checkout.";

    return Response.json(
      { ok: false, error: message },
      { status: error?.name === "ZodError" ? 400 : 500 }
    );
  }
}
