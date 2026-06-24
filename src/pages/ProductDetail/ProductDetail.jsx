// src/pages/ProductDetail/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import { getProductBySlug } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../utils/format";
import styles from "./ProductDetail.module.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data);
        if (data?.variants?.length > 0) setSelectedVariant(data.variants[0]);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.skeleton} />
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

  function handleAddToCart() {
    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: images[0]?.image_url || null,
    }, qty);
    alert(`Đã thêm ${qty} "${product.name}" vào giỏ hàng!`);
  }

  function handleBuyNow() {
    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: images[0]?.image_url || null,
    }, qty);
    window.location.href = "/thanh-toan";
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
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantBtnActive : ""}`}
                      onClick={() => setSelectedVariant(v)}
                      disabled={v.stock === 0}
                    >
                      {[v.storage, v.color, v.size].filter(Boolean).join(" / ")}
                      {v.stock === 0 && <span> (Hết hàng)</span>}
                    </button>
                  ))}
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
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
