// src/services/productService.js
import { supabase } from "./supabaseClient";

// Sản phẩm mới nhất — dùng cho trang chủ
export async function getFlashSaleProducts(limit = 8) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, description,
      product_images (image_url, display_order),
      product_variants (price, stock),
      reviews (rating)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeProduct);
}

// Sản phẩm theo danh mục
export async function getProductsByCategory(slug) {
  const { data: cat, error: catErr } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (catErr) return [];

  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, description,
      product_images (image_url, display_order),
      product_variants (price, stock),
      reviews (rating)
    `)
    .eq("category_id", cat.id)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeProduct);
}

// Chi tiết 1 sản phẩm
export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, description, created_at,
      product_images (image_url, display_order),
      product_variants (id, sku, color, size, storage, price, stock),
      categories (name, slug),
      brands (name),
      reviews (id, rating, comment, created_at, users (name))
    `)
    .eq("slug", slug)
    .single();

  if (error) throw new Error(error.message);
  return normalizeProduct(data);
}

// Tìm kiếm sản phẩm
export async function searchProducts(keyword) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price,
      product_images (image_url, display_order),
      product_variants (price, stock),
      reviews (rating)
    `)
    .ilike("name", `%${keyword}%`)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeProduct);
}

// Helper chuẩn hoá
function normalizeProduct(p) {
  const images = (p.product_images || []).sort(
    (a, b) => a.display_order - b.display_order
  );
  const image = images[0]?.image_url || null;

  const variants = p.product_variants || [];
  const prices = variants.map((v) => v.price).filter(Boolean);
  const price = prices.length > 0 ? Math.min(...prices) : p.base_price;

  const reviews = p.reviews || [];
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    ...p,
    image,
    price,
    rating: Math.round(rating * 10) / 10,
    reviewCount: reviews.length,
    variants,
    images,
  };
}
