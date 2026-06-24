// src/pages/Checkout/Checkout.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../services/orderService";
import { formatPrice } from "../../utils/format";
import styles from "./Checkout.module.css";

const PAYMENT_METHODS = [
  { id: "cod", icon: "💵", name: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt khi nhận hàng" },
  { id: "vnpay", icon: "💳", name: "VNPay", desc: "Thanh toán qua ví VNPay, thẻ ATM, Visa" },
  { id: "momo", icon: "💜", name: "Ví MoMo", desc: "Thanh toán qua ví điện tử MoMo" },
];

const PROVINCES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Tỉnh/thành khác"];

export default function Checkout() {
  const { user, profile } = useAuth();
  const { items, totalPrice, totalItems, clearCart } = useCart();
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

  const shippingFee = totalPrice >= 300000 ? 0 : 30000;
  const total = totalPrice + shippingFee;

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

    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        variantId: item.variantId || item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const order = await createOrder({
        userId: user.id,
        address,
        items: orderItems,
        totalAmount: total,
      });

      clearCart();
      navigate(`/dat-hang-thanh-cong/${order.id}`);
    } catch (err) {
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
                    className={`${styles.paymentOption} ${payment === m.id ? styles.paymentOptionActive : ""}`}
                    onClick={() => setPayment(m.id)}
                  >
                    <span className={styles.paymentIcon}>{m.icon}</span>
                    <div>
                      <p className={styles.paymentName}>{m.name}</p>
                      <p className={styles.paymentDesc}>{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Đơn hàng ({totalItems} sản phẩm)</h2>

            <div className={styles.orderItems}>
              {items.map(item => (
                <div key={item.id} className={styles.orderItem}>
                  {item.image
                    ? <img src={item.image} alt={item.name} className={styles.itemImg} />
                    : <div className={styles.itemImgPlaceholder}>📦</div>
                  }
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemQty}>x{item.quantity}</p>
                  </div>
                  <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Tổng thanh toán</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button className={styles.placeOrderBtn} onClick={handlePlaceOrder} disabled={loading}>
              {loading ? "Đang đặt hàng..." : "🛒 Đặt hàng ngay"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
