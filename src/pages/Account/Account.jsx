// src/pages/Account/Account.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserOrders } from "../../services/orderService";
import { supabase } from "../../services/supabaseClient";
import { formatPrice } from "../../utils/format";
import ReviewModal from "../../components/common/ReviewModal/ReviewModal";
import styles from "./Account.module.css";

const STATUS_LABEL = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", delivered: "Đã giao", cancelled: "Đã huỷ" };
const STATUS_CLASS = { pending: styles.statusPending, confirmed: styles.statusConfirmed, shipping: styles.statusShipping, delivered: styles.statusDelivered, cancelled: styles.statusCancelled };

const NAV = [
  { id: "profile", icon: "👤", label: "Thông tin tài khoản" },
  { id: "orders", icon: "📦", label: "Đơn hàng của tôi" },
  { id: "logout", icon: "🚪", label: "Đăng xuất" },
];

export default function Account() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { tab: paramTab } = useParams();
  const [tab, setTab] = useState(paramTab || "profile");

  if (!user) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ marginBottom: 16 }}>Bạn chưa đăng nhập</p>
            <Link to="/dang-nhap" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Đăng nhập ngay →</Link>
          </div>
        </div>
      </main>
    );
  }

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{profile?.name?.[0]?.toUpperCase() || "U"}</div>
              <div>
                <p className={styles.userName}>{profile?.name || "Người dùng"}</p>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
            </div>
            <ul className={styles.navList}>
              {NAV.map(item => (
                <li key={item.id}>
                  <button
                    className={`${styles.navItem} ${tab === item.id ? styles.navItemActive : ""}`}
                    onClick={() => item.id === "logout" ? handleLogout() : setTab(item.id)}
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
            {tab === "profile" && <ProfileTab profile={profile} user={user} />}
            {tab === "orders" && <OrdersTab userId={user.id} />}
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Profile Tab ──
function ProfileTab({ profile, user }) {
  const [form, setForm] = useState({ name: profile?.name || "", phone: profile?.phone || "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("users").update({ name: form.name, phone: form.phone }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <h2 className={styles.contentTitle}>Thông tin tài khoản</h2>
      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.field}>
          <label className={styles.label}>Họ và tên</label>
          <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} value={user.email} disabled style={{ background: "#f5f5f5", color: "#999" }} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Số điện thoại</label>
          <input className={styles.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912345678" />
        </div>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saved ? "✅ Đã lưu" : saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </>
  );
}

// ── Orders Tab ──
function OrdersTab({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null); // { orderId, item }

  useEffect(() => {
    getUserOrders(userId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className={styles.empty}>Đang tải...</div>;
  if (orders.length === 0) return <div className={styles.empty}>Bạn chưa có đơn hàng nào.</div>;

  return (
    <>
      <h2 className={styles.contentTitle}>Đơn hàng của tôi</h2>
      <div className={styles.orderList}>
        {orders.map(order => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderCardHeader}>
              <div>
                <span className={styles.orderId}>Đơn #{order.id}</span>
                <span className={styles.orderDate}> · {new Date(order.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
              <span className={`${styles.orderStatus} ${STATUS_CLASS[order.status]}`}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <div className={styles.orderCardBody}>
              {order.order_items?.slice(0, 2).map((item, i) => {
                const product = item.product_variants?.products;
                const img = product?.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
                return (
                  <div key={i} className={styles.orderItem}>
                    {img ? <img src={img} alt={product?.name} className={styles.itemImg} /> : <div className={styles.itemImgPlaceholder}>📦</div>}
                    <p className={styles.itemName}>{product?.name}</p>
                    <span className={styles.itemQty}>x{item.quantity}</span>
                    <span className={styles.itemPrice}>{formatPrice(item.subtotal)}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.orderCardFooter}>
              <p className={styles.orderTotal}>Tổng: <span>{formatPrice(order.total_amount)}</span></p>
              {order.status === "delivered" && (
                <button className={styles.reviewBtn} onClick={() => setReviewTarget({ orderId: order.id, items: order.order_items })}>
                  ⭐ Đánh giá
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.orderId}
          items={reviewTarget.items}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </>
  );
}
