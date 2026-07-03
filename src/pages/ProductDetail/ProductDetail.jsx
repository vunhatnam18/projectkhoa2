// src/pages/ProductDetail/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { getProductBySlug, getProductsByCategory } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../components/Toast/Toast";
import { formatPrice } from "../../utils/format";
import ProductCard from "../../components/common/ProductCard/ProductCard";
import styles from "./ProductDetail.module.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    setLoading(true);
    setRelatedProducts([]);
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data);
        if (data?.variants?.length > 0) setSelectedVariant(data.variants[0]);
        // Fetch sản phẩm cùng danh mục
        if (data?.categories?.slug) {
          getProductsByCategory(data.categories.slug)
            .then(all => setRelatedProducts(all.filter(p => p.slug !== slug).slice(0, 5)))
            .catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.skeletonLayout}>
            <div className={styles.skeletonImg} />
            <div className={styles.skeletonInfo}>
              <div className={styles.skeletonLine} style={{ width: "70%", height: 28 }} />
              <div className={styles.skeletonLine} style={{ width: "40%", height: 18 }} />
              <div className={styles.skeletonLine} style={{ width: "50%", height: 40 }} />
              <div className={styles.skeletonLine} style={{ width: "100%", height: 90 }} />
              <div className={styles.skeletonLine} style={{ width: "100%", height: 48 }} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className={styles.main}>
        <div className="container">
          <p className={styles.notFound}>Không tìm thấy sản phẩm.</p>
          <Link to="/" className={styles.backLink}>← Về trang chủ</Link>
        </div>
      </main>
    );
  }

  const price = selectedVariant?.price ?? product.price ?? product.base_price;
  const images = product.images || [];

  function getCartPayload() {
    const variantId = selectedVariant?.id;
    return {
      id: variantId ? `${product.id}-${variantId}` : String(product.id),
      variantId: variantId || null,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      stock: selectedVariant?.stock ?? 0,
      variantLabel: selectedVariant
        ? [selectedVariant.storage, selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ")
        : "",
      image: images[0]?.image_url || null,
    };
  }

  async function handleAddToCart() {
    if (!selectedVariant && product.variants?.length > 0) {
      addToast("Vui lòng chọn phiên bản sản phẩm", "error");
      return;
    }
    if (selectedVariant && selectedVariant.stock === 0) {
      addToast("Phiên bản này đã hết hàng", "error");
      return;
    }
    try {
      await addToCart(getCartPayload(), qty);
      addToast(`Đã thêm "${product.name}" vào giỏ hàng!`, "success");
    } catch (err) {
      addToast("Không thể thêm vào giỏ hàng: " + err.message, "error");
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant && product.variants?.length > 0) {
      addToast("Vui lòng chọn phiên bản sản phẩm", "error");
      return;
    }
    if (selectedVariant && selectedVariant.stock === 0) {
      addToast("Phiên bản này đã hết hàng", "error");
      return;
    }
    try {
      await addToCart(getCartPayload(), qty, { selectOnlyThis: true });
      navigate("/thanh-toan");
    } catch (err) {
      addToast("Không thể mua ngay: " + err.message, "error");
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[
          ...(product.categories ? [{ label: product.categories.name, href: `/danh-muc/${product.categories.slug}` }] : []),
          { label: product.name },
        ]} />

        <div className={styles.layout}>
          {/* Images */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrap}>
              {images[activeImg]?.image_url ? (
                <img src={images[activeImg].image_url} alt={product.name} className={styles.image} />
              ) : (
                <div className={styles.imagePlaceholder}><span>📦</span></div>
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img.image_url} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.name}>{product.name}</h1>

            {product.brands && (
              <p className={styles.brand}>Thương hiệu: <strong>{product.brands.name}</strong></p>
            )}

            <div className={styles.meta}>
              {product.rating > 0 && (
                <>
                  <span className={styles.stars}>
                    {"★".repeat(Math.floor(product.rating))}
                    {"☆".repeat(5 - Math.floor(product.rating))}
                  </span>
                  <span className={styles.reviewCount}>({product.reviewCount} đánh giá)</span>
                </>
              )}
            </div>

            <div className={styles.priceBox}>
              <span className={styles.price}>{formatPrice(price)}</span>
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className={styles.variants}>
                <p className={styles.variantLabel}>Phiên bản:</p>
                <div className={styles.variantBtns}>
                  {product.variants.map((v) => {
                    const colorMap = {
                      "đen": "#222", "trắng": "#f5f5f5", "bạc": "#c0c0c0",
                      "đỏ": "#e53935", "xanh": "#1565c0", "xanh dương": "#1565c0",
                      "xanh lá": "#2e7d32", "vàng": "#f9a825", "hồng": "#e91e63",
                      "tím": "#7b1fa2", "vàng ánh": "#c8a000", "xám": "#757575",
                      "titan đen": "#222", "titan trắng": "#f0f0f0", "titan xám": "#888",
                    };
                    const colorKey = v.color?.toLowerCase();
                    const dotColor = colorMap[colorKey];
                    const label = [v.storage, v.color, v.size].filter(Boolean).join(" / ");
                    return (
                      <button
                        key={v.id}
                        className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantBtnActive : ""}`}
                        onClick={() => setSelectedVariant(v)}
                        disabled={v.stock === 0}
                        title={v.stock === 0 ? "Hết hàng" : label}
                      >
                        {dotColor && (
                          <span style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: dotColor,
                            border: "1.5px solid rgba(0,0,0,0.15)",
                            flexShrink: 0,
                            display: "inline-block",
                          }} />
                        )}
                        {label}
                        {v.stock === 0 && <span style={{ fontSize: 11, opacity: 0.7 }}> (Hết)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <ul className={styles.benefits}>
              <li>✅ Hàng chính hãng, đầy đủ VAT</li>
              <li>🚚 Giao nhanh – Miễn phí từ 300K</li>
              <li>💳 Trả góp 0% qua thẻ tín dụng</li>
              <li>🔄 Đổi trả trong 7 ngày nếu lỗi</li>
            </ul>

            <div className={styles.actions}>
              <div className={styles.qtyBox}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className={styles.qtyBtn}>−</button>
                <span className={styles.qtyValue}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className={styles.qtyBtn}>+</button>
              </div>
              <button className={styles.addToCartBtn} onClick={handleAddToCart}>
                🛒 Thêm vào giỏ
              </button>
              <button className={styles.buyNowBtn} onClick={handleBuyNow}>Mua ngay</button>
            </div>

            {product.description && (
              <div className={styles.description}>
                <h3>Mô tả sản phẩm</h3>
                <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className={styles.reviewsSection}>
            <h2 className={styles.reviewsTitle}>
              ⭐ Đánh giá từ khách hàng
              <span className={styles.reviewsSummary}>{product.rating}/5 ({product.reviewCount} đánh giá)</span>
            </h2>

            {/* Rating summary bar */}
            <div className={styles.ratingBar}>
              <div className={styles.ratingBig}>
                <span className={styles.ratingNumber}>{product.rating}</span>
                <div className={styles.ratingStars}>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</div>
                <span style={{ fontSize: 12, color: "#999" }}>{product.reviewCount} đánh giá</span>
              </div>
              <div className={styles.ratingRows}>
                {[5,4,3,2,1].map(star => {
                  const count = product.reviews.filter(r => r.rating === star).length;
                  const pct = product.reviewCount > 0 ? Math.round((count / product.reviewCount) * 100) : 0;
                  return (
                    <div key={star} className={styles.ratingRow}>
                      <span className={styles.ratingRowLabel}>{star}★</span>
                      <div className={styles.ratingRowBar}>
                        <div className={styles.ratingRowFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.ratingRowCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.reviewsList}>
              {product.reviews.slice(0, 6).map((review, i) => (
                <div key={review.id || i} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAvatar}>
                      {(review.users?.name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.reviewName}>{review.users?.name || "Khách hàng"}</p>
                      <div className={styles.reviewStars}>
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </div>
                    </div>
                    <span className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Gợi ý sản phẩm */}
        {relatedProducts.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>
              💡 Gợi ý cho bạn
              <span className={styles.relatedSub}>Sản phẩm cùng danh mục</span>
            </h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} showBadge />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
