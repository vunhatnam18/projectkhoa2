// src/components/FlashSale/FlashSale.jsx — TOÀN BỘ FILE SAU KHI SỬA
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFlashSaleProducts } from "../../hooks/useProducts";
import { formatCountdown } from "../../utils/format";
import ProductCard from "../common/ProductCard/ProductCard";
import styles from "./FlashSale.module.css";

// ✅ Hardcode trực tiếp ở đây — không còn import từ mockData.js
// TODO: Sau này nếu muốn quản lý từ admin, thêm cột flash_sale_end_time
// vào 1 bảng settings trong Supabase rồi fetch giống các hàm khác
const FLASH_SALE_END_TIME = new Date(Date.now() + 2 * 60 * 60 * 1000 + 38 * 60 * 1000);

function useCountdown(endTime) {
  const [remaining, setRemaining] = useState(endTime - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(endTime - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return formatCountdown(Math.max(0, remaining));
}

export default function FlashSale() {
  const { products, loading } = useFlashSaleProducts();
  const { hours, minutes, seconds } = useCountdown(FLASH_SALE_END_TIME);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.lightning}>⚡</span>
          <h2 className={styles.title}>FLASH SALE</h2>
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Kết thúc sau</span>
            <div className={styles.timer}>
              <span className={styles.digit}>{hours}</span>
              <span className={styles.sep}>:</span>
              <span className={styles.digit}>{minutes}</span>
              <span className={styles.sep}>:</span>
              <span className={styles.digit}>{seconds}</span>
            </div>
          </div>
        </div>
        <Link to="/flash-sale" className={styles.viewAll}>Xem tất cả ›</Link>
      </div>

      {loading ? (
        <div className={styles.loadingRow}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <div className={styles.products}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showBadge />
          ))}
        </div>
      )}
    </section>
  );
}