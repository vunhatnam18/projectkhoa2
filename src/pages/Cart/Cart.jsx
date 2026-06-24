// src/pages/Cart/Cart.jsx
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../utils/format";
import styles from "./Cart.module.css";

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <main className={styles.main}>
        <div className="container">
          <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🛒</div>
            <p className={styles.emptyText}>Giỏ hàng của bạn đang trống</p>
            <p className={styles.emptySubtext}>Hãy thêm sản phẩm yêu thích vào giỏ hàng nhé!</p>
            <Link to="/" className={styles.shopBtn}>Tiếp tục mua sắm</Link>
          </div>
        </div>
      </main>
    );
  }

  const shippingFee = totalPrice >= 300000 ? 0 : 30000;
  const remaining = 300000 - totalPrice; // số tiền còn thiếu để miễn ship
  const progress = Math.min((totalPrice / 300000) * 100, 100);

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
        <h1 className={styles.title}>Giỏ hàng ({totalItems} sản phẩm)</h1>

        {/* Banner miễn phí ship */}
        <div className={`${styles.shipBanner} ${shippingFee === 0 ? styles.shipBannerDone : ""}`}>
          {shippingFee === 0 ? (
            <span>🎉 Bạn được <strong>miễn phí vận chuyển</strong> cho đơn hàng này!</span>
          ) : (
            <span>
              🚚 Mua thêm <strong>{formatPrice(remaining)}</strong> để được <strong>miễn phí vận chuyển</strong>
            </span>
          )}
          <div className={styles.shipProgress}>
            <div className={styles.shipProgressBar} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={styles.layout}>
          {/* Danh sách sản phẩm */}
          <div className={styles.cartList}>
            <div className={styles.cartHeader}>
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
            </div>

            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                {/* Product info */}
                <div className={styles.productInfo}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className={styles.productImg} />
                  ) : (
                    <div className={styles.productImgPlaceholder}>📦</div>
                  )}
                  <div>
                    <Link to={`/san-pham/${item.slug}`} className={styles.productName}>
                      {item.name}
                    </Link>
                    <p className={styles.productPrice}>{formatPrice(item.price)}</p>
                  </div>
                </div>

                {/* Unit price */}
                <span className={styles.productPrice}>{formatPrice(item.price)}</span>

                {/* Quantity */}
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal + remove */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={styles.subtotal}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Xoá sản phẩm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

            <div className={styles.summaryRow}>
              <span>Tạm tính ({totalItems} sản phẩm)</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>

            <div className={styles.summaryRowTotal}>
              <span>Tổng cộng</span>
              <span>{formatPrice(totalPrice + shippingFee)}</span>
            </div>

            <button className={styles.checkoutBtn} onClick={() => navigate("/thanh-toan")}>
              Tiến hành thanh toán
            </button>
            <Link to="/" className={styles.continueBtn}>
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
