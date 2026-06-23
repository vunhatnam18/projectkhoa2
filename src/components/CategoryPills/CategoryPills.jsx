// src/components/CategoryPills/CategoryPills.jsx — TOÀN BỘ FILE SAU KHI SỬA
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategoryShortcuts } from "../../services/contentService"; // ✅ đổi import
import styles from "./CategoryPills.module.css";

export default function CategoryPills() {
  const [shortcuts, setShortcuts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoryShortcuts()
      .then(setShortcuts)
      .catch((err) => console.error("Lỗi tải category shortcuts:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className={styles.section}><div className={styles.skeleton} /></section>;
  }

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