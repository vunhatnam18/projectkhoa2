// src/pages/Wallet/Wallet.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { getWalletTransactions } from "../../services/walletService";
import { formatPrice } from "../../utils/format";
import styles from "./Wallet.module.css";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 10000000, 50000000];

const TX_TYPE_LABEL = { deposit: "Nạp tiền", withdraw: "Rút tiền" };

export default function Wallet() {
  const { user } = useAuth();
  const { balance, loading, actionLoading, error, deposit, withdraw } = useWallet();

  const [mode, setMode] = useState("deposit"); // "deposit" | "withdraw"
  const [amountInput, setAmountInput] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  async function loadTransactions() {
    setTxLoading(true);
    try {
      const { rows } = await getWalletTransactions({ limit: 10 });
      setTransactions(rows);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  if (!user) {
    return (
      <main className={styles.main}>
        <div className="container">
          <div className={styles.loginRequired}>
            <p>Bạn cần đăng nhập để sử dụng ví HNstore</p>
            <Link to="/dang-nhap" state={{ from: "/vi" }} className={styles.loginBtn}>
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const amount = Number(amountInput);
  const isValidAmount = amountInput.trim() !== "" && !Number.isNaN(amount) && amount > 0;

  function handleSwitchMode(nextMode) {
    setMode(nextMode);
    setFormError("");
    setSuccessMsg("");
  }

  function handlePickQuickAmount(value) {
    setAmountInput(String(value));
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg("");

    if (!isValidAmount) {
      setFormError("Vui lòng nhập số tiền hợp lệ (lớn hơn 0).");
      return;
    }
    if (mode === "withdraw" && amount > balance) {
      setFormError("Số dư không đủ để rút số tiền này.");
      return;
    }
    setFormError("");

    try {
      if (mode === "deposit") {
        await deposit(amount);
        setSuccessMsg(`✅ Nạp thành công ${formatPrice(amount)} vào ví!`);
      } else {
        await withdraw(amount);
        setSuccessMsg(`✅ Rút thành công ${formatPrice(amount)} khỏi ví!`);
      }
      setAmountInput("");
      loadTransactions();
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">
        <h1 className={styles.title}>Ví HNstore</h1>
        <p className={styles.subtitle}>
          Mô phỏng nạp / rút tiền trong ví — không sử dụng tiền thật.
        </p>

        <div className={styles.layout}>
          {/* Left: balance + form */}
          <div>
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>Số dư hiện tại</span>
              <strong className={styles.balanceValue}>
                {loading ? "Đang tải..." : formatPrice(balance)}
              </strong>
            </div>

            <div className={styles.card}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${mode === "deposit" ? styles.tabActive : ""}`}
                  onClick={() => handleSwitchMode("deposit")}
                >
                  💰 Nạp tiền
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${mode === "withdraw" ? styles.tabActive : ""}`}
                  onClick={() => handleSwitchMode("withdraw")}
                >
                  🏦 Rút tiền
                </button>
              </div>

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {(error || formError) && (
                  <div className={styles.formError}>{formError || error}</div>
                )}
                {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="wallet-amount">
                    Số tiền {mode === "deposit" ? "muốn nạp" : "muốn rút"} (VNĐ)
                  </label>
                  <input
                    id="wallet-amount"
                    type="number"
                    min={1}
                    step={1000}
                    className={styles.input}
                    placeholder="Ví dụ: 100000"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setFormError("");
                    }}
                  />
                  {isValidAmount && (
                    <span className={styles.amountPreview}>{formatPrice(amount)}</span>
                  )}
                </div>

                <div className={styles.quickAmounts}>
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      type="button"
                      key={v}
                      className={styles.quickBtn}
                      onClick={() => handlePickQuickAmount(v)}
                    >
                      {formatPrice(v)}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className={`${styles.submitBtn} ${mode === "withdraw" ? styles.submitBtnWithdraw : ""}`}
                  disabled={actionLoading || !isValidAmount}
                >
                  {actionLoading
                    ? "Đang xử lý..."
                    : mode === "deposit"
                    ? "Nạp tiền vào ví"
                    : "Rút tiền khỏi ví"}
                </button>
              </form>
            </div>
          </div>

          {/* Right: transaction history */}
          <div className={styles.card}>
            <h2 className={styles.historyTitle}>Lịch sử giao dịch</h2>
            {txLoading ? (
              <p className={styles.historyEmpty}>Đang tải lịch sử...</p>
            ) : transactions.length === 0 ? (
              <p className={styles.historyEmpty}>Chưa có giao dịch nào.</p>
            ) : (
              <ul className={styles.historyList}>
                {transactions.map((tx) => (
                  <li key={tx.id} className={styles.historyItem}>
                    <div className={styles.historyItemLeft}>
                      <span
                        className={`${styles.historyBadge} ${
                          tx.type === "deposit" ? styles.historyBadgeIn : styles.historyBadgeOut
                        }`}
                      >
                        {tx.type === "deposit" ? "↓" : "↑"}
                      </span>
                      <div>
                        <p className={styles.historyType}>{TX_TYPE_LABEL[tx.type] || tx.type}</p>
                        {tx.note && <p className={styles.historyDate}>{tx.note}</p>}
                        <p className={styles.historyDate}>
                          {new Date(tx.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <div className={styles.historyItemRight}>
                      <span
                        className={`${styles.historyAmount} ${
                          tx.type === "deposit" ? styles.historyAmountIn : styles.historyAmountOut
                        }`}
                      >
                        {tx.type === "deposit" ? "+" : "-"}
                        {formatPrice(Number(tx.amount))}
                      </span>
                      <span className={styles.historyBalanceAfter}>
                        Số dư: {formatPrice(Number(tx.balance_after))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
