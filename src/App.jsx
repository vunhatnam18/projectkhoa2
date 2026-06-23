// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import Category from "./pages/Category/Category";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Cart from "./pages/Cart/Cart";
import Search from "./pages/Search/Search";
import Auth from "./pages/Auth/Auth";
import NewsDetail from "./pages/NewsDetail/NewsDetail";
import Store from "./pages/Store/Store";
import OrderLookup from "./pages/OrderLookup/OrderLookup";
import Shipping from "./pages/Shipping/Shipping";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h2 style={{ fontSize: 28, marginBottom: 12 }}>404 – Không tìm thấy trang</h2>
      <a href="/" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
        ← Về trang chủ
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CategoryProvider>
        <CartProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/danh-muc/:slug" element={<Category />} />
            <Route path="/san-pham/:slug" element={<ProductDetail />} />
            <Route path="/gio-hang" element={<Cart />} />
            <Route path="/search" element={<Search />} />
            <Route path="/dang-nhap" element={<Auth />} />
            <Route path="/tin-tuc/:slug" element={<NewsDetail />} />
            <Route path="/cua-hang" element={<Store />} />
            <Route path="/tra-cuu-don-hang" element={<OrderLookup />} />
            <Route path="/giao-hang" element={<Shipping />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </CartProvider>
      </CategoryProvider>
    </BrowserRouter>
  );
}
