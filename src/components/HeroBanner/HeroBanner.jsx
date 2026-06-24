// src/components/HeroBanner/HeroBanner.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getHeroBanners } from "../../services/contentService";
import styles from "./HeroBanner.module.css";

const FALLBACK = [
  { id: 1, title: "HNstore", subtitle: "Công nghệ chính hãng", description: "Giá tốt mỗi ngày", bg_color: "#1a1a2e", cta_text: "Mua ngay", cta_link: "/" },
];

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getHeroBanners()
      .then((data) => setBanners(data.length > 0 ? data : FALLBACK))
      .catch(() => setBanners(FALLBACK));
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % (banners.length || 1));
  }, [banners.length]);

  const prev = () => setCurrent((c) => (c - 1 + (banners.length || 1)) % (banners.length || 1));

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return <div className={styles.bannerWrapper}><div className={styles.skeleton} /></div>;

  const banner = banners[current];

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.banner} style={{ background: banner.bg_color || "#1a1a2e" }} aria-label={`Banner: ${banner.title}`}>
        <div className={styles.content}>
          <p className={styles.brand}>✦ HNstore</p>
          <h2 className={styles.title}>{banner.title}</h2>
          {banner.subtitle && <p className={styles.subtitle}>{banner.subtitle}</p>}
          {banner.description && <p className={styles.price}>{banner.description}</p>}
          <div className={styles.badges}>
            <span className={styles.badge}>Trả góp 0%</span>
            <span className={styles.badge}>Thu cũ +2 triệu</span>
            <span className={styles.badge}>BH chính hãng</span>
          </div>
          <Link to={banner.cta_link || "/"} className={styles.cta}>{banner.cta_text || "Xem ngay"}</Link>
        </div>
        <div className={styles.imageArea}>
          {banner.image
            ? <img src={banner.image} alt={banner.title} className={styles.image} />
            : <div className={styles.imagePlaceholder}><span className={styles.placeholderIcon}>📱</span></div>
          }
        </div>
        {banners.length > 1 && (
          <>
            <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={prev} aria-label="Ảnh trước">‹</button>
            <button className={`${styles.navBtn} ${styles.navNext}`} onClick={next} aria-label="Ảnh tiếp">›</button>
          </>
        )}
      </div>
      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <button key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ""}`} onClick={() => setCurrent(i)} aria-label={`Banner ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
