// src/pages/Category/Category.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import ProductCard from "../../components/common/ProductCard/ProductCard";
import { getProductsByCategory } from "../../services/productService";
import { useCategories } from "../../context/CategoryContext";
import styles from "./Category.module.css";

const SORT_OPTIONS = [
  { value: "default",     label: "Phổ biến nhất" },
  { value: "price_asc",   label: "Giá thấp → cao" },
  { value: "price_desc",  label: "Giá cao → thấp" },
  { value: "newest",      label: "Mới nhất" },
];

const PRICE_RANGES = [
  { label: "Tất cả",            min: 0,          max: Infinity },
  { label: "Dưới 5 triệu",      min: 0,          max: 5000000 },
  { label: "5 – 10 triệu",      min: 5000000,    max: 10000000 },
  { label: "10 – 20 triệu",     min: 10000000,   max: 20000000 },
  { label: "20 – 35 triệu",     min: 20000000,   max: 35000000 },
  { label: "Trên 35 triệu",     min: 35000000,   max: Infinity },
];

const PAGE_SIZE = 10;

export default function Category() {
  const { slug } = useParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const category = categories.find((c) => c.slug === slug);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState(0); // index vào PRICE_RANGES
  const [selectedBrand, setSelectedBrand] = useState("all");

  useEffect(() => {
    setProductsLoading(true);
    setError(null);
    setPage(1);
    setPriceRange(0);
    setSelectedBrand("all");
    setSort("default");

    getProductsByCategory(slug)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setProductsLoading(false));
  }, [slug]);

  // Lấy danh sách brand có trong category
  const brands = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      if (p.brands?.name) map.set(p.brands.name, p.brands.name);
    });
    return Array.from(map.values());
  }, [products]);

  // Filter + Sort
  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceRange];
    let result = products.filter(p => {
      const inPrice = p.price >= range.min && p.price < range.max;
      const inBrand = selectedBrand === "all" || p.brands?.name === selectedBrand;
      return inPrice && inBrand;
    });

    switch (sort) {
      case "price_asc":  result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
      case "newest":     result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      default: break;
    }
    return result;
  }, [products, sort, priceRange, selectedBrand]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const loading = categoriesLoading || productsLoading;

  function handleFilterChange(type, value) {
    setPage(1);
    if (type === "price")  setPriceRange(value);
    if (type === "brand")  setSelectedBrand(value);
    if (type === "sort")   setSort(value);
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: category ? category.name : slug }]} />
        <h1 className={styles.title}>
          {category?.icon && <span style={{ marginRight: 8 }}>{category.icon}</span>}
          {category ? category.name : "Danh mục"}
          {!loading && <span className={styles.productCount}>{filtered.length} sản phẩm</span>}
        </h1>

        {!loading && products.length > 0 && (
          <div className={styles.filterWrap}>
            {/* Lọc theo giá */}
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>💰 Mức giá:</span>
              <div className={styles.filterBtns}>
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={i}
                    className={`${styles.filterBtn} ${priceRange === i ? styles.filterBtnActive : ""}`}
                    onClick={() => handleFilterChange("price", i)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lọc theo thương hiệu */}
            {brands.length > 1 && (
              <div className={styles.filterGroup}>
                <span className={styles.filterGroupLabel}>🏷️ Thương hiệu:</span>
                <div className={styles.filterBtns}>
                  <button
                    className={`${styles.filterBtn} ${selectedBrand === "all" ? styles.filterBtnActive : ""}`}
                    onClick={() => handleFilterChange("brand", "all")}
                  >
                    Tất cả
                  </button>
                  {brands.map(b => (
                    <button
                      key={b}
                      className={`${styles.filterBtn} ${selectedBrand === b ? styles.filterBtnActive : ""}`}
                      onClick={() => handleFilterChange("brand", b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sắp xếp */}
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>↕️ Sắp xếp:</span>
              <div className={styles.filterBtns}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.filterBtn} ${sort === opt.value ? styles.filterBtnActive : ""}`}
                    onClick={() => handleFilterChange("sort", opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : error ? (
          <p className={styles.empty}>Đã có lỗi: {error}</p>
        ) : paginated.length === 0 ? (
          <div className={styles.emptyFilter}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p>Không có sản phẩm phù hợp với bộ lọc.</p>
            <button
              onClick={() => { setPriceRange(0); setSelectedBrand("all"); setPage(1); }}
              style={{ marginTop: 12, color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
            >
              Xoá bộ lọc
            </button>
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
            >‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i + 1 ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(i + 1)}
              >{i + 1}</button>
            ))}
            <button
              className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ""}`}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >›</button>
          </div>
        )}
      </div>
    </main>
  );
}
