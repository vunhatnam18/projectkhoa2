import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getSellerProducts,
  deleteProduct,
  getAllPendingProducts,
  approveProduct,
  rejectProduct,
  getAllOrders,
  updateOrderStatus,
} from "../../services/sellerService";
import { formatPrice } from "../../utils/format";
import ProductForm from "./ProductForm";
import styles from "./Seller.module.css";

function IcChart() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IcBox() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
}
function IcPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IcClock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IcShoppingCart() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}

const SELLER_NAV = [
  { id: "dashboard", icon: <IcChart />, label: "Tổng quan" },
  { id: "products", icon: <IcBox />,   label: "Sản phẩm của tôi" },
  { id: "add",      icon: <IcPlus />,  label: "Thêm sản phẩm" },
];

const ADMIN_NAV = [
  { id: "dashboard", icon: <IcChart />,        label: "Tổng quan" },
  { id: "pending",   icon: <IcClock />,         label: "Duyệt sản phẩm" },
  { id: "orders",    icon: <IcShoppingCart />,  label: "Quản lý đơn hàng" },
  { id: "products",  icon: <IcBox />,           label: "Sản phẩm của tôi" },
  { id: "add",       icon: <IcPlus />,          label: "Thêm sản phẩm" },
];

const STATUS_LABEL = { pending: "Chờ duyệt", active: "Đang bán", locking: "Bị khoá" };
const STATUS_CLASS = { active: styles.statusActive, pending: styles.statusPending, locking: styles.statusLocking };

const ORDER_STATUS = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
const ORDER_STATUS_LABEL = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", delivered: "Đã giao", cancelled: "Đã huỷ" };

export default function Seller() {
  const { user, profile, isSeller, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [editProduct, setEditProduct] = useState(null);

  if (authLoading) return <main className={styles.main}><div className="container"><p>Đang tải...</p></div></main>;

  if (!user || !isSeller) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.denied}>
            <div className={styles.deniedIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 className={styles.deniedTitle}>Không có quyền truy cập</h2>
            <p className={styles.deniedSub}>Trang này chỉ dành cho Seller và Admin.</p>
            <Link to="/" className={styles.homeBtn}>Về trang chủ</Link>
          </div>
        </div>
      </main>
    );
  }

  const nav = isAdmin ? ADMIN_NAV : SELLER_NAV;

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sideHeader}>
              <p className={styles.sideTitle}>{profile?.name || "Seller"}</p>
              <p className={styles.sideRole}>{isAdmin ? "Admin" : "Seller"}</p>
            </div>
            <ul className={styles.navList}>
              {nav.map(item => (
                <li key={item.id}>
                  <button
                    className={`${styles.navItem} ${tab === item.id ? styles.navItemActive : ""}`}
                    onClick={() => { setTab(item.id); setEditProduct(null); }}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {tab === "dashboard" && <DashboardTab userId={user.id} isAdmin={isAdmin} />}
            {tab === "products" && (
              <ProductsTab
                sellerId={user.id}
                onEdit={(p) => { setEditProduct(p); setTab("add"); }}
              />
            )}
            {tab === "add" && (
              <ProductForm
                sellerId={user.id}
                editData={editProduct}
                onSuccess={() => { setEditProduct(null); setTab("products"); }}
              />
            )}
            {tab === "pending" && isAdmin && <PendingTab />}
            {tab === "orders" && isAdmin && <OrdersTab />}
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Dashboard Tab ──
function DashboardTab({ userId, isAdmin }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getSellerProducts(userId).then(setProducts).catch(() => {});
  }, [userId]);

  const active = products.filter(p => p.status === "active").length;
  const pending = products.filter(p => p.status === "pending").length;

  return (
    <>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>📊 Tổng quan</h2>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Tổng sản phẩm</p>
          <p className={styles.statValue}>{products.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Đang bán</p>
          <p className={styles.statValue}>{active}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Chờ duyệt</p>
          <p className={styles.statValue}>{pending}</p>
          {pending > 0 && <p className={styles.statSub}>Cần admin duyệt</p>}
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Tài khoản</p>
          <p className={styles.statValue} style={{ fontSize: 16 }}>{isAdmin ? "Admin" : "Seller"}</p>
        </div>
      </div>
    </>
  );
}

// ── Products Tab ──
function ProductsTab({ sellerId, onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSellerProducts(sellerId)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [sellerId]);

  async function handleDelete(id) {
    if (!confirm("Bạn chắc chắn muốn xoá sản phẩm này?")) return;
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>📦 Sản phẩm của tôi</h2>
      </div>
      {loading ? <p>Đang tải...</p> : products.length === 0 ? (
        <div className={styles.empty}>Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const img = (p.product_images || []).sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
              return (
                <tr key={p.id}>
                  <td>{img ? <img src={img} className={styles.productThumb} alt={p.name} /> : <div className={styles.productThumbEmpty}>📦</div>}</td>
                  <td><p className={styles.productName}>{p.name}</p></td>
                  <td>{formatPrice(p.base_price)}</td>
                  <td>{p.categories?.name || "—"}</td>
                  <td><span className={`${styles.statusBadge} ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.editBtn} onClick={() => onEdit(p)}>Sửa</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(p.id)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

// ── Pending Tab (Admin) ──
function PendingTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPendingProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id) {
    await approveProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function handleReject(id) {
    await rejectProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>⏳ Duyệt sản phẩm ({products.length})</h2>
      </div>
      {loading ? <p>Đang tải...</p> : products.length === 0 ? (
        <div className={styles.empty}>✅ Không có sản phẩm nào chờ duyệt!</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr><th>Ảnh</th><th>Tên sản phẩm</th><th>Seller</th><th>Giá</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {products.map(p => {
              const img = (p.product_images || []).sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
              return (
                <tr key={p.id}>
                  <td>{img ? <img src={img} className={styles.productThumb} alt={p.name} /> : <div className={styles.productThumbEmpty}>📦</div>}</td>
                  <td><p className={styles.productName}>{p.name}</p></td>
                  <td style={{ fontSize: 12 }}>{p.users?.name}<br /><span style={{ color: "var(--color-text-muted)" }}>{p.users?.email}</span></td>
                  <td>{formatPrice(p.base_price)}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.editBtn} onClick={() => handleApprove(p.id)}>✅ Duyệt</button>
                      <button className={styles.deleteBtn} onClick={() => handleReject(p.id)}>❌ Từ chối</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

// ── Orders Tab (Admin) ──
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(orderId, status) {
    await updateOrderStatus(orderId, status);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }

  return (
    <>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>🛒 Quản lý đơn hàng</h2>
      </div>
      {loading ? <p>Đang tải...</p> : (
        <table className={styles.table}>
          <thead>
            <tr><th>Mã đơn</th><th>Khách hàng</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td style={{ fontSize: 13 }}>
                  <p style={{ fontWeight: 600 }}>{o.users?.name || "—"}</p>
                  <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{o.users?.email}</p>
                </td>
                <td style={{ fontSize: 12 }}>{o.addresses?.province}</td>
                <td style={{ fontWeight: 700, color: "var(--color-price)" }}>{formatPrice(o.total_amount)}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={e => handleStatusChange(o.id, e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }}
                  >
                    {ORDER_STATUS.map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
