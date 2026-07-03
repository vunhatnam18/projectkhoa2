# HNstore – Sàn thương mại điện tử

Dự án cuối khoá — sàn thương mại điện tử đa người bán xây dựng bằng **React + Vite + Supabase**.

## 🚀 Tech Stack

| Công nghệ | Vai trò |
|---|---|
| React 19 + Vite 6 | Frontend framework + build tool |
| React Router v6 | Điều hướng SPA |
| CSS Modules | Style scoped theo component, không dùng UI library |
| Supabase | PostgreSQL database + Auth + REST API + Storage |
| Context API | Quản lý state: Auth, Cart, Wallet, Categories |

## ✨ Tính năng

### Người mua (Buyer)
- Duyệt sản phẩm theo danh mục, tìm kiếm
- Xem chi tiết sản phẩm, chọn variant (màu/dung lượng/size)
- Giỏ hàng: thêm/xoá/chỉnh số lượng, chọn từng sản phẩm để thanh toán
- Giỏ hàng local (chưa đăng nhập) → tự sync lên Supabase khi đăng nhập
- Thanh toán: COD hoặc Ví HNstore, kèm địa chỉ giao hàng
- Ví điện tử: nạp/rút mô phỏng, xem lịch sử giao dịch
- Tài khoản: xem/sửa thông tin, xem đơn hàng, đánh giá sản phẩm đã mua
- Tra cứu đơn hàng theo mã + số điện thoại

### Người bán (Seller)
- Dashboard tổng quan: số sản phẩm đang bán / chờ duyệt
- CRUD sản phẩm: thêm, sửa, xoá, upload ảnh lên Supabase Storage
- Thêm variant: màu sắc, dung lượng, giá, tồn kho

### Quản trị viên (Admin)
- Admin Panel riêng tại `/admin` (không có Header/Footer shop)
- Dashboard: thống kê user, sản phẩm, đơn hàng, doanh thu, biểu đồ 14 ngày
- Quản lý người dùng: xem, đổi role, xoá
- Quản lý seller: xem báo cáo doanh thu theo seller
- Duyệt sản phẩm: approve/reject sản phẩm của seller
- Quản lý đơn hàng: xem chi tiết, cập nhật trạng thái
- Quản lý thanh toán: hoàn tiền tự động về ví nếu đơn thanh toán bằng ví

## 📦 Cài đặt & Chạy

```bash
# 1. Clone và cài dependencies
git clone <repo-url>
cd Project-K2-Mindx
npm install

# 2. Tạo file .env
cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY

# 3. Chạy dev server
npm run dev       # http://localhost:3000
```

## 🔌 Kết nối Supabase

Vào Supabase Dashboard → project → **Settings → API Keys**:
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = **Publishable key** (default)

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 🗄️ Schema SQL

Chạy theo thứ tự trong **Supabase SQL Editor**:

| File | Mô tả |
|---|---|
| `supabase/auth_role_schema.sql` | Trigger tạo profile khi đăng ký, RLS theo role |
| `supabase/storage_schema.sql` | Bucket `product-images` cho seller upload ảnh |
| `supabase/cart_checkout_schema.sql` | Giỏ hàng, RPC checkout atomic |
| `supabase/wallet_schema.sql` | Ví điện tử, lịch sử giao dịch, RPC nạp/rút/hoàn tiền |
| `supabase/admin_access_schema.sql` | Promote role admin, mở quyền admin panel |
| `seed.sql` | Dữ liệu mẫu: brands, categories, banners, promos, news, 10 sản phẩm |

## 🗂️ Kiến trúc thư mục

```
src/
├── admin/                  # Admin Panel độc lập
│   ├── layouts/            # AdminLayout (sidebar + topbar)
│   ├── pages/              # Dashboard, Users, Sellers, Products, Orders, Payments
│   ├── hooks/              # useAdminAuth
│   └── lib/                # adminApi.js — tất cả queries admin
├── components/
│   ├── Header/             # Topbar + search + cart badge + wallet balance
│   ├── Footer/
│   ├── Toast/              # Toast notification (thay thế alert)
│   ├── ScrollToTop.jsx     # Auto scroll khi chuyển trang
│   ├── ProtectedRoute.jsx  # Route guard: user / seller / admin
│   └── common/
│       ├── ProductCard/
│       ├── Breadcrumb/
│       └── ReviewModal/
├── context/
│   ├── AuthContext.jsx     # Supabase session + user profile + role flags
│   ├── CartContext.jsx     # Giỏ hàng: server (Supabase) cho buyer đăng nhập, localStorage cho khách
│   ├── CategoryContext.jsx # Fetch categories 1 lần, share toàn app
│   └── WalletContext.jsx   # Số dư ví, deposit/withdraw actions
├── pages/
│   ├── Home/               # Trang chủ: banner, category pills, flash sale, promo, news
│   ├── Category/           # /danh-muc/:slug — lọc + sort + phân trang
│   ├── AllCategories/      # /danh-muc — grid tất cả danh mục
│   ├── ProductDetail/      # /san-pham/:slug — gallery, variants, add to cart
│   ├── Cart/               # Checkbox chọn, tính tiền theo lựa chọn
│   ├── Checkout/           # Form địa chỉ + thanh toán COD/Ví
│   ├── OrderSuccess/       # Timeline trạng thái đơn hàng
│   ├── Account/            # Profile, lịch sử đơn hàng, đánh giá
│   ├── Wallet/             # Nạp/rút ví, lịch sử giao dịch
│   ├── Auth/               # Đăng nhập / Đăng ký / Quên mật khẩu
│   ├── Search/             # Tìm kiếm + lọc giá + sort
│   ├── OrderLookup/        # Tra cứu đơn hàng bằng mã + SĐT
│   ├── Seller/             # Dashboard seller + CRUD sản phẩm
│   ├── Store/              # Hệ thống cửa hàng + bản đồ
│   ├── Shipping/           # Chính sách giao hàng
│   └── NewsDetail/         # Bài viết tin tức
├── services/
│   ├── supabaseClient.js
│   ├── productService.js   # CRUD products, search, normalizeProduct
│   ├── contentService.js   # banners, promos, news, categories
│   ├── orderService.js     # createOrder, checkout RPC, getUserOrders
│   ├── cartService.js      # getCartItems, addCartItem, RPC cart
│   ├── walletService.js    # getWallet, deposit, withdraw, transactions
│   └── sellerService.js    # seller CRUD + admin functions
└── hooks/
    └── useProducts.js      # useFlashSaleProducts, useProductsByCategory, useSearchProducts
```

## 🔐 Bảo mật

- **Row Level Security** bật trên toàn bộ bảng — user chỉ đọc/sửa dữ liệu của mình
- **Route guard** phía frontend: ProtectedRoute (user), SellerRoute (seller/admin), AdminLayout (admin)
- **SECURITY DEFINER RPCs** có kiểm tra `auth.uid()` và role trước khi thực thi
- **Wallet**: compensating transaction — nếu đặt hàng thất bại sau khi đã trừ ví, tự động hoàn tiền

## 👥 Tài khoản test

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | *(xem Supabase Auth)* | Đặt qua SQL hoặc "Send recovery email" |
| Seller | seller@hnstore.vn | *(seed data — đặt qua Supabase Auth)* |
| Buyer | Đăng ký tại `/dang-ky` | Tự tạo |
