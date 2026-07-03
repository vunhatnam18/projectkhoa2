// src/pages/AllCategories/AllCategories.jsx
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { useCategories } from "../../context/CategoryContext";
import styles from "./AllCategories.module.css";

export default function AllCategories() {
  const { categories, loading } = useCategories();

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Tất cả danh mục" }]} />
        <h1 className={styles.title}>Danh mục sản phẩm</h1>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className={styles.empty}>Chưa có danh mục nào.</p>
        ) : (
          <div className={styles.grid}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/danh-muc/${cat.slug}`}
                className={styles.card}
              >
                <div className={styles.icon}>{cat.icon || "📦"}</div>
                <p className={styles.name}>{cat.name}</p>
                <span className={styles.arrow}>Xem ngay →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
