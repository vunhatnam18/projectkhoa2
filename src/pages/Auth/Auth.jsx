// src/pages/Auth/Auth.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import styles from "./Auth.module.css";

export default function Auth() {
  const [tab, setTab] = useState("login");

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Link to="/">
            <span className={styles.logoText}>HN<span className={styles.logoAccent}>store</span></span>
          </Link>
        </div>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`} onClick={() => setTab("login")}>Đăng nhập</button>
          <button className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`} onClick={() => setTab("register")}>Đăng ký</button>
        </div>
        {tab === "login" ? <LoginForm /> : <RegisterForm onSuccess={() => setTab("login")} />}
      </div>
    </main>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const from = location.state?.from || "/";

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    return e;
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
    setServerError("");
    setForgotMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) return setErrors(e2);
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError("Email hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setErrors(err => ({ ...err, email: "Nhập email trước để lấy lại mật khẩu" }));
      return;
    }
    setForgotLoading(true);
    setForgotMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/tai-khoan/doi-mat-khau`,
      });
      if (error) throw error;
      setForgotMsg("✅ Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư!");
    } catch {
      setForgotMsg("❌ Không thể gửi email. Vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {serverError && <div className={styles.serverError}>{serverError}</div>}
      {forgotMsg && <div className={forgotMsg.startsWith("✅") ? styles.successMsg : styles.serverError}>{forgotMsg}</div>}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email"
          className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
          placeholder="example@email.com" value={form.email} onChange={handleChange} autoComplete="email" />
        {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">Mật khẩu</label>
        <input id="login-password" name="password" type="password"
          className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
          placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} autoComplete="current-password" />
        {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
      </div>
      <button
        type="button"
        className={styles.forgotLink}
        onClick={handleForgotPassword}
        disabled={forgotLoading}
      >
        {forgotLoading ? "Đang gửi..." : "Quên mật khẩu?"}
      </button>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      <div className={styles.divider}>hoặc</div>
      <div className={styles.socialBtns}>
        <button type="button" className={styles.socialBtn}><span>G</span> Google</button>
        <button type="button" className={styles.socialBtn}><span>f</span> Facebook</button>
      </div>
    </form>
  );
}

function RegisterForm({ onSuccess }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    if (form.confirm !== form.password) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) return setErrors(e2);
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name, form.phone);
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setServerError(err.message || "Đăng ký thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <div className={styles.successMsg}>✅ Đăng ký thành công! Vui lòng kiểm tra email xác nhận.</div>;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {serverError && <div className={styles.serverError}>{serverError}</div>}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="reg-name">Họ và tên</label>
        <input id="reg-name" name="name" type="text"
          className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
          placeholder="Nguyễn Văn A" value={form.name} onChange={handleChange} />
        {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="reg-email">Email</label>
        <input id="reg-email" name="email" type="email"
          className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
          placeholder="example@email.com" value={form.email} onChange={handleChange} />
        {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="reg-phone">Số điện thoại</label>
        <input id="reg-phone" name="phone" type="tel"
          className={styles.input} placeholder="0912345678" value={form.phone} onChange={handleChange} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="reg-password">Mật khẩu</label>
        <input id="reg-password" name="password" type="password"
          className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
          placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={handleChange} />
        {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="reg-confirm">Xác nhận mật khẩu</label>
        <input id="reg-confirm" name="confirm" type="password"
          className={`${styles.input} ${errors.confirm ? styles.inputError : ""}`}
          placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={handleChange} />
        {errors.confirm && <span className={styles.errorMsg}>{errors.confirm}</span>}
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}
