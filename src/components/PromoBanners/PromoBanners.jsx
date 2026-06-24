// src/components/PromoBanners/PromoBanners.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPromos } from "../../services/contentService";
import styles from "./PromoBanners.module.css";

const TYPE_ICON = { "trade-in": "📲", installment: "💳", accessory: "🎁", online: "💰" };

export default function PromoBanners() {
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    getPromos().then(setPromos).catch(() => setPromos([]));
  }, []);

  if (promos.length === 0) return null;

  const [main1, main2, small1, small2] = promos;

  return (
    <section className={styles.grid}>
      {main1 && <PromoCard promo={main1} large />}
      {main2 && <PromoCard promo={main2} large />}
      {(small1 || small2) && (
        <div className={styles.stack}>
          {small1 && <PromoCard promo={small1} small />}
          {small2 && <PromoCard promo={small2} small />}
        </div>
      )}
    </section>
  );
}

function PromoCard({ promo, large, small }) {
  return (
    <Link
      to={promo.cta_link || "/"}
      className={`${styles.card} ${large ? styles.cardLarge : ""} ${small ? styles.cardSmall : ""}`}
      style={{ background: promo.bg_color || "#c0392b" }}
    >
      <div className={styles.cardContent}>
        <p className={styles.cardTitle}>{promo.title}</p>
        {promo.subtitle && <p className={styles.cardSubtitle}>{promo.subtitle}</p>}
        <span className={styles.cardCta}>{promo.cta_text || "Xem ngay"}</span>
      </div>
      <div className={styles.cardImageArea}>
        <span className={styles.cardEmoji}>{TYPE_ICON[promo.type] || "🎁"}</span>
      </div>
    </Link>
  );
}
