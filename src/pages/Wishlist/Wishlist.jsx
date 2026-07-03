// src/pages/Wishlist/Wishlist.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import ProductCard from "../../components/common/ProductCard/ProductCard";
import styles from "./Wishlist.module.css";

const WISHLIST_KEY = "hnstore_wishlist";

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); }
  catch { return []; }
}

export default function Wishlist() {
  const [items, setItems] = useState(() => loadWishlist());

  // Lắng nghe khi localStorage thay đổi từ tab khác
  useEffect(() => {
    function onStorage(e) {
      if (e.key === WISHLIST_KEY) setItems(loadWishlist());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function removeItem(slug) {
    const updated = items.filter(i => i.slug !== slug);
    setItems(updated);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  }

  function clearAll() {
    if (!confirm("Xoá tất cả sản phẩm yêu thích?")) return;
    setItems([]);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify([]));
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Sản phẩm yêu thích" }]} />

        <div className={styles.header}>
          <h1 className={styles.title}>
            ❤️ Sản phẩm yêu thích
            {items.length > 0 && <span className={styles.count}>{items.length} sản phẩm</span>}
          </h1>
          {items.length > 0 && (
            <button className={styles.clearBtn} onClick={clearAll}>Xoá tất cả</button>
          )}
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🤍</div>
            <p className={styles.emptyText}>Bạn chưa yêu thích sản phẩm nào</p>
            <p className={styles.emptySubtext}>Bấm ❤️ trên sản phẩm để thêm vào đây</p>
            <Link to="/" className={styles.shopBtn}>Khám phá sản phẩm</Link>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map(item => (
                <div key={item.slug} className={styles.itemWrap}>
                  <ProductCard product={item} showBadge />
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.slug)}
                    title="Xoá khỏi yêu thích"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <Link to="/" className={styles.continueBtn}>← Tiếp tục mua sắm</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
