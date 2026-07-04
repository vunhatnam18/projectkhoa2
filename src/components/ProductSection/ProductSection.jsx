import { Link } from "react-router-dom";
import { useProductsByCategory } from "../../hooks/useProducts";
import ProductCard from "../common/ProductCard/ProductCard";
import CategoryIcon from "../common/CategoryIcon/CategoryIcon";
import styles from "./ProductSection.module.css";

export default function ProductSection({ title, slug, limit = 10 }) {
  const { products, loading } = useProductsByCategory(slug);
  const displayed = products.slice(0, limit);

  if (!loading && products.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.icon}><CategoryIcon slug={slug} size={20} /></span>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <Link to={`/danh-muc/${slug}`} className={styles.viewAll}>Xem tất cả ›</Link>
      </div>
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <div className={styles.grid}>
          {displayed.map(product => <ProductCard key={product.id} product={product} showBadge />)}
        </div>
      )}
    </section>
  );
}
