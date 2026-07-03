// src/components/common/ProductCard/ProductCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../../utils/format";
import styles from "./ProductCard.module.css";

const WISHLIST_KEY = "hnstore_wishlist";

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); }
  catch { return []; }
}

function isWished(slug) {
  return loadWishlist().some(i => i.slug === slug);
}

function toggleWishlist(product) {
  const list = loadWishlist();
  const exists = list.some(i => i.slug === product.slug);
  const updated = exists
    ? list.filter(i => i.slug !== product.slug)
    : [...list, {
        slug: product.slug,
        name: product.name,
        price: product.price ?? product.base_price ?? 0,
        image: product.image ?? product.product_images?.[0]?.image_url ?? null,
      }];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  return !exists;
}

export default function ProductCard({ product, showBadge = false }) {
  const [wished, setWished] = useState(() => isWished(product.slug));

  const price = product.price ?? product.base_price ?? 0;
  const originalPrice = product.originalPrice ?? null;
  const image =
    product.image ??
    (product.product_images?.[0]?.image_url) ??
    null;

  const discountPct =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <Link to={`/san-pham/${product.slug}`} className={styles.card}>
      {showBadge && discountPct > 0 && (
        <span className={styles.badge}>-{discountPct}%</span>
      )}

      <button
        className={`${styles.wish} ${wished ? styles.wished : ""}`}
        aria-label={wished ? "Bỏ yêu thích" : "Yêu thích"}
        onClick={(e) => {
          e.preventDefault();
          const newState = toggleWishlist(product);
          setWished(newState);
        }}
      >
        {wished ? "❤️" : "🤍"}
      </button>

      <div className={styles.imageWrap}>
        {image ? (
          <img src={image} alt={product.name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>📦</span>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <p className={styles.name}>{product.name}</p>

        <div className={styles.prices}>
          <span className={styles.price}>{formatPrice(price)}</span>
          {originalPrice && originalPrice > price && (
            <span className={styles.priceOld}>{formatPrice(originalPrice)}</span>
          )}
        </div>

        {product.rating > 0 && (
          <div className={styles.meta}>
            <span className={styles.stars}>
              {"★".repeat(Math.floor(product.rating))}
              {"☆".repeat(5 - Math.floor(product.rating))}
            </span>
            {product.reviewCount > 0 && (
              <span className={styles.reviewCount}>({product.reviewCount})</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
