// src/services/voucherService.js
import { supabase } from "./supabaseClient";

export async function validateVoucher(code, orderAmount) {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !data) throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");

  const now = new Date();
  if (data.valid_until && new Date(data.valid_until) < now)
    throw new Error("Mã giảm giá đã hết hạn.");
  if (data.valid_from && new Date(data.valid_from) > now)
    throw new Error("Mã giảm giá chưa có hiệu lực.");
  if (data.usage_limit && data.used_count >= data.usage_limit)
    throw new Error("Mã giảm giá đã hết lượt sử dụng.");
  if (data.min_order_amount && orderAmount < data.min_order_amount)
    throw new Error(`Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(data.min_order_amount)} để dùng mã này.`);

  let discount = 0;
  if (data.discount_type === "percent") {
    discount = Math.floor(orderAmount * data.discount_value / 100);
    if (data.max_discount_amount) discount = Math.min(discount, data.max_discount_amount);
  } else {
    discount = data.discount_value;
  }
  discount = Math.min(discount, orderAmount);

  return { voucher: data, discount };
}

export async function incrementVoucherUsage(voucherId) {
  await supabase.rpc("increment_voucher_usage", { v_id: voucherId }).catch(() => {
    // Fallback nếu RPC chưa có
    supabase.from("vouchers").update({ used_count: supabase.raw("used_count + 1") }).eq("id", voucherId);
  });
}

// Admin
export async function getAllVouchers() {
  const { data, error } = await supabase
    .from("vouchers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createVoucher(voucher) {
  const { data, error } = await supabase.from("vouchers").insert([voucher]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function toggleVoucher(id, isActive) {
  const { error } = await supabase.from("vouchers").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVoucher(id) {
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
