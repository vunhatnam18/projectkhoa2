# HNstore – Marketplace Frontend (React + Vite + Supabase)

Giao diện thương mại điện tử tái hiện từ thiết kế tham khảo, đổi thương hiệu thành **HNstore**. Không sử dụng bất kỳ tài sản/thương hiệu của CellphoneS.

Dự án đã chuyển từ mock data sang **Supabase** (PostgreSQL + Auth + Auto REST API), theo mô hình **marketplace đa người bán** (nhiều seller, không phải 1 shop đơn lẻ).

## 🚀 Tech Stack

- **React 19** + **Vite 6**
- **React Router v6** – điều hướng SPA
- **CSS Modules** – style scoped theo component
- **Supabase** – database (PostgreSQL), Auth, auto-generated REST API
- **Context API** – chia sẻ data fetch 1 lần (categories) cho toàn app

> Ant Design **không** được dùng — UI build bằng CSS Modules thuần để khớp pixel-perfect với thiết kế gốc.

## 📦 Cài đặt

```bash
npm install
npm install @supabase/supabase-js react-router-dom

cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY (xem mục "Kết nối Supabase")

npm run dev       # http://localhost:3000
npm run build
npm run preview
```

## 🗂️ Kiến trúc thư mục

```
src/
├── components/           # Mỗi component: {Name}.jsx + {Name}.module.css
│   ├── Header/
│   ├── CategorySidebar/  # Đọc categories từ Context, không tự fetch
│   ├── HeroBanner/
│   ├── CategoryPills/
│   ├── PromoBanners/
│   ├── FlashSale/        # ⚠️ Tạm hiển thị sản phẩm mới nhất — xem ghi chú dưới
│   ├── WhyUs/
│   ├── TechNews/
│   ├── Newsletter/
│   ├── Footer/           # Dùng nội dung tĩnh trong data/mockData.js
│   └── common/
│       ├── ProductCard/
│       └── Breadcrumb/
├── pages/
│   ├── Home/
│   ├── Category/         # /danh-muc/:slug
│   └── ProductDetail/    # /san-pham/:slug
├── context/
│   └── CategoryContext.jsx   # Fetch categories 1 lần, share toàn app
├── services/
│   ├── supabaseClient.js     # Khởi tạo Supabase client
│   ├── productService.js     # Query products/variants/images/reviews
│   └── contentService.js     # Query banners/promos/news/categories
├── hooks/
│   └── useProducts.js
├── utils/
│   └── format.js
└── data/
    └── mockData.js        # CHỈ còn footerLinks (nội dung tĩnh) — xem mục dưới
```

## 🔌 Kết nối Supabase

### 1. Lấy thông tin project

Supabase Dashboard → project của bạn → **Settings** → **API**:
- `Project URL` → dán vào `VITE_SUPABASE_URL`
- `Project API keys` → copy key **`anon` `public`** (KHÔNG dùng `service_role`) → dán vào `VITE_SUPABASE_ANON_KEY`

⚠️ Lấy domain gốc, không lấy URL có sẵn `/rest/v1/` ở cuối — Supabase SDK tự thêm phần đó.

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 2. Chạy schema SQL

Trong Supabase Dashboard → **SQL Editor** → New query, chạy theo thứ tự:

| File | Khi nào chạy |
|---|---|
|đã dùng các schema mới hoàn toàn, không dùng các dữ liệu trước đó nữa
| `supabase/auth_role_schema.sql` | Chạy sau khi có bảng `users` để đăng ký lưu đúng vai trò buyer/seller |
| `supabase/cart_checkout_schema.sql` | Chạy sau schema marketplace hiện tại để thêm giỏ hàng và checkout nhiều sản phẩm |
| `supabase/admin_access_schema.sql` | Chạy sau khi tạo Auth user admin để promote role `admin` và mở RLS cho admin panel |


### 3. Đăng nhập / Đăng ký dùng Supabase Auth

Bảng `users` (public) chỉ lưu **profile** (name, phone, role) — **không** lưu password. Supabase Auth tự quản lý password ở bảng ẩn `auth.users`. Một trigger SQL (`on_auth_user_created`) tự tạo profile tương ứng mỗi khi có người `signUp` thành công.

```js
// Đăng ký
await supabase.auth.signUp({ email, password });

// Đăng nhập
await supabase.auth.signInWithPassword({ email, password });

// Lấy user hiện tại
const { data: { user } } = await supabase.auth.getUser();
```

## 🗄️ Database Schema (marketplace đa người bán)

| Bảng | Vai trò |
|---|---|
| `users` | Profile user — liên kết `auth.users`, có `role`: admin / buyer / seller |
| `addresses` | Mỗi user nhiều địa chỉ giao hàng |
| `brands` | Thương hiệu (Apple, Samsung...) |
| `categories`, `category_shortcuts` | Danh mục sản phẩm |
| `products` | Sản phẩm — có `seller_id` (ai đăng bán), `slug`, `status` (active/pending/locking) |
| `product_images` | Nhiều ảnh / sản phẩm, có `display_order` |
| `product_variants` | Biến thể (màu/size/dung lượng), giá và kho riêng từng variant |
| `reviews` | Đánh giá sản phẩm — chỉ user **đã mua và đơn hàng `delivered`** mới review được |
| `orders`, `order_items` | Đơn hàng và chi tiết từng dòng |
| `payments` | Thanh toán theo đơn hàng |
| `carts`, `cart_items` | Giỏ hàng của buyer trước khi checkout; mỗi buyer có tối đa 1 cart `active` |
| `banners`, `promos`, `news`, `newsletter_subscribers` | Nội dung trang chủ |

Row Level Security (RLS) đã bật cho mọi bảng — user chỉ thấy đơn hàng/địa chỉ của chính mình, seller chỉ sửa được sản phẩm mình đăng, sản phẩm `pending`/`locking` ẩn khỏi người mua thường.

### Admin panel

Route `/admin` là trang quản trị riêng, chỉ user có `users.role = 'admin'` truy cập được. Để tạo admin đầu tiên:

- Tạo/đăng ký một tài khoản Supabase Auth bình thường.
- Mở `supabase/admin_access_schema.sql`, đổi `admin@example.com` thành email tài khoản đó.
- Chạy file SQL trong Supabase SQL Editor.
- Đăng nhập ở `/dang-nhap`, chọn vai trò `Admin`.

### Checkout từ giỏ hàng

File `supabase/cart_checkout_schema.sql` thêm các RPC:

- `get_or_create_active_cart()` tạo/lấy giỏ hàng `active` của buyer hiện tại.
- `add_to_cart(p_variant_id, p_quantity)` thêm sản phẩm vào giỏ, tự cộng dồn nếu variant đã tồn tại.
- `checkout_cart(p_address_id, p_payment_method)` thanh toán toàn bộ sản phẩm trong giỏ.

Khi checkout, database sẽ:

- Kiểm tra user hiện tại là `buyer` và địa chỉ thuộc về buyer đó.
- Kiểm tra giỏ hàng không trống, sản phẩm còn `active`, biến thể còn đủ `stock`.
- Tạo `orders`, copy toàn bộ `cart_items` sang `order_items`, tạo dòng `payments`.
- Trừ tồn kho và chuyển cart hiện tại sang `checked_out`, sau đó tạo cart `active` mới.

## ⚠️ Phần đang để tạm / TODO

- **Flash Sale**: UI vẫn giữ nguyên (mục đích trang trí) nhưng đang hiển thị lại "sản phẩm mới nhất" qua `getLatestProducts()`, **chưa có giảm giá thật**. Khi cần làm thật, thêm bảng `flash_sales` (`product_id`, `discount_percent`, `start_at`, `end_at`) rồi đổi `getFlashSaleProducts()` trong `productService.js`.
- **soldCount**: chưa có nguồn dữ liệu — cần đếm từ `order_items` (tổng `quantity` theo `product_id`), chưa viết hàm.
- **Tìm kiếm** (`/search`), **giỏ hàng** (`/gio-hang`), **trang đăng nhập**: chưa có route, mới có ghi chú trong `App.jsx`.

## 🔌 Data còn lại trong `mockData.js`

Sau khi chuyển sang Supabase, file này **chỉ nên giữ** `footerLinks` — nội dung tĩnh (chính sách, về chúng tôi...), không cần database. Mọi export khác (`categories`, `products`, `banners`...) đã được thay bằng query Supabase trong `services/`.

## 📱 Responsive

Mobile-first, breakpoints: `480px`, `600px`, `768px`, `992px`, `1100px`.

## ✅ Đã hoàn thành

- [x] Toàn bộ UI trang chủ (Header, Banner, Promo, WhyUs, TechNews, Newsletter, Footer)
- [x] Trang danh mục, trang chi tiết sản phẩm
- [x] Kết nối Supabase: products, categories, banners, promos, news
- [x] Supabase Auth (signup/login) + auto-tạo profile qua trigger
- [x] Schema marketplace: seller, variants, reviews, addresses, orders, payments
- [x] Row Level Security cho toàn bộ bảng

## 🔜 Gợi ý tiếp theo

- [ ] Trang giỏ hàng + state quản lý cart (Context hoặc Zustand)
- [ ] Trang tìm kiếm sản phẩm
- [ ] Trang quản lý seller (CRUD sản phẩm, xem đơn hàng)
- [ ] Tích hợp thanh toán thật (VNPay/Momo) → cập nhật bảng `payments`
- [ ] Bảng `flash_sales` nếu muốn làm thật phần khuyến mãi giới hạn thời gian

## . Thêm Route Guard
Tạo 
ProtectedRoute.jsx
ProtectedRoute — chặn /gio-hang, /thanh-toan, /tai-khoan nếu chưa đăng nhập
SellerRoute — chặn /seller nếu không phải seller/admin
/admin đã có guard sẵn trong AdminLayout

## . Seed data vào Supabase
Tạo file seed.sql và chạy lên Supabase:

5 brands, 5 categories, 5 category shortcuts
3 banners, 3 promos, 4 tin tức
10 sản phẩm thực tế (iPhone, Samsung, MacBook, Dell, Sony, Logitech)

## . Fix kết nối Supabase
Tắt RLS cho các bảng public (products, banners, news...)
Cập nhật VITE_SUPABASE_ANON_KEY mới trong .env (key cũ bị 401)
Restart dev server
Kết quả cuối: trang web chạy có đầy đủ banner, categories, sản phẩm hiển thị.
