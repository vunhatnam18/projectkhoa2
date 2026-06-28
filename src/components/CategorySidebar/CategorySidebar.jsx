// src/components/CategorySidebar/CategorySidebar.jsx — TOÀN BỘ FILE SAU KHI SỬA
// ============================================================

import { Link } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext"; // ✅ đổi import
import styles from "./CategorySidebar.module.css";

export default function CategorySidebar() {
  const { categories, loading, error } = useCategories(); // ✅ lấy từ Context, không tự fetch

  if (loading) {
    return (
      <nav className={styles.sidebar} aria-label="Danh mục sản phẩm">
        <div className={styles.skeleton} />
      </nav>
    );
  }

  if (error) {
    // Lỗi mạng/API — ẩn sidebar thay vì crash cả trang
    return null;
  }

  return (
    <nav className={styles.sidebar} aria-label="Danh mục sản phẩm">
      <ul className={styles.list}>
        {categories.map((cat) => (
          <li key={cat.id} className={styles.item}>
            <Link to={`/danh-muc/${cat.slug}`} className={styles.link}>
              <span className={styles.icon}>{cat.icon || "📦"}</span>
              <span className={styles.name}>{cat.name}</span>
              <span className={styles.arrow}>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
