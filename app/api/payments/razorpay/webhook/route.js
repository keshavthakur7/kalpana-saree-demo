import crypto from "crypto";
import { db } from "../../../../../lib/db";
import { createShiprocketOrder } from "../../../../../lib/shiprocket";

export const runtime = "nodejs";

function verifySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifySignature(rawBody, signature)) {
    return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventId = event?.payload?.payment?.entity?.id || `${event.event}-${crypto.randomUUID()}`;

  try {
    await db.query(
      `INSERT INTO payment_events (provider, event_type, external_event_id, payload)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (external_event_id) DO NOTHING`,
      ["razorpay", event.event, eventId, event]
    );

    const paymentEntity = event?.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (event.event === "payment.captured" && razorpayOrderId) {
      const updated = await db.query(
        `UPDATE orders
         SET payment_status = 'captured',
             status = 'paid',
             razorpay_payment_id = $1
         WHERE razorpay_order_id = $2
         RETURNING id, order_number, created_at, customer_name, customer_email,
                   customer_phone, shipping_address, subtotal_paise, total_paise`,
        [paymentId, razorpayOrderId]
      );

      const order = updated.rows[0];
      if (order) {
        const items = await db.query(
          `SELECT product_name AS "productName", sku, quantity,
                  unit_price_paise AS "unitPricePaise"
           FROM order_items WHERE order_id = $1`,
          [order.id]
        );

        try {
          const shiprocket = await createShiprocketOrder({
            orderNumber: order.order_number,
            createdAt: order.created_at,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            shippingAddress: order.shipping_address,
            subtotalPaise: order.subtotal_paise,
            paymentMethod: "razorpay",
            items: items.rows
          });

          if (shiprocket?.order_id || shiprocket?.shipment_id) {
            await db.query(
              `UPDATE orders
               SET shiprocket_order_id = $1,
                   shiprocket_shipment_id = $2
               WHERE id = $3`,
              [shiprocket.order_id || null, shiprocket.shipment_id || null, order.id]
            );
          }
        } catch (shiprocketError) {
          console.error("Shiprocket post-payment sync failed:", shiprocketError);
        }
      }
    }

    if (event.event === "payment.failed" && razorpayOrderId) {
      await db.query(
        `UPDATE orders
         SET payment_status = 'failed',
             status = 'pending_payment'
         WHERE razorpay_order_id = $1`,
        [razorpayOrderId]
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
