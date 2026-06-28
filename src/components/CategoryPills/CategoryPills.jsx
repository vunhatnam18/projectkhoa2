// src/components/CategoryPills/CategoryPills.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import { getCategoryShortcuts } from "../../services/contentService";
import styles from "./CategoryPills.module.css";

export default function CategoryPills() {
  const [shortcuts, setShortcuts] = useState([]);
  const { categories, loading } = useCategories();

  useEffect(() => {
    getCategoryShortcuts()
      .then(setShortcuts)
      .catch(() => setShortcuts([]));
  }, []);

  const items = shortcuts.length > 0 ? shortcuts : categories;

  if (loading && items.length === 0) {
    return (
      <section className={styles.section} aria-label="Danh mục nổi bật đang tải">
        <div className={styles.track}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={`${styles.pill} ${styles.skeleton}`} />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Danh mục nổi bật">
      <div className={styles.track}>
        {items.map((cat) => (
          <Link key={cat.id} to={`/danh-muc/${cat.slug}`} className={styles.pill}>
            <span className={styles.icon}>{cat.icon || "📦"}</span>
            <span className={styles.name}>{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
