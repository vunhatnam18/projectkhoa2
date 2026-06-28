// src/components/ProtectedRoute.jsx
// Bảo vệ route — chưa đăng nhập thì redirect về /dang-nhap
// Dùng: <Route element={<ProtectedRoute />}>  hoặc wrap trực tiếp element

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute  — yêu cầu đã đăng nhập
 * SellerRoute     — yêu cầu role seller hoặc admin
 */

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // chờ Supabase kiểm tra session

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function SellerRoute() {
  const { user, isSeller, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  }

  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
