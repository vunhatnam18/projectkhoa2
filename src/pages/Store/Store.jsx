// src/pages/Store/Store.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb";
import styles from "./Store.module.css";

const STORES = [
  {
    id: 1,
    name: "HNstore Hoàn Kiếm",
    address: "15 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    phone: "024.3825.1234",
    hours: "8:00 – 21:00",
    open: true,
    mapQuery: "15+Đinh+Tiên+Hoàng,+Hoàn+Kiếm,+Hà+Nội",
  },
  {
    id: 2,
    name: "HNstore Cầu Giấy",
    address: "102 Xuân Thủy, Cầu Giấy, Hà Nội",
    phone: "024.3756.5678",
    hours: "8:00 – 21:00",
    open: true,
    mapQuery: "102+Xuân+Thủy,+Cầu+Giấy,+Hà+Nội",
  },
  {
    id: 3,
    name: "HNstore Đống Đa",
    address: "78 Tây Sơn, Đống Đa, Hà Nội",
    phone: "024.3851.9012",
    hours: "8:00 – 21:00",
    open: true,
    mapQuery: "78+Tây+Sơn,+Đống+Đa,+Hà+Nội",
  },
  {
    id: 4,
    name: "HNstore Hai Bà Trưng",
    address: "45 Bà Triệu, Hai Bà Trưng, Hà Nội",
    phone: "024.3943.3456",
    hours: "8:00 – 21:00",
    open: false,
    mapQuery: "45+Bà+Triệu,+Hai+Bà+Trưng,+Hà+Nội",
  },
  {
    id: 5,
    name: "HNstore Long Biên",
    address: "230 Nguyễn Văn Cừ, Long Biên, Hà Nội",
    phone: "024.3827.7890",
    hours: "8:00 – 21:00",
    open: true,
    mapQuery: "230+Nguyễn+Văn+Cừ,+Long+Biên,+Hà+Nội",
  },
];

export default function Store() {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(STORES[0]);

  const filtered = STORES.filter(
    (s) =>
      s.name.toLowerCase().includes(keyword.toLowerCase()) ||
      s.address.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <main className={styles.main}>
      <div className="container">
        <Breadcrumb items={[{ label: "Hệ thống cửa hàng" }]} />
        <h1 className={styles.title}>Hệ thống cửa hàng HNstore</h1>
        <p className={styles.subtitle}>
          {STORES.length} cửa hàng trên toàn quốc – Mở cửa 8:00 đến 21:00 hàng ngày
        </p>

        {/* Search */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Tìm theo tên hoặc địa chỉ..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button className={styles.searchBtn}>🔍 Tìm</button>
        </div>

        <div className={styles.layout}>
          {/* Store list */}
          <div className={styles.storeList}>
            {filtered.length === 0 ? (
              <p style={{ color: "var(--color-text-secondary)" }}>Không tìm thấy cửa hàng nào.</p>
            ) : (
              filtered.map((store) => (
                <div
                  key={store.id}
                  className={`${styles.storeCard} ${selected?.id === store.id ? styles.storeCardActive : ""}`}
                  onClick={() => setSelected(store)}
                >
                  <p className={styles.storeName}>📍 {store.name}</p>
                  <p className={styles.storeAddress}>{store.address}</p>
                  <div className={styles.storeMeta}>
                    <span className={store.open ? styles.storeOpen : ""}>
                      {store.open ? "🟢 Đang mở cửa" : "🔴 Đã đóng cửa"}
                    </span>
                    <span>🕐 {store.hours}</span>
                    <span className={styles.storePhone}>📞 {store.phone}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map - Google Maps Embed */}
          <div className={styles.mapBox}>
            <iframe
              title={selected?.name}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: "var(--radius-md)" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${selected?.mapQuery}&output=embed`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
