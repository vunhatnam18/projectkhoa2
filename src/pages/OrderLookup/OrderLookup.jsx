// src/pages/OrderLookup/OrderLookup.jsx
import { useState } from "react";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { supabase } from "../../services/supabaseClient";
import styles from "./OrderLookup.module.css";

const STATUS_LABEL = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  done: "Giao hàng thành công",
  cancelled: "Đã hủy",
};

const STATUS_CLASS = {
  pending: styles.statusPending,
  confirmed: styles.statusPending,
  shipping: styles.statusShipping,
  done: styles.statusDone,
  cancelled: styles.statusCancelled,
};

// Các bước timeline tương ứng với trạng thái
const TIMELINE_STEPS = ["pending", "confirmed", "shipping", "done"];
const TIMELINE_LABELS = {
  pending: "Đơn hàng đã đặt",
  confirmed: "Xác nhận đơn hàng",
  shipping: "Đang giao hàng",
  done: "Giao hàng thành công",
};

function buildTimeline(currentStatus) {
  const currentIndex = TIMELINE_STEPS.indexOf(currentStatus);
  return TIMELINE_STEPS.map((step, i) => ({
    label: TIMELINE_LABELS[step],
    done: i <= currentIndex,
    active: i === currentIndex,
  }));
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

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

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) return setErrors(e2);

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, status, total_amount, created_at,
          addresses (full_name, phone, province, district, ward, street_detail),
          order_items (
            quantity, price, subtotal,
            product_variants (
              color, size, storage,
              products (name, slug)
            )
          )
        `)
        .eq("id", orderId.trim())
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      // Kiểm tra số điện thoại khớp với địa chỉ trong đơn
      const orderPhone = data.addresses?.phone || "";
      if (orderPhone.replace(/\s/g, "") !== phone.replace(/\s/g, "")) {
        setNotFound(true);
        return;
      }

      setResult(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const timeline = result ? buildTimeline(result.status) : [];

  const productSummary = result?.order_items
    ?.map((item) => {
      const v = item.product_variants;
      const variantStr = [v?.storage, v?.color, v?.size].filter(Boolean).join(" / ");
      const name = v?.products?.name || "Sản phẩm";
      return variantStr ? `${name} (${variantStr}) x${item.quantity}` : `${name} x${item.quantity}`;
    })
    .join(", ");

  const address = result?.addresses
    ? [
        result.addresses.street_detail,
        result.addresses.ward,
        result.addresses.district,
        result.addresses.province,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

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
                placeholder="Nhập mã đơn hàng"
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
                {productSummary && (
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Sản phẩm</span>
                    <span className={styles.orderValue}>{productSummary}</span>
                  </div>
                )}
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Ngày đặt</span>
                  <span className={styles.orderValue}>{formatDate(result.created_at)}</span>
                </div>
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Tổng tiền</span>
                  <span className={styles.orderValue}>{formatPrice(result.total_amount)}</span>
                </div>
                {address && (
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Địa chỉ giao</span>
                    <span className={styles.orderValue}>{address}</span>
                  </div>
                )}
                <div className={styles.orderRow}>
                  <span className={styles.orderLabel}>Trạng thái</span>
                  <span className={`${styles.orderValue} ${STATUS_CLASS[result.status] || ""}`}>
                    {STATUS_LABEL[result.status] || result.status}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              {result.status !== "cancelled" && (
                <div className={styles.timeline} style={{ marginTop: 20 }}>
                  {timeline.map((step, i) => (
                    <div key={i} className={styles.timelineItem}>
                      <div
                        className={`${styles.timelineDot} ${
                          step.active ? styles.timelineDotActive :
                          step.done ? styles.timelineDotDone : ""
                        }`}
                      />
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineLabel}>{step.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.status === "cancelled" && (
                <div className={styles.notFound} style={{ marginTop: 16 }}>
                  Đơn hàng này đã bị hủy.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
