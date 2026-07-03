// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import Category from "./pages/Category/Category";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import Search from "./pages/Search/Search";
import Auth from "./pages/Auth/Auth";
import NewsDetail from "./pages/NewsDetail/NewsDetail";
import Store from "./pages/Store/Store";
import OrderLookup from "./pages/OrderLookup/OrderLookup";
import Shipping from "./pages/Shipping/Shipping";
import Account from "./pages/Account/Account";
import Wallet from "./pages/Wallet/Wallet";
import AllCategories from "./pages/AllCategories/AllCategories";
import Seller from "./pages/Seller/Seller";
import AdminLayout from "./admin/layouts/AdminLayout";
import DashBoard from "./admin/pages/DashBoard/DashBoard";
import UsersPage from "./admin/pages/UsersPage/UsersPage";
import UserDetailPage from "./admin/pages/UserDetailPage/UserDetailPage";
import SellerPage from "./admin/pages/SellerPage/SellerPage";
import SellerDetailPage from "./admin/pages/SellerDetailPage/SellerDetailPage";
import ProductPage from "./admin/pages/ProductsPage/ProductPage";
import ProductDetailPage from "./admin/pages/ProductDetailPage/ProductDetailPage";
import OrdersPage from "./admin/pages/OrdersPage/OrdersPage";
import OrderDetailPage from "./admin/pages/OrderDetailPage/OrderDetailPage";
import PaymentsPage from "./admin/pages/PaymentsPage/PaymentsPage";
import { ProtectedRoute, SellerRoute } from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { ToastProvider } from "./components/Toast/Toast";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import "./index.css";

function NotFound() {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 20px",
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    }}>
      <div style={{ fontSize: 80, lineHeight: 1 }}>🔍</div>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)" }}>404</h2>
      <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 360 }}>
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/" style={{
          display: "inline-block",
          padding: "11px 28px",
          background: "var(--color-primary)",
          color: "#fff",
          borderRadius: "var(--radius-sm)",
          fontWeight: 700,
          fontSize: 14,
        }}>
          ← Về trang chủ
        </a>
        <a href="/search" style={{
          display: "inline-block",
          padding: "11px 28px",
          border: "1.5px solid var(--color-primary)",
          color: "var(--color-primary)",
          borderRadius: "var(--radius-sm)",
          fontWeight: 700,
          fontSize: 14,
        }}>
          🔍 Tìm kiếm
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <CategoryProvider>
            <CartProvider>
              <ToastProvider>
                <ScrollToTop />
                <AppRoutes />
              </ToastProvider>
            </CartProvider>
          </CategoryProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/danh-muc" element={<AllCategories />} />
        <Route path="/danh-muc/:slug" element={<Category />} />
        <Route path="/san-pham/:slug" element={<ProductDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/dang-nhap" element={<Auth />} />
        <Route path="/dang-ky" element={<Auth initialTab="register" />} />
        <Route path="/tin-tuc/:slug" element={<NewsDetail />} />
        <Route path="/cua-hang" element={<Store />} />
        <Route path="/tra-cuu-don-hang" element={<OrderLookup />} />
        <Route path="/giao-hang" element={<Shipping />} />

        {/* Routes yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/gio-hang" element={<Cart />} />
          <Route path="/thanh-toan" element={<Checkout />} />
          <Route path="/dat-hang-thanh-cong/:id" element={<OrderSuccess />} />
          <Route path="/tai-khoan" element={<Account />} />
          <Route path="/tai-khoan/:tab" element={<Account />} />
          <Route path="/vi" element={<Wallet />} />
        </Route>

        {/* Routes yêu cầu seller / admin */}
        <Route element={<SellerRoute />}>
          <Route path="/seller" element={<Seller />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashBoard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="sellers" element={<SellerPage />} />
          <Route path="sellers/:sellerId" element={<SellerDetailPage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
}
