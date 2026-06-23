// src/pages/Shipping/Shipping.jsx
import { useState } from "react";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import styles from "./Shipping.module.css";

const SHIPPING_METHODS = [
  {
    icon: "⚡",
    title: "Giao siêu tốc 2 giờ",
    desc: "Nội thành Hà Nội, đặt trước 17:00. Phí: 30.000đ",
  },
  {
    icon: "🚀",
    title: "Giao nhanh trong ngày",
    desc: "Toàn quốc, đặt trước 12:00. Phí: 20.000đ",
  },
  {
    icon: "📦",
    title: "Giao tiêu chuẩn 1–3 ngày",
    desc: "Toàn quốc. Miễn phí cho đơn từ 300.000đ",
  },
];

const POLICY_ROWS = [
  { region: "Nội thành Hà Nội", time: "2 giờ – trong ngày", min: "0đ", fee: "20.000đ – 30.000đ", freeFrom: "300.000đ" },
  { region: "Ngoại thành Hà Nội", time: "1 – 2 ngày", min: "0đ", fee: "25.000đ", freeFrom: "300.000đ" },
  { region: "TP. Hồ Chí Minh", time: "1 – 2 ngày", min: "0đ", fee: "25.000đ", freeFrom: "300.000đ" },
  { region: "Tỉnh thành khác", time: "2 – 4 ngày", min: "0đ", fee: "30.000đ – 40.000đ", freeFrom: "500.000đ" },
  { region: "Vùng sâu, xa", time: "3 – 7 ngày", min: "0đ", fee: "40.000đ – 60.000đ", freeFrom: "500.000đ" },
];

const FAQS = [
  {
    q: "Đơn hàng từ bao nhiêu thì được miễn phí giao hàng?",
    a: "Đơn hàng từ 300.000đ trở lên được miễn phí giao hàng tiêu chuẩn trong nội thành và ngoại thành các tỉnh thành lớn. Một số khu vực vùng xa áp dụng mức tối thiểu 500.000đ.",
  },
  {
    q: "Tôi có thể theo dõi đơn hàng ở đâu?",
    a: 'Bạn vào trang "Tra cứu đơn hàng" và nhập mã đơn hàng cùng số điện thoại để xem trạng thái giao hàng theo thời gian thực.',
  },
  {
    q: "Nếu tôi không nhận được hàng thì sao?",
    a: "Nếu sau 7 ngày kể từ ngày giao dự kiến bạn chưa nhận được hàng, vui lòng liên hệ hotline 1800.2097 (miễn phí) để được hỗ trợ ngay.",
  },
  {
    q: "Có giao hàng vào cuối tuần không?",
    a: "Có. HNstore giao hàng tất cả các ngày trong tuần kể cả thứ 7, chủ nhật và ngày lễ từ 8:00 đến 21:00.",
  },
];

export default function Shipping() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Chính sách giao hàng" }]} />

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>🚚</div>
          <h1 className={styles.heroTitle}>Giao hàng nhanh – Miễn phí từ 300K</h1>
          <p className={styles.heroSub}>
            Giao siêu tốc 2 giờ nội thành • Giao toàn quốc • Theo dõi đơn hàng realtime
          </p>
        </div>

        {/* Shipping methods */}
        <div className={styles.grid}>
          {SHIPPING_METHODS.map((m, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>{m.icon}</div>
              <p className={styles.cardTitle}>{m.title}</p>
              <p className={styles.cardDesc}>{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Policy table */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Bảng phí & thời gian giao hàng</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Khu vực</th>
                <th>Thời gian</th>
                <th>Đơn tối thiểu</th>
                <th>Phí ship</th>
                <th>Miễn phí từ</th>
              </tr>
            </thead>
            <tbody>
              {POLICY_ROWS.map((row, i) => (
                <tr key={i}>
                  <td>{row.region}</td>
                  <td>{row.time}</td>
                  <td>{row.min}</td>
                  <td>{row.fee}</td>
                  <td className={styles.free}>{row.freeFrom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Câu hỏi thường gặp</h2>
          <div className={styles.faq}>
            {FAQS.map((item, i) => (
              <div key={i} className={styles.faqItem}>
                <button
                  className={styles.faqQ}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span>{openFaq === i ? "▲" : "▼"}</span>
                </button>
                {openFaq === i && (
                  <div className={styles.faqA}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
