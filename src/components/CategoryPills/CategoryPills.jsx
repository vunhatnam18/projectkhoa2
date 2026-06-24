// src/components/CategoryPills/CategoryPills.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategoryShortcuts } from "../../services/contentService";
import styles from "./CategoryPills.module.css";

export default function CategoryPills() {
  const [shortcuts, setShortcuts] = useState([]);

  useEffect(() => {
    getCategoryShortcuts()
      .then(setShortcuts)
      .catch(() => setShortcuts([]));
  }, []);

  if (shortcuts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.track}>
        {shortcuts.map((cat) => (
          <Link key={cat.id} to={`/danh-muc/${cat.slug}`} className={styles.pill}>
            <span className={styles.icon}>{cat.icon}</span>
            <span className={styles.name}>{cat.name}</span>
          </Link>
        ))}
        <Link to="/danh-muc" className={`${styles.pill} ${styles.pillMore}`}>
          <span className={styles.icon}>···</span>
          <span className={styles.name}>Xem thêm</span>
        </Link>
      </div>
    </section>
  );
}
