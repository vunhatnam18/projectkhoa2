// src/components/PromoBanners/PromoBanners.jsx — TOÀN BỘ FILE SAU KHI SỬA
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPromos } from "../../services/contentService"; // ✅ đổi import
import styles from "./PromoBanners.module.css";

export default function PromoBanners() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPromos()
      .then(setPromos)
      .catch((err) => console.error("Lỗi tải promos:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.skeleton} />;
  if (promos.length < 4) return null; // cần đủ 4 promo để hiển thị đúng layout

  const [main1, main2, small1, small2] = promos;

  return (
    <section className={styles.grid}>
      <PromoCard promo={main1} large />
      <PromoCard promo={main2} large />
      <div className={styles.stack}>
        <PromoCard promo={small1} small />
        <PromoCard promo={small2} small />
      </div>
    </section>
  );
}

function PromoCard({ promo, large, small }) {
  return (
    <Link
      to={promo.cta_link}
      className={`${styles.card} ${large ? styles.cardLarge : ""} ${small ? styles.cardSmall : ""}`}
      style={{ background: promo.bg_color }}
    >
      <div className={styles.cardContent}>
        <p className={styles.cardTitle}>{promo.title}</p>
        <p className={styles.cardSubtitle}>{promo.subtitle}</p>
        <span className={styles.cardCta}>{promo.cta_text}</span>
      </div>
      <div className={styles.cardImageArea}>
        <span className={styles.cardEmoji}>
          {promo.type === "trade-in" && "📲"}
          {promo.type === "installment" && "💳"}
          {promo.type === "accessory" && "🎁"}
          {promo.type === "online" && "💰"}
        </span>
      </div>
    </Link>
  );
}