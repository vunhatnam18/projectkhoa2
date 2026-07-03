// src/pages/Account/Account.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserOrders } from "../../services/orderService";
import { supabase } from "../../services/supabaseClient";
import { formatPrice } from "../../utils/format";
import ReviewModal from "../../components/common/ReviewModal/ReviewModal";
import { createReturnRequest, getReturnRequestByOrder } from "../../services/returnService";
import styles from "./Account.module.css";

const STATUS_LABEL = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", delivered: "Đã giao", cancelled: "Đã huỷ" };
const STATUS_CLASS = { pending: styles.statusPending, confirmed: styles.statusConfirmed, shipping: styles.statusShipping, delivered: styles.statusDelivered, cancelled: styles.statusCancelled };

const NAV = [
  { id: "profile",  icon: "👤", label: "Thông tin tài khoản" },
  { id: "orders",   icon: "📦", label: "Đơn hàng của tôi" },
  { id: "returns",  icon: "↩️", label: "Hoàn hàng" },
  { id: "wishlist", icon: "❤️", label: "Yêu thích" },
  { id: "password", icon: "🔒", label: "Đổi mật khẩu" },
  { id: "wallet",   icon: "💰", label: "Ví của tôi", link: "/vi" },
  { id: "logout",   icon: "🚪", label: "Đăng xuất" },
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

  function handleNavClick(item) {
    if (item.id === "logout") return handleLogout();
    if (item.link) return navigate(item.link);
    setTab(item.id);
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
                    className={`${styles.navItem} ${tab === item.id && !item.link ? styles.navItemActive : ""}`}
                    onClick={() => handleNavClick(item)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.label}
                    {item.link && <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>↗</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {tab === "profile"  && <ProfileTab profile={profile} user={user} />}
            {tab === "orders"   && <OrdersTab userId={user.id} />}
            {tab === "returns"  && <ReturnsTab userId={user.id} />}
            {tab === "wishlist" && <WishlistTab />}
            {tab === "password" && <PasswordTab />}
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
  const [saveError, setSaveError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    if (form.phone.trim() && !/^0[3-9]\d{8}$/.test(form.phone.trim())) {
      setSaveError("Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (VD: 0912345678)");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("users").update({ name: form.name, phone: form.phone.trim() || null }).eq("id", user.id);
    setSaving(false);
    if (error) {
      setSaveError("Lưu thất bại: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <>
      <h2 className={styles.contentTitle}>Thông tin tài khoản</h2>
      {saveError && <div style={{ color: "#e53935", background: "#fff5f5", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{saveError}</div>}
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

// ── Password Tab ──
function PasswordTab() {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(""); setError("");
    if (form.password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự.");
    if (form.password !== form.confirm) return setError("Mật khẩu xác nhận không khớp.");
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: form.password });
    setSaving(false);
    if (err) setError("Đổi thất bại: " + err.message);
    else { setMsg("✅ Đổi mật khẩu thành công!"); setForm({ password: "", confirm: "" }); }
  }

  return (
    <>
      <h2 className={styles.contentTitle}>Đổi mật khẩu</h2>
      {error && <div style={{ color: "#e53935", background: "#fff5f5", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {msg   && <div style={{ color: "#1a7a3a", background: "#eaffea", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{msg}</div>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Mật khẩu mới</label>
          <input className={styles.input} type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Tối thiểu 6 ký tự" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Xác nhận mật khẩu mới</label>
          <input className={styles.input} type="password" value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Nhập lại mật khẩu" />
        </div>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </form>
    </>
  );
}

// ── Wishlist Tab ──
const WISHLIST_KEY = "hnstore_wishlist";

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); }
  catch { return []; }
}

function WishlistTab() {
  const [items, setItems] = useState(() => loadWishlist());

  function removeItem(slug) {
    const updated = items.filter(i => i.slug !== slug);
    setItems(updated);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  }

  if (items.length === 0) {
    return (
      <>
        <h2 className={styles.contentTitle}>Sản phẩm yêu thích</h2>
        <div className={styles.empty}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🤍</p>
          <p>Chưa có sản phẩm yêu thích.</p>
          <Link to="/" style={{ color: "var(--color-primary)", fontWeight: 600, fontSize: 14, marginTop: 8, display: "inline-block" }}>
            Khám phá sản phẩm →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className={styles.contentTitle}>Sản phẩm yêu thích ({items.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(item => (
          <div key={item.slug} style={{
            display: "flex", gap: 14, alignItems: "center",
            border: "1.5px solid var(--color-border)", borderRadius: 8, padding: "12px 16px",
          }}>
            {item.image
              ? <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 6, border: "1px solid #eee", flexShrink: 0 }} />
              : <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📦</div>
            }
            <div style={{ flex: 1 }}>
              <Link to={`/san-pham/${item.slug}`} style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
                {item.name}
              </Link>
              {item.price > 0 && <p style={{ color: "var(--color-price)", fontWeight: 700, fontSize: 14, marginTop: 4 }}>{formatPrice(item.price)}</p>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/san-pham/${item.slug}`} style={{
                padding: "7px 14px", background: "var(--color-primary)", color: "#fff",
                borderRadius: 6, fontSize: 13, fontWeight: 600,
              }}>Xem</Link>
              <button onClick={() => removeItem(item.slug)} style={{
                padding: "7px 14px", border: "1.5px solid #ddd", borderRadius: 6,
                fontSize: 13, color: "#666", cursor: "pointer", background: "#fff",
              }}>Xoá</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Orders Tab ──
const ORDER_FILTER_OPTIONS = [
  { value: "all",       label: "Tất cả" },
  { value: "pending",   label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping",  label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "cancelled", label: "Đã huỷ" },
];

function OrdersTab({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    getUserOrders(userId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [userId]);

  function toggleExpand(orderId) {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  }

  async function handleCancelOrder(orderId) {
    if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    setCancellingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("user_id", userId);
    setCancellingId(null);
    if (error) {
      alert("Hủy đơn thất bại: " + error.message);
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    }
  }

  if (loading) return <div className={styles.empty}>Đang tải...</div>;

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <>
      <h2 className={styles.contentTitle}>Đơn hàng của tôi</h2>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {ORDER_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: "1.5px solid",
              borderColor: filter === opt.value ? "var(--color-primary)" : "var(--color-border)",
              background: filter === opt.value ? "var(--color-primary)" : "#fff",
              color: filter === opt.value ? "#fff" : "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            {opt.label}
            {opt.value !== "all" && orders.filter(o => o.status === opt.value).length > 0 && (
              <span style={{ marginLeft: 5, background: filter === opt.value ? "rgba(255,255,255,0.3)" : "#f0f0f0", borderRadius: 10, padding: "0 6px", fontSize: 11 }}>
                {orders.filter(o => o.status === opt.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Không có đơn hàng nào{filter !== "all" ? ` ở trạng thái "${ORDER_FILTER_OPTIONS.find(o => o.value === filter)?.label}"` : ""}.</div>
      ) : (
        <div className={styles.orderList}>
          {filtered.map(order => {
            const allItems = order.order_items || [];
            const isExpanded = expandedOrders[order.id];
            const displayItems = isExpanded ? allItems : allItems.slice(0, 2);
            return (
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
                  {displayItems.map((item, i) => {
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
                  {allItems.length > 2 && (
                    <button
                      onClick={() => toggleExpand(order.id)}
                      style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: 13, padding: "4px 0", fontWeight: 600 }}
                    >
                      {isExpanded ? "▲ Thu gọn" : `▼ Xem thêm ${allItems.length - 2} sản phẩm`}
                    </button>
                  )}
                </div>
                <div className={styles.orderCardFooter}>
                  <p className={styles.orderTotal}>Tổng: <span>{formatPrice(order.total_amount)}</span></p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {order.status === "pending" && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                      >
                        {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                    )}
                    {order.status === "delivered" && (
                      <>
                        <button className={styles.reviewBtn} onClick={() => setReviewTarget({ orderId: order.id, items: order.order_items })}>
                          ⭐ Đánh giá
                        </button>
                        <ReturnButton orderId={order.id} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

// ── Return Button (inline trong OrdersTab) ──
function ReturnButton({ orderId }) {
  const [existing, setExisting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getReturnRequestByOrder(orderId).then(setExisting).catch(() => {});
  }, [orderId]);

  const STATUS_MAP = { pending: "⏳ Chờ duyệt", approved: "✅ Đã duyệt", rejected: "❌ Từ chối" };

  if (existing) return (
    <span style={{ fontSize: 12, fontWeight: 600, color: existing.status === "approved" ? "#1a7a3a" : existing.status === "rejected" ? "#e53935" : "#f5a623" }}>
      {STATUS_MAP[existing.status]}
    </span>
  );

  if (done) return <span style={{ fontSize: 12, color: "#f5a623", fontWeight: 600 }}>⏳ Yêu cầu đã gửi</span>;

  if (showForm) return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Lý do hoàn hàng..."
        rows={2}
        style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1.5px solid #ddd", resize: "none", width: 200, fontFamily: "inherit" }}
      />
      <button
        onClick={async () => {
          if (!reason.trim()) return;
          setSubmitting(true);
          try { await createReturnRequest(orderId, reason); setDone(true); setShowForm(false); }
          catch (e) { alert("Lỗi: " + e.message); }
          finally { setSubmitting(false); }
        }}
        disabled={submitting || !reason.trim()}
        style={{ padding: "6px 12px", background: "#e53935", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
      >
        {submitting ? "Đang gửi..." : "Gửi"}
      </button>
      <button onClick={() => setShowForm(false)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "#fff" }}>Huỷ</button>
    </div>
  );

  return (
    <button
      onClick={() => setShowForm(true)}
      style={{ padding: "7px 14px", border: "1.5px solid #e53935", color: "#e53935", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff" }}
    >
      ↩️ Hoàn hàng
    </button>
  );
}

// ── Returns Tab ──
function ReturnsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("../../services/returnService").then(({ getMyReturnRequests }) => {
      getMyReturnRequests().then(setRequests).catch(() => setRequests([])).finally(() => setLoading(false));
    });
  }, []);

  const STATUS_LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
  const STATUS_COLOR = { pending: "#f5a623", approved: "#1a7a3a", rejected: "#e53935" };

  if (loading) return <div className={styles.empty}>Đang tải...</div>;

  return (
    <>
      <h2 className={styles.contentTitle}>Yêu cầu hoàn hàng</h2>
      {requests.length === 0 ? (
        <div className={styles.empty}>Bạn chưa có yêu cầu hoàn hàng nào.<br/><span style={{ fontSize: 12, color: "#999" }}>Yêu cầu hoàn hàng chỉ áp dụng cho đơn đã giao.</span></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.map(r => (
            <div key={r.id} style={{ border: "1.5px solid var(--color-border)", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Đơn #{r.order_id}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}><strong>Lý do:</strong> {r.reason}</p>
              {r.admin_note && <p style={{ fontSize: 13, color: "#1a7a3a" }}><strong>Phản hồi admin:</strong> {r.admin_note}</p>}
              <p style={{ fontSize: 11, color: "#999", marginTop: 6 }}>{new Date(r.created_at).toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
