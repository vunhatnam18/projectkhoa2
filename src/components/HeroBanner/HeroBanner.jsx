// src/components/HeroBanner/HeroBanner.jsx — TOÀN BỘ FILE SAU KHI SỬA
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getHeroBanners } from "../../services/contentService"; // ✅ đổi import
import styles from "./HeroBanner.module.css";

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getHeroBanners()
      .then(setBanners)
      .catch((err) => console.error("Lỗi tải banners:", err))
      .finally(() => setLoading(false));
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (banners.length ? (c + 1) % banners.length : 0));
  }, [banners.length]);

  const prev = () => {
    setCurrent((c) => (banners.length ? (c - 1 + banners.length) % banners.length : 0));
  };

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (loading) {
    return <div className={styles.bannerWrapper}><div className={styles.skeleton} /></div>;
  }

  if (banners.length === 0) {
    return null; // không có banner nào, ẩn luôn khu vực này
  }

  const banner = banners[current];

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.banner} style={{ background: banner.bg_color }} aria-label={`Banner: ${banner.title}`}>
        <div className={styles.content}>
          <p className={styles.brand}>✦ HNstore</p>
          <h2 className={styles.title}>{banner.title}</h2>
          <p className={styles.subtitle}>{banner.subtitle}</p>
          <p className={styles.price}>{banner.description}</p>

          <div className={styles.badges}>
            <span className={styles.badge}>Trả góp 0%</span>
            <span className={styles.badge}>Thu cũ +2 triệu</span>
            <span className={styles.badge}>BH chính hãng</span>
          </div>

          <Link to={banner.cta_link} className={styles.cta}>
            {banner.cta_text}
          </Link>
        </div>

        <div className={styles.imageArea}>
          {banner.image ? (
            <img src={banner.image} alt={banner.title} className={styles.image} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span className={styles.placeholderIcon}>📱</span>
            </div>
          )}
        </div>

        <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={prev} aria-label="Ảnh trước">‹</button>
        <button className={`${styles.navBtn} ${styles.navNext}`} onClick={next} aria-label="Ảnh tiếp">›</button>
      </div>

      <div className={styles.dots}>
        {banners.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}