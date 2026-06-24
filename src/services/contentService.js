// src/services/contentService.js
import { supabase } from "./supabaseClient";

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("id");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCategoryShortcuts() {
  const { data, error } = await supabase.from("category_shortcuts").select("*").order("id");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getHeroBanners() {
  const { data, error } = await supabase.from("banners").select("*").order("id");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPromos() {
  const { data, error } = await supabase.from("promos").select("*").order("id");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTechNews(limit = 4) {
  const { data, error } = await supabase
    .from("news")
    .select("id, title, slug, image, category, published_at")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getNewsBySlug(slug) {
  const { data, error } = await supabase.from("news").select("*").eq("slug", slug).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getRelatedNews(excludeSlug, limit = 4) {
  const { data, error } = await supabase
    .from("news")
    .select("id, title, slug, image, published_at")
    .neq("slug", excludeSlug)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function subscribeNewsletter(email) {
  const { error } = await supabase.from("newsletter_subscribers").insert([{ email }]);
  if (error) throw new Error(error.message);
}
