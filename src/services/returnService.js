// src/services/returnService.js
import { supabase } from "./supabaseClient";

// Buyer: tạo yêu cầu hoàn hàng
export async function createReturnRequest(orderId, reason) {
  const { data, error } = await supabase
    .from("return_requests")
    .insert([{ order_id: orderId, user_id: (await supabase.auth.getUser()).data.user.id, reason }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Buyer: xem yêu cầu hoàn hàng của mình
export async function getMyReturnRequests() {
  const { data, error } = await supabase
    .from("return_requests")
    .select(`id, order_id, reason, status, admin_note, created_at,
             orders (id, total_amount, status)`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// Kiểm tra đơn hàng đã có return request chưa
export async function getReturnRequestByOrder(orderId) {
  const { data, error } = await supabase
    .from("return_requests")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Admin: lấy tất cả return requests
export async function getAllReturnRequests() {
  const { data, error } = await supabase
    .from("return_requests")
    .select(`id, reason, status, admin_note, created_at,
             orders (id, total_amount),
             users (name, email)`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// Admin: duyệt/từ chối
export async function updateReturnRequest(id, status, adminNote = "") {
  const { error } = await supabase
    .from("return_requests")
    .update({ status, admin_note: adminNote || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
