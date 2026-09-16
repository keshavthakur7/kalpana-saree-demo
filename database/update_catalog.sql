BEGIN;

-- Remove only the ten Kalpana seed SKUs.
DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE sku LIKE 'KS-%'
);
DELETE FROM products WHERE sku LIKE 'KS-%';

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

COMMIT;
