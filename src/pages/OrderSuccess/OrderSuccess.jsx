// src/pages/OrderSuccess/OrderSuccess.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../../services/orderService";
import { formatPrice } from "../../utils/format";
import styles from "./OrderSuccess.module.css";

const STATUS_STEPS = ["pending", "confirmed", "shipping", "delivered"];
const STATUS_LABEL = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <main className={styles.main}><div className="container"><div className={styles.skeleton} /></div></main>
  );

  if (!order) return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.card} style={{ textAlign: "center" }}>
          <p>Không tìm thấy đơn hàng.</p>
          <Link to="/" className={styles.shopBtn}>Về trang chủ</Link>
        </div>
      </div>
    </main>
  );

  const addr = order.addresses;
  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Success banner */}
        <div className={styles.successBanner}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>Đặt hàng thành công!</h1>
          <p className={styles.successSub}>
            Mã đơn hàng: <strong>#{order.id}</strong>
          </p>
          <p className={styles.successSub}>
            Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Order detail */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Chi tiết đơn hàng</h2>

            {/* Status timeline */}
            <div className={styles.timeline}>
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className={styles.timelineStep}>
                  <div className={`${styles.dot} ${i <= stepIdx ? styles.dotDone : ""} ${i === stepIdx ? styles.dotActive : ""}`} />
                  <span className={`${styles.stepLabel} ${i === stepIdx ? styles.stepLabelActive : ""}`}>
                    {STATUS_LABEL[step]}
                  </span>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`${styles.line} ${i < stepIdx ? styles.lineDone : ""}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Items */}
            <div className={styles.items}>
              {order.order_items?.map((item, i) => {
                const product = item.product_variants?.products;
                const variant = item.product_variants;
                const img = product?.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
                return (
                  <div key={i} className={styles.item}>
                    {img
                      ? <img src={img} alt={product?.name} className={styles.itemImg} />
                      : <div className={styles.itemImgPlaceholder}>📦</div>
                    }
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{product?.name}</p>
                      {variant && (
                        <p className={styles.itemVariant}>
                          {[variant.storage, variant.color, variant.size].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      <p className={styles.itemQty}>x{item.quantity}</p>
                    </div>
                    <span className={styles.itemPrice}>{formatPrice(item.subtotal)}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.totalRow}>
              <span>Tổng thanh toán</span>
              <span className={styles.totalAmount}>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Address & payment */}
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Địa chỉ giao hàng</h2>
              {addr && (
                <div className={styles.addrInfo}>
                  <p><strong>{addr.full_name}</strong> · {addr.phone}</p>
                  <p>{addr.street_detail}, {addr.district}, {addr.province}</p>
                </div>
              )}
            </div>

            <div className={styles.card} style={{ marginTop: 16 }}>
              <h2 className={styles.cardTitle}>Phương thức thanh toán</h2>
              <p className={styles.paymentInfo}>
                {order.payments?.[0]?.payment_method?.toUpperCase() || "COD – Thanh toán khi nhận hàng"}
              </p>
            </div>

            <div className={styles.actions}>
              <Link to="/" className={styles.shopBtn}>Tiếp tục mua sắm</Link>
              <Link to="/tai-khoan/don-hang" className={styles.orderBtn}>Xem đơn hàng của tôi</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
