// src/admin/layouts/AdminLayout.jsx
//
// Layout chính của Admin Panel: sidebar điều hướng (trái) + topbar (trên) +
// vùng nội dung (Outlet của React Router).
//
// Cách dùng trong router chính của bạn (ví dụ App.jsx):
//
//   import AdminLayout from './admin/layouts/AdminLayout';
//   import AdminRoutes from './admin/AdminRoutes';
//   ...
//   <Route path="/admin/*" element={<AdminLayout />}>
//     {AdminRoutes}
//   </Route>
//
// Xem chi tiết trong file src/admin/AdminRoutes.jsx

import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { supabase } from '../../services/supabaseClient';
import '../admin-tokens.css';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: IconDashboard, end: true },
  { to: '/admin/users', label: 'Khách hàng', icon: IconUsers },
  { to: '/admin/sellers', label: 'Người bán', icon: IconStore },
  { to: '/admin/products', label: 'Sản phẩm', icon: IconBox },
  { to: '/admin/orders', label: 'Đơn hàng', icon: IconReceipt },
  { to: '/admin/returns', label: 'Hoàn hàng', icon: IconReturn },
  { to: '/admin/payments', label: 'Thanh toán', icon: IconCard },
];

export default function AdminLayout() {
  const { loading, isAdmin, user } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-root adm-auth-loading">
        <div className="adm-auth-spinner" />
        <p>Đang kiểm tra quyền truy cập…</p>
      </div>
    );
  }

  if (!isAdmin) {
    // Không có quyền admin -> đưa về trang đăng nhập của app chính.
    return <Navigate to="/dang-nhap" replace state={{ from: '/admin' }} />;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/dang-nhap';
  }

  return (
    <div className="admin-root adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-logo">A</div>
          <span>Admin Console</span>
        </div>

        <nav className="adm-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `adm-nav-link ${isActive ? 'adm-nav-link-active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-spacer" />
          <div className="adm-topbar-user">
            <div className="adm-avatar">{(user?.name || 'A').charAt(0).toUpperCase()}</div>
            <div className="adm-topbar-user-info">
              <strong>{user?.name || 'Quản trị viên'}</strong>
              <span>{user?.email}</span>
            </div>
            <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon set nhỏ gọn, inline SVG (không phụ thuộc thư viện icon ngoài)
// ---------------------------------------------------------------------------

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <circle cx="17.5" cy="8.5" r="2.6" />
      <path d="M15.5 14.8c2.7.2 4.8 2.3 5 5.2" />
    </svg>
  );
}
function IconStore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 4.5 4h15L21 9.5" />
      <path d="M4 9.5v10h16v-10" />
      <path d="M9.5 19.5v-5a2.5 2.5 0 0 1 5 0v5" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v9l9 5 9-5V8" />
      <path d="M12 13v9" />
    </svg>
  );
}
function IconReceipt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}
function IconReturn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
    </svg>
  );
}
function IconChevron({ flipped }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
