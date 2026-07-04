// src/components/SupportChat/SupportChat.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { sendSupportMessage } from "../../services/supportService";
import styles from "./SupportChat.module.css";

export default function SupportChat() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSending(true);
    setError("");
    try {
      await sendSupportMessage({
        userId: user?.id || null,
        guestName: user ? (profile?.name || user.email) : form.name,
        guestEmail: user ? user.email : form.email,
        message: form.message,
      });
      setDone(true);
      setTimeout(() => { setDone(false); setForm({ name: "", email: "", message: "" }); setOpen(false); }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.wrap}>
      {/* Chat panel */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelTitle}>💬 Hỗ trợ khách hàng</p>
              <p className={styles.panelSub}>Phản hồi trong vòng 24 giờ</p>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          {done ? (
            <div className={styles.success}>
              <div style={{ fontSize: 40 }}>✅</div>
              <p>Tin nhắn đã gửi!</p>
              <p style={{ fontSize: 13, color: "#666" }}>Chúng tôi sẽ phản hồi sớm nhất.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {!user && (
                <>
                  <input
                    className={styles.input}
                    placeholder="Họ và tên"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="Email liên hệ"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </>
              )}
              {user && (
                <div className={styles.userInfo}>
                  👤 {profile?.name || user.email}
                </div>
              )}
              <textarea
                className={styles.textarea}
                placeholder="Nhập câu hỏi hoặc phản hồi của bạn..."
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
              />
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.sendBtn} disabled={sending || !form.message.trim()}>
                {sending ? "Đang gửi..." : "Gửi tin nhắn"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Hỗ trợ khách hàng"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
