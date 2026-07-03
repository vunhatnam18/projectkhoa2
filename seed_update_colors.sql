-- ============================================================
-- Cập nhật màu sắc cho các variants hiện có
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- Tai nghe: thêm variant màu đỏ
INSERT INTO product_variants (product_id, sku, color, price, stock)
SELECT p.id, v.sku, v.color, v.price, v.stock
FROM (VALUES
  ('sony-wh-1000xm5',        'XM5-RED',    'Đỏ',       7490000::numeric, 8),
  ('sony-wh-1000xm4',        'XM4-RED',    'Đỏ',       5990000::numeric, 8),
  ('jbl-tune-770nc',         'JBL770-RED', 'Đỏ',       2590000::numeric, 10),
  ('jbl-tune-770nc',         'JBL770-BLU', 'Xanh dương',2590000::numeric, 10),
  ('airpods-pro-2nd-gen',    'APP2-WHT-V2','Trắng',    6490000::numeric, 0),
  ('razer-blackshark-v2-pro','BSV2P-WHT',  'Trắng',    4990000::numeric, 5)
) AS v(slug, sku, color, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- Điện thoại: thêm màu
INSERT INTO product_variants (product_id, sku, color, storage, price, stock)
SELECT p.id, v.sku, v.color, v.storage, v.price, v.stock
FROM (VALUES
  ('samsung-galaxy-s23-fe',     'S23FE-128-WHT', 'Trắng',     '128GB',  8990000::numeric, 12),
  ('samsung-galaxy-s23-fe',     'S23FE-128-RED', 'Đỏ',        '128GB',  8990000::numeric, 8),
  ('xiaomi-14-ultra',           'X14U-256-WHT',  'Trắng',     '256GB', 29990000::numeric, 5),
  ('xiaomi-redmi-note-13-pro',  'RN13P-256-GRN', 'Xanh lá',  '256GB',  7490000::numeric, 15),
  ('iphone-14-128gb',           'IP14-128-PRP',  'Tím',       '128GB', 19990000::numeric, 10),
  ('iphone-14-128gb',           'IP14-128-YEL',  'Vàng',      '128GB', 19990000::numeric, 8),
  ('samsung-galaxy-a55-5g',     'A55-128-WHT',   'Trắng',     '128GB',  9990000::numeric, 20),
  ('samsung-galaxy-a55-5g',     'A55-128-GLD',   'Vàng ánh',  '128GB',  9990000::numeric, 15)
) AS v(slug, sku, color, storage, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- Laptop: thêm màu
INSERT INTO product_variants (product_id, sku, color, storage, price, stock)
SELECT p.id, v.sku, v.color, v.storage, v.price, v.stock
FROM (VALUES
  ('macbook-air-m2-8gb-256gb',  'MBA-M2-256-GRY', 'Xám',    '256GB', 27990000::numeric, 6),
  ('macbook-air-m2-8gb-256gb',  'MBA-M2-256-STL', 'Xanh lá','256GB', 27990000::numeric, 4),
  ('macbook-air-m3-15-inch',    'MBA15-256-GLD',  'Vàng',   '256GB', 34990000::numeric, 3),
  ('asus-zenbook-14-oled',      'ZB14-512-BLK',   'Đen',    '512GB', 25990000::numeric, 5),
  ('hp-pavilion-15-i5',         'HP15-512-BLK',   'Đen',    '512GB', 16990000::numeric, 8)
) AS v(slug, sku, color, storage, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- Phụ kiện: thêm màu
INSERT INTO product_variants (product_id, sku, color, price, stock)
SELECT p.id, v.sku, v.color, v.price, v.stock
FROM (VALUES
  ('razer-deathadder-v3',  'DAV3-WHT',  'Trắng', 1990000::numeric, 15),
  ('razer-deathadder-v3',  'DAV3-RED',  'Đỏ',    2190000::numeric, 10)
) AS v(slug, sku, color, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

INSERT INTO product_variants (product_id, sku, color, storage, price, stock)
SELECT p.id, v.sku, v.color, v.storage, v.price, v.stock
FROM (VALUES
  ('samsung-t7-shield-1tb', 'T7S-1T-RED', 'Đỏ', '1TB', 1990000::numeric, 20),
  ('samsung-t7-shield-1tb', 'T7S-2T-BLK', 'Đen', '2TB', 2990000::numeric, 10),
  ('samsung-t7-shield-1tb', 'T7S-2T-BLU', 'Xanh', '2TB', 2990000::numeric, 8)
) AS v(slug, sku, color, storage, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- ============================================================
-- XONG! Variants màu sắc đã được thêm.
-- ============================================================
