// src/pages/Search/Search.jsx
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import ProductCard from "../../components/common/ProductCard/ProductCard";
import { useSearchProducts } from "../../hooks/useProducts";
import styles from "./Search.module.css";

const SORT_OPTIONS = [
  { value: "default", label: "Phù hợp nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "newest", label: "Mới nhất" },
  { value: "best_seller", label: "Bán chạy" },
];

const PAGE_SIZE = 12;

export default function Search() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("q") || "";

  const [sort, setSort] = useState("default");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMin, setAppliedMin] = useState(null);
  const [appliedMax, setAppliedMax] = useState(null);
  const [page, setPage] = useState(1);

  // Reset trang khi keyword thay đổi
  useEffect(() => {
    setPage(1);
  }, [keyword]);

  // Dùng hook đúng cách — gọi productService qua Supabase
  const { products, loading } = useSearchProducts(keyword);

  // Lọc + sort phía client
  const filtered = useMemo(() => {
    let result = [...products];

    if (appliedMin !== null) result = result.filter((p) => p.price >= appliedMin);
    if (appliedMax !== null) result = result.filter((p) => p.price <= appliedMax);

    switch (sort) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "best_seller":
        result.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
        break;
      default:
        break;
    }

    return result;
  }, [products, sort, appliedMin, appliedMax]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleApplyPrice() {
    setAppliedMin(minPrice !== "" ? Number(minPrice) * 1000 : null);
    setAppliedMax(maxPrice !== "" ? Number(maxPrice) * 1000 : null);
    setPage(1);
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: `Tìm kiếm: ${keyword}` }]} />

        <div className={styles.headerRow}>
          <h1 className={styles.title}>
            Kết quả tìm kiếm: <span className={styles.keyword}>"{keyword}"</span>
          </h1>
          {!loading && (
            <span className={styles.resultCount}>
              {filtered.length} sản phẩm
            </span>
          )}
        </div>

        {/* Filter & Sort bar */}
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Sắp xếp:</span>
          <div className={styles.sortBtns}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.sortBtn} ${sort === opt.value ? styles.sortBtnActive : ""}`}
                onClick={() => { setSort(opt.value); setPage(1); }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className={styles.priceFilter}>
            <span className={styles.filterLabel}>Giá (nghìn đồng):</span>
            <input
              className={styles.priceInput}
              type="number"
              placeholder="Từ"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min={0}
            />
            <span>–</span>
            <input
              className={styles.priceInput}
              type="number"
              placeholder="Đến"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
            />
            <button className={styles.applyBtn} onClick={handleApplyPrice}>
              Lọc
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <p className={styles.emptyText}>Không tìm thấy sản phẩm nào</p>
            <p className={styles.emptySubtext}>Hãy thử tìm với từ khoá khác hoặc xoá bộ lọc giá.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {paginated.map((p) => (
              <ProductCard key={p.id} product={p} showBadge />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ""}`}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i + 1 ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ""}`}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
