// src/components/TechNews/TechNews.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTechNews } from "../../services/contentService";
import styles from "./TechNews.module.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Vừa xong";
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export default function TechNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTechNews(4).then(setNews).catch(() => setNews([])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className={styles.section}>
      <div className={styles.header}><h2 className={styles.title}>Tin công nghệ</h2></div>
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
      </div>
    </section>
  );

  if (news.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tin công nghệ</h2>
        <Link to="/tin-tuc" className={styles.viewAll}>Xem tất cả ›</Link>
      </div>
      <div className={styles.grid}>
        {news.map((article) => (
          <Link key={article.id} to={`/tin-tuc/${article.slug}`} className={styles.card}>
            <div className={styles.imageWrap}>
              {article.image
                ? <img src={article.image} alt={article.title} className={styles.image} />
                : <div className={styles.imagePlaceholder}><span>📰</span></div>
              }
              {article.category && <span className={styles.category}>{article.category}</span>}
            </div>
            <div className={styles.content}>
              <p className={styles.articleTitle}>{article.title}</p>
              <p className={styles.time}>{formatDate(article.published_at)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
