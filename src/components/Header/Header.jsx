import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCategories } from "../../context/CategoryContext";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { useTheme } from "../../context/ThemeContext";
import { formatPrice } from "../../utils/format";
import styles from "./Header.module.css";

// ── SVG Icons ─────────────────────────────────────────────
function IcPhone() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 5.51 5.51l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function IcTruck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function IcMapPin() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IcStore() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IcCart({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}
function IcHeart({ filled = false, size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function IcUser({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IcKey({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
}
function IcMenu() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function IcClose() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IcSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IcWallet() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
}
function IcSettings() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function IcShop() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IcSun() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function IcMoon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}

export default function Header() {
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { categories } = useCategories();
  const { user, profile } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const { dark, toggle: toggleTheme } = useTheme();
  const menuRef = useRef(null);

  const [wishCount, setWishCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hnstore_wishlist") || "[]").length; }
    catch { return 0; }
  });

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "hnstore_wishlist") {
        try { setWishCount(JSON.parse(e.newValue || "[]").length); } catch { setWishCount(0); }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchValue.trim()) navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
  }

  return (
    <header className={styles.header}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <div className={styles.topLinks}>
            <span className={styles.topLink}><IcMapPin /> Xem giá tại Hà Nội</span>
            <Link to="/giao-hang" className={styles.topLink}><IcTruck /> Giao nhanh – Miễn phí từ 300K</Link>
            <a href="tel:18002097" className={styles.topLink}><IcPhone /> Tư vấn 1800.2097</a>
            <Link to="/cua-hang" className={styles.topLink}><IcStore /> Cửa hàng gần bạn</Link>
          </div>
          <div className={styles.topActions}>
            <button onClick={toggleTheme} className={styles.themeToggle} aria-label={dark ? "Sáng" : "Tối"} title={dark ? "Giao diện sáng" : "Giao diện tối"}>
              {dark ? <IcSun /> : <IcMoon />}
            </button>
            {user ? (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {profile?.role === "admin" && (
                  <Link to="/admin" className={styles.topLink}><IcSettings /> Admin</Link>
                )}
                {profile?.role === "seller" && (
                  <Link to="/seller" className={styles.topLink}><IcShop /> Quản lý</Link>
                )}
                <Link to="/vi" className={styles.topLink}>
                  <IcWallet /> {walletLoading ? "Ví..." : formatPrice(balance)}
                </Link>
                <Link to="/tai-khoan" className={styles.topLink}>
                  <IcUser size={13} /> {profile?.name || user.email}
                </Link>
              </div>
            ) : (
              <Link to="/dang-nhap" className={styles.topLink}>Đăng nhập / Đăng ký</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className={styles.mainHeader}>
        <div className={`container ${styles.mainHeaderInner}`}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoText}>HN<span className={styles.logoAccent}>store</span></span>
          </Link>

          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.menuBtn} aria-label="Menu danh mục" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              <span className={styles.menuIcon}>{menuOpen ? <IcClose /> : <IcMenu />}</span>
              <span className={styles.menuLabel}>Danh mục</span>
            </button>
            {menuOpen && (
              <div className={styles.categoryDropdown}>
                {categories.length === 0 ? (
                  <p className={styles.dropdownEmpty}>Đang tải danh mục...</p>
                ) : (
                  <ul className={styles.dropdownList}>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link to={`/danh-muc/${cat.slug}`} className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                          <span className={styles.dropdownIcon}>{cat.icon || "📦"}</span>
                          <span>{cat.name}</span>
                          <span className={styles.dropdownArrow}>›</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <form className={styles.searchForm} onSubmit={handleSearch} role="search">
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Bạn cần tìm gì?"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className={styles.searchBtn} aria-label="Tìm kiếm">
              <IcSearch />
            </button>
          </form>

          <div className={styles.headerActions}>
            <a href="tel:18002097" className={styles.actionItem}>
              <span className={styles.actionIcon}><IcPhone /></span>
              <span className={styles.actionLabel}>
                <small>Gọi mua hàng</small>
                <strong>1800.2097</strong>
              </span>
            </a>
            <Link to="/cua-hang" className={styles.actionItem}>
              <span className={styles.actionIcon}><IcMapPin /></span>
              <span className={styles.actionLabel}>
                <small>Cửa hàng</small>
                <strong>Xem cửa hàng</strong>
              </span>
            </Link>
            <Link to="/gio-hang" className={styles.actionItem} style={{ position: "relative" }}>
              <span className={styles.cartIcon}><IcCart /></span>
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems > 99 ? "99+" : totalItems}</span>
              )}
            </Link>
            <Link to="/yeu-thich" className={styles.actionItem} aria-label="Yêu thích" style={{ position: "relative" }}>
              <span className={styles.cartIcon}><IcHeart /></span>
              {wishCount > 0 && (
                <span className={styles.cartBadge} style={{ background: "#e53935" }}>{wishCount}</span>
              )}
            </Link>

            {/* Mobile only */}
            <div className={styles.mobileActions}>
              <button onClick={toggleTheme} className={styles.themeToggle} aria-label={dark ? "Sáng" : "Tối"}>
                {dark ? <IcSun /> : <IcMoon />}
              </button>
              {user ? (
                <Link to="/tai-khoan" className={styles.actionItem}>
                  <IcUser size={20} />
                </Link>
              ) : (
                <Link to="/dang-nhap" className={styles.actionItem}>
                  <IcKey size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
