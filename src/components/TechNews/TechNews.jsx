// src/components/TechNews/TechNews.jsx — TOÀN BỘ FILE SAU KHI SỬA
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTechNews } from "../../services/contentService"; // ✅ đổi import
import styles from "./TechNews.module.css";

export default function TechNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTechNews(4)
      .then(setNews)
      .catch((err) => console.error("Lỗi tải tin tức:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tin công nghệ</h2>
        <Link to="/tin-tuc" className={styles.viewAll}>Xem tất cả ›</Link>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <div className={styles.grid}>
          {news.map((article) => (
            <Link key={article.id} to={`/tin-tuc/${article.slug}`} className={styles.card}>
              <div className={styles.imageWrap}>
                {article.image ? (
                  <img src={article.image} alt={article.title} className={styles.image} />
                ) : (
                  <div className={styles.imagePlaceholder}><span>📰</span></div>
                )}
                <span className={styles.category}>{article.category}</span>
              </div>
              <div className={styles.content}>
                <p className={styles.articleTitle}>{article.title}</p>
                <p className={styles.time}>{formatRelativeTime(article.published_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// Chuyển timestamp DB thành "2 giờ trước" — thay cho chuỗi tĩnh trong mock cũ
function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return "Vừa xong";
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}