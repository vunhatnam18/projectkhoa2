// src/services/supportService.js
import { supabase } from "./supabaseClient";

export async function sendSupportMessage({ userId, guestName, guestEmail, message }) {
  const { data, error } = await supabase
    .from("support_messages")
    .insert([{ user_id: userId || null, guest_name: guestName || null, guest_email: guestEmail || null, message }])
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMyMessages(userId) {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// Admin
export async function getAllSupportMessages() {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*, users(name, email)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function replyMessage(id, reply) {
  const { error } = await supabase
    .from("support_messages")
    .update({ reply, status: "replied", replied_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function closeMessage(id) {
  const { error } = await supabase
    .from("support_messages").update({ status: "closed" }).eq("id", id);
  if (error) throw new Error(error.message);
}
