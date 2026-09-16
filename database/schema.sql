CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'payment_authorized',
  'paid',
  'cod_pending_verification',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);
CREATE TYPE payment_method AS ENUM ('razorpay', 'cod');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE order_item_fabric AS ENUM (
  'Kanjivaram',
  'Banarasi',
  'Organza',
  'Brocade',
  'Chanderi',
  'Tussar',
  'Silk'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(180) NOT NULL UNIQUE,
  sku VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(220) NOT NULL,
  short_description VARCHAR(500),
  description TEXT,
  fabric order_item_fabric NOT NULL,
  category VARCHAR(60) NOT NULL,
  color VARCHAR(80),
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  compare_at_price_paise INTEGER CHECK (compare_at_price_paise IS NULL OR compare_at_price_paise >= price_paise),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT NOT NULL,
  gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_active_featured ON products(active, featured);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_fabric ON products(fabric);
CREATE INDEX idx_products_price ON products(price_paise);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(40) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20) NOT NULL,
  shipping_address JSONB NOT NULL,
  subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
  shipping_paise INTEGER NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  payment_method payment_method NOT NULL DEFAULT 'razorpay',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  status order_status NOT NULL DEFAULT 'pending_payment',
  razorpay_order_id VARCHAR(80) UNIQUE,
  razorpay_payment_id VARCHAR(80),
  shiprocket_order_id VARCHAR(80),
  shiprocket_shipment_id VARCHAR(80),
  whatsapp_message_id VARCHAR(120),
  idempotency_key VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_phone ON orders(customer_phone);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(220) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  fabric order_item_fabric NOT NULL,
  unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_paise INTEGER NOT NULL CHECK (line_total_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(40) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  external_event_id VARCHAR(160) UNIQUE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed products. Replace image URLs with your CDN/object-storage URLs.
INSERT INTO products
(slug, sku, name, short_description, description, fabric, category, color, price_paise, compare_at_price_paise, stock_qty, featured, image_url)
VALUES
('banarasi-silk-saree', 'KS-BAN-001', 'Banarasi Silk Saree', 'Lustrous silk with classic zari craftsmanship.', 'A timeless Banarasi drape with graceful sheen and heirloom character.', 'Banarasi', 'Silk', 'Antique Ivory', 249900, 289900, 24, TRUE, '/products/banarasi-silk.jpg'),
('kanjivaram-silk-saree', 'KS-KAN-002', 'Kanjivaram Silk Saree', 'Temple border detailing on rich silk.', 'A ceremonial silk edit designed for weddings and celebrations.', 'Kanjivaram', 'Silk', 'Deep Maroon', 329900, 389900, 18, TRUE, '/products/kanjivaram-silk.jpg'),
('organza-floral-saree', 'KS-ORG-003', 'Organza Floral Saree', 'Airy organza with romantic floral detailing.', 'Lightweight organza with floral texture and an elegant movement.', 'Organza', 'Organza', 'Blush Pink', 189900, 219900, 30, TRUE, '/products/organza-floral.jpg'),
('chiffon-party-wear-saree', 'KS-CHI-004', 'Chiffon Party Wear Saree', 'Fluid chiffon made for evening occasions.', 'A graceful party-wear silhouette with soft drape and subtle detailing.', 'Silk', 'Party Wear', 'Emerald Green', 179900, 209900, 28, TRUE, '/products/chiffon-party.jpg'),
('georgette-embroidery-saree', 'KS-GEO-005', 'Georgette Embroidery Saree', 'Elegant georgette with detailed embroidery.', 'A polished festive saree with delicate embroidery and effortless drape.', 'Silk', 'Embroidered', 'Lavender', 229900, 269900, 22, TRUE, '/products/georgette-embroidery.jpg'),
('tussar-silk-saree', 'KS-TUS-006', 'Tussar Silk Saree', 'Natural texture with understated traditional appeal.', 'A textured silk chosen for its earthy surface and timeless finish.', 'Tussar', 'Silk', 'Black & Gold', 279900, 319900, 20, TRUE, '/products/tussar-silk.jpg'),
('linen-saree', 'KS-LIN-007', 'Linen Saree', 'Breathable linen with a clean modern drape.', 'A relaxed weave balancing traditional styling with everyday elegance.', 'Silk', 'Linen', 'Powder Blue', 159900, 189900, 35, TRUE, '/products/linen-saree.jpg'),
('cotton-handloom-saree', 'KS-COT-008', 'Cotton Handloom Saree', 'Handloom character for effortless daily luxury.', 'A soft handloom saree built for repeat wear and subtle texture.', 'Silk', 'Cotton', 'Mustard Gold', 149900, 169900, 40, TRUE, '/products/cotton-handloom.jpg'),
('wedding-collection-saree', 'KS-WED-009', 'Wedding Collection Saree', 'A statement red saree for celebrations.', 'A festive statement piece with rich visual depth and ceremonial styling.', 'Kanjivaram', 'Wedding', 'Ceremonial Red', 349900, 399900, 12, TRUE, '/products/wedding-collection.jpg'),
('digital-print-saree', 'KS-DIG-010', 'Digital Print Saree', 'Contemporary print with a graceful traditional silhouette.', 'A versatile printed saree designed for elegant day-to-evening styling.', 'Organza', 'Printed', 'Ivory Floral', 169900, 199900, 32, TRUE, '/products/digital-print.jpg');
