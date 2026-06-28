-- ============================================================
-- SEED DATA cho HNstore — không dùng ON CONFLICT
-- ============================================================

-- BƯỚC 1: Seller giả
INSERT INTO users (id, email, name, role)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'seller@hnstore.vn', 'HNstore Official', 'seller')
ON CONFLICT (id) DO UPDATE SET role = 'seller';

-- BƯỚC 2: BRANDS
INSERT INTO brands (name, slug)
SELECT v.name, v.slug FROM (VALUES
  ('Apple',    'apple'),
  ('Samsung',  'samsung'),
  ('Sony',     'sony'),
  ('Dell',     'dell'),
  ('Logitech', 'logitech')
) AS v(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE brands.slug = v.slug);

-- BƯỚC 3: CATEGORIES
INSERT INTO categories (name, icon, slug)
SELECT v.name, v.icon, v.slug FROM (VALUES
  ('Điện thoại', '📱', 'dien-thoai'),
  ('Laptop',     '💻', 'laptop'),
  ('Tai nghe',   '🎧', 'tai-nghe'),
  ('Màn hình',   '🖥️',  'man-hinh'),
  ('Phụ kiện',   '🖱️',  'phu-kien')
) AS v(name, icon, slug)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.slug = v.slug);

-- BƯỚC 4: CATEGORY SHORTCUTS
INSERT INTO category_shortcuts (name, icon, slug)
SELECT v.name, v.icon, v.slug FROM (VALUES
  ('Điện thoại', '📱', 'dien-thoai'),
  ('Laptop',     '💻', 'laptop'),
  ('Tai nghe',   '🎧', 'tai-nghe'),
  ('Màn hình',   '🖥️',  'man-hinh'),
  ('Phụ kiện',   '🖱️',  'phu-kien')
) AS v(name, icon, slug)
WHERE NOT EXISTS (SELECT 1 FROM category_shortcuts WHERE category_shortcuts.slug = v.slug);

-- BƯỚC 5: BANNERS
INSERT INTO banners (title, subtitle, image, cta_text, cta_link, bg_color)
SELECT v.title, v.subtitle, v.image, v.cta_text, v.cta_link, v.bg_color FROM (VALUES
  ('iPhone 15 Pro Max', 'Chip A17 Pro – Khung Titan – Camera 48MP',   'https://placehold.co/1200x400/1a1a2e/fff?text=iPhone+15+Pro+Max', 'Mua ngay', '/danh-muc/dien-thoai', '#1a1a2e'),
  ('MacBook Air M3',    'Siêu mỏng – Siêu nhẹ – Pin 18 giờ',          'https://placehold.co/1200x400/16213e/fff?text=MacBook+Air+M3',    'Khám phá', '/danh-muc/laptop',      '#16213e'),
  ('Samsung Galaxy S24','Zoom 100x – AI Camera – Snapdragon 8 Gen 3', 'https://placehold.co/1200x400/0f3460/fff?text=Samsung+Galaxy+S24','Xem ngay', '/danh-muc/dien-thoai',  '#0f3460')
) AS v(title, subtitle, image, cta_text, cta_link, bg_color)
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE banners.title = v.title);

-- BƯỚC 6: PROMOS
INSERT INTO promos (title, subtitle, cta_text, cta_link, bg_color, type)
SELECT v.title, v.subtitle, v.cta_text, v.cta_link, v.bg_color, v.type FROM (VALUES
  ('Flash Sale Laptop',   'Giảm đến 30%',        'Mua ngay', '/danh-muc/laptop',   '#e94560', 'flash'),
  ('Tai nghe chính hãng', 'Miễn phí vận chuyển', 'Xem ngay', '/danh-muc/tai-nghe', '#533483', 'promo'),
  ('Phụ kiện giá tốt',    'Từ 99.000đ',           'Khám phá', '/danh-muc/phu-kien', '#2b9348', 'promo')
) AS v(title, subtitle, cta_text, cta_link, bg_color, type)
WHERE NOT EXISTS (SELECT 1 FROM promos WHERE promos.title = v.title);

-- BƯỚC 7: NEWS
INSERT INTO news (title, slug, image, category, published_at)
SELECT v.title, v.slug, v.image, v.category, v.published_at FROM (VALUES
  ('iPhone 16 ra mắt với chip A18 Pro',        'iphone-16-ra-mat',             'https://placehold.co/800x450/1a1a2e/fff?text=iPhone+16',  'Điện thoại', NOW() - INTERVAL '2 days'),
  ('Samsung Galaxy S25 Ultra benchmark khủng', 'samsung-galaxy-s25-benchmark', 'https://placehold.co/800x450/16213e/fff?text=Galaxy+S25',  'Điện thoại', NOW() - INTERVAL '5 days'),
  ('MacBook Pro M4 Max — hiệu năng phá đảo',   'macbook-pro-m4-max',           'https://placehold.co/800x450/0f3460/fff?text=MacBook+M4',  'Laptop',     NOW() - INTERVAL '7 days'),
  ('Sony WH-1000XM6 — chống ồn tốt nhất',      'sony-wh-1000xm6-review',       'https://placehold.co/800x450/533483/fff?text=Sony+XM6',    'Tai nghe',   NOW() - INTERVAL '10 days')
) AS v(title, slug, image, category, published_at)
WHERE NOT EXISTS (SELECT 1 FROM news WHERE news.slug = v.slug);

-- BƯỚC 8: PRODUCTS
INSERT INTO products (seller_id, name, slug, base_price, description, category_id, brand_id, status)
SELECT
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  v.name, v.slug, v.base_price, v.description,
  (SELECT id FROM categories WHERE categories.slug = v.cat_slug),
  (SELECT id FROM brands     WHERE brands.slug     = v.brand_slug),
  'active'
FROM (VALUES
  ('iPhone 15 Pro Max 256GB',   'iphone-15-pro-max-256gb',   34990000::numeric, 'Chip A17 Pro, khung titan, camera 48MP ProRAW.',  'dien-thoai', 'apple'),
  ('iPhone 15 128GB',           'iphone-15-128gb',           22990000::numeric, 'Chip A16 Bionic, camera 48MP, Dynamic Island.',   'dien-thoai', 'apple'),
  ('Samsung Galaxy S24 Ultra',  'samsung-galaxy-s24-ultra',  31990000::numeric, 'Snapdragon 8 Gen 3, bút S Pen, zoom 100x.',       'dien-thoai', 'samsung'),
  ('Samsung Galaxy A55 5G',     'samsung-galaxy-a55-5g',      9990000::numeric, 'Exynos 1480, camera 50MP OIS, pin 5000mAh.',      'dien-thoai', 'samsung'),
  ('MacBook Air M2 8GB 256GB',  'macbook-air-m2-8gb-256gb',  27990000::numeric, 'Chip M2, siêu mỏng 11.3mm, pin 18 giờ.',         'laptop',     'apple'),
  ('MacBook Pro M3 16GB 512GB', 'macbook-pro-m3-16gb-512gb', 44990000::numeric, 'Chip M3 Pro, màn hình XDR 14.2 inch, pin 22 giờ.','laptop',    'apple'),
  ('Dell XPS 15 i7 16GB 512GB', 'dell-xps-15-i7-16gb-512gb', 38990000::numeric, 'Core i7-13700H, RTX 4060, màn hình OLED 3.5K.',  'laptop',     'dell'),
  ('Sony WH-1000XM5',           'sony-wh-1000xm5',            7490000::numeric, 'Chống ồn hàng đầu, Bluetooth 5.2, pin 30 giờ.',  'tai-nghe',   'sony'),
  ('AirPods Pro 2nd Gen',       'airpods-pro-2nd-gen',         6490000::numeric, 'Chip H2, chống ồn 2x, vỏ sạc MagSafe USB-C.',   'tai-nghe',   'apple'),
  ('Logitech MX Master 3S',     'logitech-mx-master-3s',       2290000::numeric, 'Cảm biến 8000 DPI, cuộn MagSpeed, pin 70 ngày.', 'phu-kien',   'logitech')
) AS v(name, slug, base_price, description, cat_slug, brand_slug)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.slug = v.slug);

-- BƯỚC 9: PRODUCT IMAGES
INSERT INTO product_images (product_id, image_url, display_order)
SELECT p.id, v.image_url, 0
FROM (VALUES
  ('iphone-15-pro-max-256gb',   'https://placehold.co/600x600/1a1a2e/fff?text=iPhone+15+Pro+Max'),
  ('iphone-15-128gb',           'https://placehold.co/600x600/16213e/fff?text=iPhone+15'),
  ('samsung-galaxy-s24-ultra',  'https://placehold.co/600x600/0f3460/fff?text=Galaxy+S24'),
  ('samsung-galaxy-a55-5g',     'https://placehold.co/600x600/533483/fff?text=Galaxy+A55'),
  ('macbook-air-m2-8gb-256gb',  'https://placehold.co/600x600/2b2b2b/fff?text=MacBook+Air+M2'),
  ('macbook-pro-m3-16gb-512gb', 'https://placehold.co/600x600/1a1a1a/fff?text=MacBook+Pro+M3'),
  ('dell-xps-15-i7-16gb-512gb', 'https://placehold.co/600x600/e94560/fff?text=Dell+XPS+15'),
  ('sony-wh-1000xm5',           'https://placehold.co/600x600/2b9348/fff?text=Sony+WH-1000XM5'),
  ('airpods-pro-2nd-gen',       'https://placehold.co/600x600/333333/fff?text=AirPods+Pro+2'),
  ('logitech-mx-master-3s',     'https://placehold.co/600x600/16213e/fff?text=MX+Master+3S')
) AS v(slug, image_url)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_images.product_id = p.id);

-- BƯỚC 10: PRODUCT VARIANTS (có storage)
INSERT INTO product_variants (product_id, sku, color, storage, price, stock)
SELECT p.id, v.sku, v.color, v.storage, v.price, v.stock
FROM (VALUES
  ('iphone-15-pro-max-256gb',  'IP15PM-256-BLK', 'Titan đen',   '256GB', 34990000::numeric, 20),
  ('iphone-15-pro-max-256gb',  'IP15PM-256-WHT', 'Titan trắng', '256GB', 34990000::numeric, 15),
  ('iphone-15-pro-max-256gb',  'IP15PM-512-BLK', 'Titan đen',   '512GB', 39990000::numeric, 10),
  ('iphone-15-128gb',          'IP15-128-BLK',   'Đen',         '128GB', 22990000::numeric, 25),
  ('iphone-15-128gb',          'IP15-128-PNK',   'Hồng',        '128GB', 22990000::numeric, 20),
  ('samsung-galaxy-s24-ultra', 'S24U-256-BLK',   'Titan đen',   '256GB', 31990000::numeric, 12),
  ('samsung-galaxy-s24-ultra', 'S24U-256-GRY',   'Titan xám',   '256GB', 31990000::numeric, 10),
  ('samsung-galaxy-a55-5g',    'A55-128-BLU',    'Xanh dương',  '128GB',  9990000::numeric, 30),
  ('samsung-galaxy-a55-5g',    'A55-128-BLK',    'Đen',         '128GB',  9990000::numeric, 25),
  ('macbook-air-m2-8gb-256gb', 'MBA-M2-256-SLV', 'Bạc',         '256GB', 27990000::numeric, 10),
  ('macbook-air-m2-8gb-256gb', 'MBA-M2-512-SLV', 'Bạc',         '512GB', 32990000::numeric,  6),
  ('macbook-pro-m3-16gb-512gb','MBP-M3-512-SLV', 'Bạc',         '512GB', 44990000::numeric,  5),
  ('macbook-pro-m3-16gb-512gb','MBP-M3-512-BLK', 'Đen',         '512GB', 44990000::numeric,  4),
  ('dell-xps-15-i7-16gb-512gb','XPS15-512-SLV',  'Bạc',         '512GB', 38990000::numeric,  5)
) AS v(slug, sku, color, storage, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- BƯỚC 11: PRODUCT VARIANTS (không có storage)
INSERT INTO product_variants (product_id, sku, color, price, stock)
SELECT p.id, v.sku, v.color, v.price, v.stock
FROM (VALUES
  ('sony-wh-1000xm5',      'XM5-BLK',    'Đen',     7490000::numeric, 20),
  ('sony-wh-1000xm5',      'XM5-WHT',    'Trắng',   7490000::numeric, 15),
  ('airpods-pro-2nd-gen',  'APP2-WHT',   'Trắng',   6490000::numeric, 30),
  ('logitech-mx-master-3s','MXM3S-GRY',  'Xám đen', 2290000::numeric, 40),
  ('logitech-mx-master-3s','MXM3S-WHT',  'Trắng',   2390000::numeric, 20)
) AS v(slug, sku, color, price, stock)
JOIN products p ON p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_variants.sku = v.sku);

-- ============================================================
-- XONG! Reload localhost:3000
-- ============================================================
