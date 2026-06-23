// src/pages/OrderLookup/OrderLookup.jsx
import { useState } from "react";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import styles from "./OrderLookup.module.css";

// Mock data để demo giao diện
const MOCK_ORDERS = {
  "HN2024001": {
    id: "HN2024001",
    date: "20/06/2026",
    product: "iPhone 15 Pro Max 256GB",
    total: "34.990.000đ",
    status: "shipping",
    statusLabel: "Đang giao hàng",
    address: "15 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    timeline: [
      { label: "Đơn hàng đã đặt", date: "20/06/2026 10:30", done: true },
      { label: "Xác nhận đơn hàng", date: "20/06/2026 11:00", done: true },
      { label: "Đang giao hàng", date: "21/06/2026 08:00", done: true, active: true },
      { label: "Giao hàng thành công", date: "", done: false },
    ],
  },
  "HN2024002": {
    id: "HN2024002",
    date: "18/06/2026",
    product: "MacBook Air M2 16GB",
    total: "28.990.000đ",
    status: "done",
    statusLabel: "Đã giao thành công",
    address: "102 Xuân Thủy, Cầu Giấy, Hà Nội",
    timeline: [
      { label: "Đơn hàng đã đặt", date: "18/06/2026 09:00", done: true },
      { label: "Xác nhận đơn hàng", date: "18/06/2026 09:30", done: true },
      { label: "Đang giao hàng", date: "19/06/2026 07:00", done: true },
      { label: "Giao hàng thành công", date: "19/06/2026 14:30", done: true },
    ],
  },
};

const STATUS_CLASS = {
  pending: styles.statusPending,
  shipping: styles.statusShipping,
  done: styles.statusDone,
  cancelled: styles.statusCancelled,
};

export default function OrderLookup() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!orderId.trim()) e.orderId = "Vui lòng nhập mã đơn hàng";
    if (!phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0[3-9]\d{8})$/.test(phone)) e.phone = "Số điện thoại không hợp lệ";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) return setErrors(e2);

    setLoading(true);
    setResult(null);
    setNotFound(false);

    // TODO: gọi API tra cứu đơn hàng thật
    setTimeout(() => {
      const order = MOCK_ORDERS[orderId.toUpperCase()];
      if (order) {
        setResult(order);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }, 800);
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Tra cứu đơn hàng" }]} />

        <div className={styles.card}>
          <div className={styles.iconWrap}>📋</div>
          <h1 className={styles.title}>Tra cứu đơn hàng</h1>
          <p className={styles.subtitle}>
            Nhập mã đơn hàng và số điện thoại để kiểm tra trạng thái
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="orderId">
                Mã đơn hàng
              </label>
              <input
                id="orderId"
                className={`${styles.input} ${errors.orderId ? styles.inputError : ""}`}
                type="text"
                placeholder="Ví dụ: HN2024001"
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setErrors((err) => ({ ...err, orderId: "" }));
                }}
              />
              {errors.orderId && <span className={styles.errorMsg}>{errors.orderId}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">
                Số điện thoại đặt hàng
              </label>
              <input
                id="phone"
                className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                type="tel"
                placeholder="Ví dụ: 0912345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((err) => ({ ...err, phone: "" }));
                }}
              />
              {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Đang tra cứu..." : "🔍 Tra cứu đơn hàng"}
            </button>
          </form>

          {/* Not found */}
          {notFound && (
            <div className={styles.notFound}>
              Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng và số điện thoại.
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={styles.result}>
              <h2 className={styles.resultTitle}>Thông tin đơn hàng #{result.id}</h2>

              <div className={styles.orderInfo}>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Sản phẩm</span>
                  <span className={styles.orderValue}>{result.product}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Ngày đặt</span>
                  <span className={styles.orderValue}>{result.date}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Tổng tiền</span>
                  <span className={styles.orderValue}>{result.total}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Địa chỉ giao</span>
                  <span className={styles.orderValue}>{result.address}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Trạng thái</span>
                  <span className={`${styles.orderValue} ${STATUS_CLASS[result.status]}`}>
                    {result.statusLabel}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className={styles.timeline} style={{ marginTop: 20 }}>
                {result.timeline.map((step, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div
                      className={`${styles.timelineDot} ${
                        step.active ? styles.timelineDotActive :
                        step.done ? styles.timelineDotDone : ""
                      }`}
                    />
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineLabel}>{step.label}</p>
                      {step.date && (
                        <p className={styles.timelineDate}>{step.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
