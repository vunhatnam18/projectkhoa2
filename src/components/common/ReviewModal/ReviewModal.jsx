// src/components/common/ReviewModal/ReviewModal.jsx
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabaseClient";
import styles from "./ReviewModal.module.css";

export default function ReviewModal({ orderId, items, onClose }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(
    items.map(item => ({
      productId: item.product_variants?.products?.id,
      productName: item.product_variants?.products?.name,
      rating: 5,
      comment: "",
    })).filter(r => r.productId)
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function setRating(idx, rating) {
    setReviews(prev => prev.map((r, i) => i === idx ? { ...r, rating } : r));
  }

  function setComment(idx, comment) {
    setReviews(prev => prev.map((r, i) => i === idx ? { ...r, comment } : r));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const insertData = reviews.map(r => ({
        product_id: r.productId,
        user_id: user.id,
        order_id: orderId,
        rating: r.rating,
        comment: r.comment.trim() || null,
      }));
      const { error } = await supabase.from("reviews").upsert(insertData, {
        onConflict: "product_id,user_id,order_id",
      });
      if (error) throw error;
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      alert("Gửi đánh giá thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>⭐ Đánh giá sản phẩm</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={styles.success}>✅ Cảm ơn bạn đã đánh giá!</div>
        ) : (
          <>
            <div className={styles.reviewList}>
              {reviews.map((r, idx) => (
                <div key={idx} className={styles.reviewItem}>
                  <p className={styles.productName}>{r.productName}</p>
                  <StarPicker rating={r.rating} onChange={v => setRating(idx, v)} />
                  <textarea
                    className={styles.textarea}
                    placeholder="Nhận xét của bạn (không bắt buộc)..."
                    value={r.comment}
                    onChange={e => setComment(idx, e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StarPicker({ rating, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          className={`${styles.star} ${star <= (hover || rating) ? styles.starActive : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          type="button"
        >★</button>
      ))}
      <span className={styles.ratingText}>{["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][hover || rating]}</span>
    </div>
  );
}
