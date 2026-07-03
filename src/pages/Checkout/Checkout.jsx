// src/pages/Checkout/Checkout.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { checkoutSelectedCartItems } from "../../services/orderService";
import { formatPrice } from "../../utils/format";
import styles from "./Checkout.module.css";

const PAYMENT_METHODS = [
  { id: "cod", icon: "💵", name: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt khi nhận hàng" },
  { id: "wallet", icon: "👛", name: "Ví HNstore", desc: "Trừ trực tiếp từ số dư ví của bạn" },
  { id: "vnpay", icon: "💳", name: "VNPay (Sắp hỗ trợ)", desc: "Tính năng đang phát triển", disabled: true },
  { id: "momo", icon: "💜", name: "Ví MoMo (Sắp hỗ trợ)", desc: "Tính năng đang phát triển", disabled: true },
];

const PROVINCES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Tỉnh/thành khác"];

export default function Checkout() {
  const { user, profile } = useAuth();
  const {
    items,
    selectedItems,
    selectedTotalPrice,
    selectedTotalItems,
    clearSelectedItems,
    loading: cartLoading,
  } = useCart();
  const {
    balance,
    loading: walletLoading,
    actionLoading: walletActionLoading,
    withdraw,
    deposit,
    refreshWallet,
  } = useWallet();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: profile?.name || "",
    phone: profile?.phone || "",
    province: "",
    district: "",
    ward: "",
    streetDetail: "",
  });
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const hasSelectedItems = selectedItems.length > 0;
  const shippingFee = selectedTotalPrice >= 300000 ? 0 : 30000;
  const total = hasSelectedItems ? selectedTotalPrice + shippingFee : 0;
  const walletInsufficient = payment === "wallet" && !walletLoading && balance < total;

  // Chưa đăng nhập
  if (!user) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.loginRequired}>
            <p>Bạn cần đăng nhập để tiến hành thanh toán</p>
            <Link to="/dang-nhap" state={{ from: "/thanh-toan" }} className={styles.loginBtn}>
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (cartLoading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.loginRequired}>
            <p>Đang tải giỏ hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  // Giỏ hàng trống
  if (items.length === 0) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.loginRequired}>
            <p>Giỏ hàng trống, không thể thanh toán</p>
            <Link to="/" className={styles.loginBtn}>Tiếp tục mua sắm</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!hasSelectedItems) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.loginRequired}>
            <p>Bạn chưa chọn sản phẩm nào để thanh toán</p>
            <Link to="/gio-hang" className={styles.loginBtn}>Quay lại giỏ hàng</Link>
          </div>
        </div>
      </main>
    );
  }

  function validate() {
    const e = {};
    if (!address.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!address.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^0[3-9]\d{8}$/.test(address.phone)) e.phone = "Số điện thoại không hợp lệ";
    if (!address.province) e.province = "Vui lòng chọn tỉnh/thành";
    if (!address.district.trim()) e.district = "Vui lòng nhập quận/huyện";
    if (!address.streetDetail.trim()) e.streetDetail = "Vui lòng nhập địa chỉ cụ thể";
    return e;
  }

  function handleAddressChange(e) {
    setAddress(a => ({ ...a, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  async function handlePlaceOrder() {
    const e2 = validate();
    if (Object.keys(e2).length > 0) return setErrors(e2);
    if (walletInsufficient) {
      alert("Số dư ví không đủ để thanh toán đơn hàng này.");
      return;
    }

    setLoading(true);
    let walletTransactionId = null;
    let walletDebited = false;
    try {
      const orderItems = selectedItems.map(item => ({
        cartItemId: item.cartItemId || item.id,
        variantId: item.variantId || item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      if (payment === "wallet") {
        const walletResult = await withdraw(total, "Thanh toán đơn hàng HNstore");
        walletTransactionId = walletResult.transactionId;
        walletDebited = true;
      }

      const order = await checkoutSelectedCartItems({
        cartItemIds: orderItems.map((item) => item.cartItemId),
        address,
        paymentMethod: payment,
        paymentStatus: payment === "wallet" ? "paid" : "pending",
        transactionId: walletTransactionId ? String(walletTransactionId) : null,
        paidAt: payment === "wallet" ? new Date().toISOString() : null,
        shippingFee,
        fallback: {
          userId: user.id,
          items: orderItems,
          totalAmount: total,
        },
      });

      if (payment === "wallet") {
        await refreshWallet();
      }
      await clearSelectedItems();
      navigate(`/dat-hang-thanh-cong/${order.id}`);
    } catch (err) {
      if (walletDebited) {
        try {
          await deposit(total, "Hoàn tiền do đặt hàng thất bại");
          await refreshWallet();
        } catch {
          alert("Đặt hàng thất bại và hoàn tiền ví tự động chưa thành công. Vui lòng liên hệ hỗ trợ.");
          setLoading(false);
          return;
        }
      }
      alert("Đặt hàng thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Giỏ hàng", href: "/gio-hang" }, { label: "Thanh toán" }]} />

        <div className={styles.layout}>
          {/* Left: form */}
          <div>
            {/* Địa chỉ giao hàng */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>📍 Địa chỉ giao hàng</h2>
              <div className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Họ và tên *</label>
                    <input name="fullName" className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                      placeholder="Nguyễn Văn A" value={address.fullName} onChange={handleAddressChange} />
                    {errors.fullName && <span className={styles.errorMsg}>{errors.fullName}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Số điện thoại *</label>
                    <input name="phone" className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                      placeholder="0912345678" value={address.phone} onChange={handleAddressChange} />
                    {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Tỉnh / Thành phố *</label>
                    <select name="province" className={`${styles.select} ${errors.province ? styles.inputError : ""}`}
                      value={address.province} onChange={handleAddressChange}>
                      <option value="">-- Chọn tỉnh/thành --</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <span className={styles.errorMsg}>{errors.province}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Quận / Huyện *</label>
                    <input name="district" className={`${styles.input} ${errors.district ? styles.inputError : ""}`}
                      placeholder="Cầu Giấy" value={address.district} onChange={handleAddressChange} />
                    {errors.district && <span className={styles.errorMsg}>{errors.district}</span>}
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Phường / Xã</label>
                    <input name="ward" className={styles.input}
                      placeholder="Dịch Vọng" value={address.ward} onChange={handleAddressChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Địa chỉ cụ thể *</label>
                    <input name="streetDetail" className={`${styles.input} ${errors.streetDetail ? styles.inputError : ""}`}
                      placeholder="Số nhà, tên đường..." value={address.streetDetail} onChange={handleAddressChange} />
                    {errors.streetDetail && <span className={styles.errorMsg}>{errors.streetDetail}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>💳 Phương thức thanh toán</h2>
              <div className={styles.paymentList}>
                {PAYMENT_METHODS.map(m => (
                  <div
                    key={m.id}
                    className={`${styles.paymentOption} ${payment === m.id ? styles.paymentOptionActive : ""} ${
                      m.id === "wallet" && walletInsufficient ? styles.paymentOptionError : ""
                    } ${m.disabled ? styles.paymentOptionDisabled : ""}`}
                    onClick={() => !m.disabled && setPayment(m.id)}
                  >
                    <span className={styles.paymentIcon}>{m.icon}</span>
                    <div>
                      <p className={styles.paymentName}>{m.name}</p>
                      <p className={styles.paymentDesc}>{m.desc}</p>
                      {m.id === "wallet" && user && !m.disabled && (
                        <p className={walletInsufficient ? styles.paymentWarning : styles.paymentMeta}>
                          {walletLoading
                            ? "Đang tải số dư ví..."
                            : `Số dư: ${formatPrice(balance)}${
                                walletInsufficient ? " - Không đủ để thanh toán" : ""
                              }`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Đơn hàng ({selectedTotalItems} sản phẩm)</h2>

            <div className={styles.orderItems}>
              {selectedItems.map(item => (
                <div key={item.id} className={styles.orderItem}>
                  {item.image
                    ? <img src={item.image} alt={item.name} className={styles.itemImg} />
                    : <div className={styles.itemImgPlaceholder}>📦</div>
                  }
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    {item.variantLabel && <p className={styles.itemQty}>{item.variantLabel}</p>}
                    <p className={styles.itemQty}>x{item.quantity}</p>
                  </div>
                  <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{formatPrice(selectedTotalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Tổng thanh toán</span>
              <span>{formatPrice(total)}</span>
            </div>
            {payment === "wallet" && (
              <div className={styles.walletSummary}>
                <span>Số dư ví</span>
                <strong>{walletLoading ? "Đang tải..." : formatPrice(balance)}</strong>
              </div>
            )}

            <button
              className={styles.placeOrderBtn}
              onClick={handlePlaceOrder}
              disabled={loading || walletActionLoading || walletInsufficient}
            >
              {loading || walletActionLoading ? "Đang đặt hàng..." : "🛒 Đặt hàng ngay"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
