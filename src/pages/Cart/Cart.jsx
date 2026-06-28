// src/pages/Cart/Cart.jsx
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../utils/format";
import styles from "./Cart.module.css";

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    selectedItems,
    selectedTotalItems,
    selectedTotalPrice,
    selectedIds,
    allSelected,
    removeFromCart,
    updateQuantity,
    setItemSelected,
    selectAll,
    clearSelection,
    totalItems,
    totalPrice,
    loading,
    error,
  } = useCart();

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

  const hasSelectedItems = selectedItems.length > 0;
  const shippingFee = hasSelectedItems && selectedTotalPrice >= 300000 ? 0 : 30000;
  const selectedGrandTotal = hasSelectedItems ? selectedTotalPrice + shippingFee : 0;
  const remaining = Math.max(300000 - selectedTotalPrice, 0);
  const progress = Math.min((selectedTotalPrice / 300000) * 100, 100);

  function handleToggleAll(e) {
    if (e.target.checked) selectAll();
    else clearSelection();
  }

  async function handleQuantityChange(item, quantity) {
    try {
      await updateQuantity(item.id, quantity);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemove(item) {
    try {
      await removeFromCart(item.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
        <h1 className={styles.title}>Giỏ hàng ({totalItems} sản phẩm)</h1>
        {error && <div className={styles.errorBox}>{error}</div>}

        {/* Banner miễn phí ship */}
        <div className={`${styles.shipBanner} ${hasSelectedItems && shippingFee === 0 ? styles.shipBannerDone : ""}`}>
          {!hasSelectedItems ? (
            <span>Tick sản phẩm bạn muốn thanh toán để hệ thống tính tổng tiền.</span>
          ) : shippingFee === 0 ? (
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
              <label className={styles.selectAll}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  aria-label="Chọn tất cả sản phẩm"
                />
              </label>
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
            </div>

            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <label className={styles.selectCell}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => setItemSelected(item.id, e.target.checked)}
                    aria-label={`Chọn ${item.name}`}
                  />
                </label>

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
                    {item.variantLabel && (
                      <p className={styles.variantLabel}>{item.variantLabel}</p>
                    )}
                    <p className={styles.productPrice}>{formatPrice(item.price)}</p>
                  </div>
                </div>

                {/* Unit price */}
                <span className={styles.productPrice}>{formatPrice(item.price)}</span>

                {/* Quantity */}
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    aria-label="Giảm số lượng"
                    disabled={loading}
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    aria-label="Tăng số lượng"
                    disabled={loading || (item.stock > 0 && item.quantity >= item.stock)}
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
                    onClick={() => handleRemove(item)}
                    aria-label="Xoá sản phẩm"
                    disabled={loading}
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
              <span>Đã chọn</span>
              <span>{selectedTotalItems} sản phẩm</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tạm tính đã chọn</span>
              <span>{formatPrice(selectedTotalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tổng giỏ hàng</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span>{!hasSelectedItems ? "—" : shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>

            <div className={styles.summaryRowTotal}>
              <span>Tổng thanh toán</span>
              <span>{formatPrice(selectedGrandTotal)}</span>
            </div>

            <button
              className={styles.checkoutBtn}
              onClick={() => navigate("/thanh-toan")}
              disabled={!hasSelectedItems}
            >
              Thanh toán sản phẩm đã chọn
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
