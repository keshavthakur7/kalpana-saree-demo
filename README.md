# Kalpana Saree — Luxury Saree Store

Production-oriented Next.js App Router starter for a luxury Indian saree store targeting ~3,000 daily visitors / ~300 orders per day on a low-cost VPS.

## Stack

- Next.js App Router + React
- Tailwind CSS
- PostgreSQL
- Redis via Upstash-compatible REST API
- Razorpay
- Meta WhatsApp Cloud API
- Shiprocket

## Setup

```bash
cp .env.example .env.local
npm install
```

Create the database and load:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

Start:

```bash
npm run dev
```

Build:

```bash
npm run build
npm start
```

## Important production configuration

### Razorpay
Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
The server creates a Razorpay order and returns the order ID for checkout. The payment webhook is the source of truth for marking an order paid.

### WhatsApp
Create approved templates in WhatsApp Manager and set:
- `WHATSAPP_ORDER_TEMPLATE_NAME`
- `WHATSAPP_COD_TEMPLATE_NAME`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_VERSION`

The sample expects these body variables:
1. Customer name
2. Order number
3. Total

Change `lib/whatsapp.js` to match the exact variable order of your approved templates.

### Shiprocket
Create a Shiprocket API user and configure email/password. The helper caches the API token in-process and creates an order for COD fulfillment. For a multi-instance deployment, move token caching into Redis.

## Scaling notes

1. PostgreSQL: use a managed Postgres service or a VPS database with SSD/NVMe, backups, and connection pooling.
2. Redis: cache product/category queries and rate-limit sensitive endpoints.
3. Images: serve WebP/AVIF from an object store/CDN rather than the app server.
4. Product/catalog pages: use Server Components and revalidation; avoid client-side fetching for the entire catalog.
5. Checkout: keep DB transaction short, lock selected products, reserve inventory, then call external providers after the transaction.
6. Payment: never trust frontend payment success alone; use Razorpay signatures/webhooks.
7. Idempotency: every checkout request carries a unique idempotency key to prevent duplicate orders on retries.
8. Observability: add structured logging, error tracking, and uptime checks before taking real orders.

## Before launch

- Add authentication/customer accounts.
- Add cart and checkout UI.
- Add Razorpay Checkout JS integration.
- Add Razorpay webhook setup in the dashboard.
- Add COD WhatsApp verification flow/webhook.
- Add Shiprocket status sync/webhooks.
- Add stock-release logic for abandoned/failed payments.
- Add admin dashboard.
- Add rate limiting/WAF/CDN.
- Replace seed image URLs with your own optimized CDN assets.
- Add GST/tax logic if required by your business model.

## Fulfillment sequencing

Prepaid orders are created in the application first, then Razorpay capture is treated as the payment source of truth. The payment webhook starts Shiprocket fulfillment after a captured payment. COD orders are created in `cod_pending_verification` and should only be sent to Shiprocket after your COD WhatsApp verification workflow confirms the order.

The example intentionally does not ship a COD order immediately at checkout.

## Current shopping flow

The starter now includes:
- product detail pages at `/products/[slug]`
- persistent browser cart
- quantity controls and item removal at `/cart`
- checkout at `/checkout`
- Razorpay checkout when credentials are configured
- COD checkout
- order confirmation state
- PostgreSQL inventory reservation during checkout
- Razorpay webhook payment capture handling
- Shiprocket hook after captured prepaid payment
- WhatsApp template hook for prepaid/COD notifications

For real production payments, configure Razorpay first and keep the webhook enabled. COD fulfillment should occur only after your WhatsApp verification process confirms the order.

## Updating an existing local database to the 10-saree catalog

Because an existing installation may already contain the original four demo products, run:

```bash
psql -U kalpana -d royal_sarees -h localhost -f database/update_catalog.sql
```

This replaces only the seeded `KS-*` demo catalog. It also removes order items belonging to those seed products, so do not use it after creating real customer orders against those demo SKUs.


## Refresh the 10-saree demo catalog

Because an existing PostgreSQL database may still contain the original 4 products, run:

```bash
npm run catalog:refresh
```

This loads the 10 Kalpana Saree demo products and their local `/public/products/...` images.

The code also maps known demo product names to local images as a safety fallback, so older records do not break `next/image`.
