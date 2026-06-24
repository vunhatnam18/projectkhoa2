// src/pages/NewsDetail/NewsDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { getNewsBySlug, getRelatedNews } from "../../services/contentService";
import styles from "./NewsDetail.module.css";

export default function NewsDetail() {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNewsBySlug(slug)
      .then((data) => {
        setNews(data);
        getRelatedNews(slug, 4).then(setRelated).catch(() => setRelated([]));
      })
      .catch(() => setNews(null))
      .finally(() => setLoading(false));
  }, [slug]);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.skeleton} />
        </div>
      </main>
    );
  }

  if (!news) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.notFound}>
            <p>Không tìm thấy bài viết.</p>
            <Link to="/" className={styles.backLink}>← Về trang chủ</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Tin tức", href: "/" },
            { label: news.title },
          ]}
        />

        <div className={styles.layout}>
          {/* Article */}
          <article className={styles.article}>
            {news.image ? (
              <img src={news.image} alt={news.title} className={styles.coverImg} />
            ) : (
              <div className={styles.coverPlaceholder}>📰</div>
            )}

            <div className={styles.articleBody}>
              {news.category && (
                <span className={styles.category}>{news.category}</span>
              )}
              <h1 className={styles.title}>{news.title}</h1>

              <div className={styles.meta}>
                <span className={styles.metaItem}>📅 {formatDate(news.published_at)}</span>
                {news.author && (
                  <span className={styles.metaItem}>✍️ {news.author}</span>
                )}
                {news.view_count && (
                  <span className={styles.metaItem}>👁 {news.view_count} lượt xem</span>
                )}
              </div>

              <div className={styles.content}>
                {news.content
                  ? news.content.split("\n").map((para, i) =>
                      para.trim() ? <p key={i}>{para}</p> : null
                    )
                  : <p>{news.summary || "Nội dung đang được cập nhật..."}</p>
                }
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {related.length > 0 && (
              <div className={styles.sideCard}>
                <h3 className={styles.sideTitle}>Tin tức liên quan</h3>
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/tin-tuc/${item.slug}`}
                    className={styles.relatedItem}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className={styles.relatedThumb}
                      />
                    ) : (
                      <div className={styles.relatedThumbPlaceholder}>📰</div>
                    )}
                    <div className={styles.relatedInfo}>
                      <p className={styles.relatedTitle}>{item.title}</p>
                      <span className={styles.relatedDate}>
                        {formatDate(item.published_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
