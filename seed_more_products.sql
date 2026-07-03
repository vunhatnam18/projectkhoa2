-- ============================================================
-- THÊM SẢN PHẨM MỚI cho HNstore
-- Chạy sau seed.sql trong Supabase SQL Editor
-- ============================================================

-- Thêm brands mới
INSERT INTO brands (name, slug)
SELECT v.name, v.slug FROM (VALUES
  ('LG',       'lg'),
  ('ASUS',     'asus'),
  ('Xiaomi',   'xiaomi'),
  ('JBL',      'jbl'),
  ('Razer',    'razer'),
  ('HP',       'hp')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE brands.slug = v.slug);

-- Thêm sản phẩm mới
INSERT INTO products (seller_id, name, slug, base_price, description, category_id, brand_id, status)
SELECT
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  v.name, v.slug, v.base_price, v.description,
  (SELECT id FROM categories WHERE categories.slug = v.cat_slug),
  (SELECT id FROM brands     WHERE brands.slug     = v.brand_slug),
  'active'
FROM (VALUES
  -- Điện thoại
  ('Samsung Galaxy S23 FE',       'samsung-galaxy-s23-fe',         8990000::numeric,  'Snapdragon 8 Gen 1, camera 50MP OIS, màn hình 6.4 inch, pin 4500mAh sạc 25W.',           'dien-thoai', 'samsung'),
  ('Xiaomi 14 Ultra',             'xiaomi-14-ultra',               29990000::numeric, 'Snapdragon 8 Gen 3, camera Leica 50MP, màn hình LTPO AMOLED 6.73 inch, sạc 90W.',       'dien-thoai', 'xiaomi'),
  ('Xiaomi Redmi Note 13 Pro',    'xiaomi-redmi-note-13-pro',       7490000::numeric,  'Snapdragon 7s Gen 2, camera 200MP, màn hình AMOLED 6.67 inch, pin 5100mAh sạc 67W.',   'dien-thoai', 'xiaomi'),
  ('iPhone 14 128GB',             'iphone-14-128gb',               19990000::numeric, 'Chip A15 Bionic, camera 12MP Photonic Engine, Dynamic Island, màn hình 6.1 inch.',       'dien-thoai', 'apple'),
  -- Laptop
  ('ASUS ZenBook 14 OLED',        'asus-zenbook-14-oled',          25990000::numeric, 'Intel Core Ultra 7, màn hình OLED 2.8K 120Hz, RAM 16GB, SSD 512GB, pin 75Wh.',          'laptop',     'asus'),
  ('HP Pavilion 15 i5',           'hp-pavilion-15-i5',             16990000::numeric, 'Intel Core i5-1235U, RAM 8GB, SSD 512GB, màn hình FHD IPS 15.6 inch, pin 8 giờ.',       'laptop',     'hp'),
  ('ASUS ROG Strix G16',          'asus-rog-strix-g16',            42990000::numeric, 'Intel Core i9-14900HX, RTX 4070, màn hình 165Hz 16 inch, RAM 16GB, SSD 1TB.',           'laptop',     'asus'),
  ('MacBook Air M3 15 inch',      'macbook-air-m3-15-inch',        34990000::numeric, 'Chip M3, màn hình Liquid Retina 15.3 inch, pin 18 giờ, không quạt tản nhiệt.',           'laptop',     'apple'),
  -- Tai nghe
  ('JBL Tune 770NC',              'jbl-tune-770nc',                 2590000::numeric, 'Chống ồn ANC, Bluetooth 5.3, pin 70 giờ, gập gọn tiện lợi.',                            'tai-nghe',   'jbl'),
  ('Razer BlackShark V2 Pro',     'razer-blackshark-v2-pro',        4990000::numeric, 'Tai nghe gaming không dây, driver 50mm TriForce Titanium, pin 70 giờ, THX Audio.',       'tai-nghe',   'razer'),
  ('Sony WH-1000XM4',             'sony-wh-1000xm4',                5990000::numeric, 'Chống ồn hàng đầu, Bluetooth 5.0, pin 30 giờ, tích hợp Alexa và Google Assistant.',    'tai-nghe',   'sony'),
  ('AirPods Max',                 'airpods-max',                   13990000::numeric, 'Chống ồn ANC, spatial audio, driver 40mm, pin 20 giờ, vỏ nhôm cao cấp.',               'tai-nghe',   'apple'),
  ('Samsung Galaxy Buds3 Pro',    'samsung-galaxy-buds3-pro',       4290000::numeric, 'ANC 2 chiều, Bluetooth 5.4, pin 30 giờ kèm case, chống nước IP57.',                     'tai-nghe',   'samsung'),
  -- Màn hình
  ('LG 27GP850-B 27 inch',        'lg-27gp850-b-27-inch',           8990000::numeric, 'IPS Nano 1440p 165Hz, G-Sync Compatible, 1ms GTG, HDR400, USB-C.',                      'man-hinh',   'lg'),
  ('Samsung Odyssey G5 27 inch',  'samsung-odyssey-g5-27-inch',     7490000::numeric, 'Curved VA 1440p 165Hz, 1ms MPRT, AMD FreeSync Premium, HDR10.',                         'man-hinh',   'samsung'),
  ('ASUS ProArt PA279CV',         'asus-proart-pa279cv',           10990000::numeric, 'IPS 4K UHD 60Hz, 100% sRGB, Delta E < 2, USB-C 65W, chuẩn màu cho đồ họa.',            'man-hinh',   'asus'),
  -- Phụ kiện
  ('Razer DeathAdder V3',         'razer-deathadder-v3',            1990000::numeric, 'Chuột gaming có dây, sensor Focus Pro 30K DPI, 70g siêu nhẹ, 6 nút lập trình.',         'phu-kien',   'razer'),
  ('Logitech G Pro X Superlight 2','logitech-g-pro-x-superlight-2', 3490000::numeric, 'Chuột không dây gaming, sensor HERO 2 25K DPI, 60g, pin 95 giờ, LIGHTSPEED.',           'phu-kien',   'logitech'),
  ('Samsung T7 Shield 1TB',       'samsung-t7-shield-1tb',          1990000::numeric, 'SSD di động, USB 3.2 Gen 2, tốc độ đọc 1050MB/s, chống va đập MIL-STD-810G, IP65.',    'phu-kien',   'samsung'),
  ('Xiaomi Power Bank 30000mAh',  'xiaomi-power-bank-30000mah',      890000::numeric, 'Dung lượng 30000mAh, sạc nhanh 65W, 3 cổng USB-A + 1 USB-C, hiển thị % pin.',          'phu-kien',   'xiaomi')
) AS v(name, slug, base_price, description, cat_slug, brand_slug)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.slug = v.slug);

-- Thêm ảnh cho sản phẩm mới
INSERT INTO product_images (product_id, image_url, display_order)
SELECT p.id, v.image_url, 0
FROM (VALUES
  ('samsung-galaxy-s23-fe',         'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600&q=80'),
  ('xiaomi-14-ultra',               'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80'),
  ('xiaomi-redmi-note-13-pro',      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&q=80'),
  ('iphone-14-128gb',               'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=600&q=80'),
  ('asus-zenbook-14-oled',          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80'),
  ('hp-pavilion-15-i5',             'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80'),
  ('asus-rog-strix-g16',            'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80'),
  ('macbook-air-m3-15-inch',        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'),
  ('jbl-tune-770nc',                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80'),
  ('razer-blackshark-v2-pro',       'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80'),
  ('sony-wh-1000xm4',               'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'),
  ('airpods-max',                   'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=80'),
  ('samsung-galaxy-buds3-pro',      'https://images.unsplash.com/photo-1590658268037-6bf12165cd8f?w=600&q=80'),
  ('lg-27gp850-b-27-inch',          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80'),
  ('samsung-odyssey-g5-27-inch',    'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600&q=80'),
  ('asus-proart-pa279cv',           'https://images.unsplash.com/photo-1545665277-5937489579f2?w=600&q=80'),
  ('razer-deathadder-v3',           'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80'),
  ('logitech-g-pro-x-superlight-2', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80'),
  ('samsung-t7-shield-1tb',         'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=600&q=80'),
  ('xiaomi-power-bank-30000mah',    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80')
) AS v(slug, image_url)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_images.product_id = p.id);

-- Thêm variants cho sản phẩm mới
INSERT INTO product_variants (product_id, sku, color, storage, price, stock)
SELECT p.id, v.sku, v.color, v.storage, v.price, v.stock
FROM (VALUES
  ('samsung-galaxy-s23-fe',      'S23FE-128-GRN', 'Xanh lá',  '128GB',  8990000::numeric, 20),
  ('samsung-galaxy-s23-fe',      'S23FE-128-PRP', 'Tím',      '128GB',  8990000::numeric, 15),
  ('xiaomi-14-ultra',            'X14U-256-BLK',  'Đen',      '256GB', 29990000::numeric, 8),
  ('xiaomi-14-ultra',            'X14U-512-BLK',  'Đen',      '512GB', 33990000::numeric, 5),
  ('xiaomi-redmi-note-13-pro',   'RN13P-256-BLK', 'Đen',      '256GB',  7490000::numeric, 25),
  ('xiaomi-redmi-note-13-pro',   'RN13P-256-WHT', 'Trắng',    '256GB',  7490000::numeric, 20),
  ('iphone-14-128gb',            'IP14-128-BLK',  'Đen',      '128GB', 19990000::numeric, 15),
  ('iphone-14-128gb',            'IP14-128-BLU',  'Xanh',     '128GB', 19990000::numeric, 12),
  ('iphone-14-128gb',            'IP14-256-BLK',  'Đen',      '256GB', 23990000::numeric, 10),
  ('asus-zenbook-14-oled',       'ZB14-512-SLV',  'Bạc',      '512GB', 25990000::numeric, 8),
  ('hp-pavilion-15-i5',          'HP15-512-SLV',  'Bạc',      '512GB', 16990000::numeric, 12),
  ('asus-rog-strix-g16',         'ROG16-1T-BLK',  'Đen',      '1TB',   42990000::numeric, 5),
  ('macbook-air-m3-15-inch',     'MBA15-256-SLV', 'Bạc',      '256GB', 34990000::numeric, 6),
  ('macbook-air-m3-15-inch',     'MBA15-512-SLV', 'Bạc',      '512GB', 39990000::numeric, 4),
  ('lg-27gp850-b-27-inch',       'LG27-BLK',      'Đen',       NULL,    8990000::numeric, 10),
  ('samsung-odyssey-g5-27-inch', 'OG5-27-BLK',    'Đen',       NULL,    7490000::numeric, 8),
  ('asus-proart-pa279cv',        'PA279-BLK',      'Đen',       NULL,   10990000::numeric, 6),
  ('samsung-t7-shield-1tb',      'T7S-1T-BLK',    'Đen',       '1TB',   1990000::numeric, 30),
  ('samsung-t7-shield-1tb',      'T7S-1T-BLU',    'Xanh',      '1TB',   1990000::numeric, 25),
  ('xiaomi-power-bank-30000mah', 'XMPB-30K-BLK',  'Đen',       NULL,     890000::numeric, 40)
) AS v(slug, sku, color, storage, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

INSERT INTO product_variants (product_id, sku, color, price, stock)
SELECT p.id, v.sku, v.color, v.price, v.stock
FROM (VALUES
  ('jbl-tune-770nc',              'JBL770-BLK', 'Đen',   2590000::numeric, 20),
  ('jbl-tune-770nc',              'JBL770-WHT', 'Trắng', 2590000::numeric, 15),
  ('razer-blackshark-v2-pro',     'BSV2P-BLK',  'Đen',   4990000::numeric, 10),
  ('sony-wh-1000xm4',             'XM4-BLK',    'Đen',   5990000::numeric, 15),
  ('sony-wh-1000xm4',             'XM4-SLV',    'Bạc',   5990000::numeric, 10),
  ('airpods-max',                 'AMAX-SLV',   'Bạc',  13990000::numeric, 8),
  ('airpods-max',                 'AMAX-BLK',   'Đen',  13990000::numeric, 6),
  ('samsung-galaxy-buds3-pro',    'BUDS3P-WHT', 'Trắng', 4290000::numeric, 20),
  ('razer-deathadder-v3',         'DAV3-BLK',   'Đen',   1990000::numeric, 25),
  ('logitech-g-pro-x-superlight-2','GPXSL2-WHT','Trắng', 3490000::numeric, 15),
  ('logitech-g-pro-x-superlight-2','GPXSL2-BLK','Đen',   3490000::numeric, 20)
) AS v(slug, sku, color, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- ============================================================
-- XONG! Reload localhost:3000 để thấy 30 sản phẩm.
-- ============================================================
