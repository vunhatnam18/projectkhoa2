// src/services/contentService.js — BẢN ĐẦY ĐỦ, bổ sung các hàm còn thiếu
// ============================================================

import { supabase } from "./supabaseClient";

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);
  return data;
}

// ✅ THIẾU TRƯỚC ĐÓ — dùng cho CategoryPills.jsx
export async function getCategoryShortcuts() {
  const { data, error } = await supabase
    .from("category_shortcuts")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);
  return data;
}

// ✅ THIẾU TRƯỚC ĐÓ — dùng cho HeroBanner.jsx
export async function getHeroBanners() {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);
  return data;
}

// ✅ THIẾU TRƯỚC ĐÓ — dùng cho PromoBanners.jsx
export async function getPromos() {
  const { data, error } = await supabase
    .from("promos")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);
  return data;
}

export async function getTechNews(limit = 4) {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

export async function subscribeNewsletter(email) {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .insert([{ email }]);

  if (error) throw new Error(error.message);
  return data;
}