// src/services/walletService.js
import { supabase } from "./supabaseClient";

/**
 * Lấy thông tin ví của user hiện tại.
 * Nếu chưa có ví (user mới), tự tạo ví với số dư 0.
 * @returns {Promise<{ id: number, user_id: string, balance: number, created_at: string }>}
 */
export async function getWallet() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error("Bạn cần đăng nhập để sử dụng ví.");
  }

  const { data, error } = await supabase
    .from("wallets")
    .select("id, user_id, balance, created_at, updated_at")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) return data;

  // Chưa có ví -> gọi RPC để tạo (deposit 0 sẽ lỗi do check > 0,
  // nên dùng get_or_create_wallet rồi đọc lại).
  const { error: rpcError } = await supabase.rpc("get_or_create_wallet");
  if (rpcError) throw new Error(rpcError.message);

  const { data: created, error: refetchError } = await supabase
    .from("wallets")
    .select("id, user_id, balance, created_at, updated_at")
    .eq("user_id", authData.user.id)
    .single();

  if (refetchError) throw new Error(refetchError.message);
  return created;
}

/**
 * Nạp tiền vào ví (mô phỏng — không xử lý tiền thật).
 * @param {number} amount - số tiền nạp, phải > 0
 * @param {string} [note]
 * @returns {Promise<{ balance: number, transactionId: number }>}
 */
export async function depositToWallet(amount, note = "Nạp tiền (mô phỏng)") {
  const { data, error } = await supabase
    .rpc("wallet_deposit", { p_amount: amount, p_note: note })
    .single();

  if (error) throw new Error(error.message);
  return {
    balance: Number(data.new_balance ?? data.balance),
    transactionId: data.transaction_id,
  };
}

/**
 * Rút tiền khỏi ví (mô phỏng — không xử lý tiền thật).
 * @param {number} amount - số tiền rút, phải > 0 và <= số dư hiện tại
 * @param {string} [note]
 * @returns {Promise<{ balance: number, transactionId: number }>}
 */
export async function withdrawFromWallet(amount, note = "Rút tiền (mô phỏng)") {
  const { data, error } = await supabase
    .rpc("wallet_withdraw", { p_amount: amount, p_note: note })
    .single();

  if (error) throw new Error(error.message);
  return {
    balance: Number(data.new_balance ?? data.balance),
    transactionId: data.transaction_id,
  };
}

/**
 * Lấy lịch sử giao dịch của ví (mới nhất trước), có phân trang đơn giản.
 * @param {Object} opts
 * @param {number} opts.limit
 * @param {number} opts.offset
 */
export async function getWalletTransactions({ limit = 20, offset = 0 } = {}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error("Bạn cần đăng nhập để xem lịch sử ví.");
  }

  const { data, error, count } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, balance_after, note, created_at", { count: "exact" })
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { rows: data || [], total: count || 0 };
}
