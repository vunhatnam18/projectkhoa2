// src/services/sellerService.js
import { supabase } from "./supabaseClient";

// Lấy sản phẩm của seller
export async function getSellerProducts(sellerId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, status, created_at,
      categories (name),
      brands (name),
      product_images (image_url, display_order),
      product_variants (id, price, stock, color, size, storage)
    `)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Tạo sản phẩm mới
export async function createProduct({ sellerId, name, slug, description, basePrice, categoryId, brandId }) {
  const { data, error } = await supabase
    .from("products")
    .insert([{
      seller_id: sellerId,
      name,
      slug,
      description,
      base_price: basePrice,
      category_id: categoryId || null,
      brand_id: brandId || null,
      status: "pending",
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Cập nhật sản phẩm
export async function updateProduct(productId, updates) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Xoá sản phẩm
export async function deleteProduct(productId) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw new Error(error.message);
}

// Upload ảnh sản phẩm
export async function uploadProductImage(productId, file, order = 0) {
  const ext = file.name.split(".").pop();
  const path = `products/${productId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("product-images")
    .upload(path, file);

  if (uploadErr) throw new Error(uploadErr.message);

  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  const { error: dbErr } = await supabase
    .from("product_images")
    .insert([{ product_id: productId, image_url: publicUrl, display_order: order }]);

  if (dbErr) throw new Error(dbErr.message);
  return publicUrl;
}

// Thêm variant
export async function addVariant(productId, variant) {
  const { data, error } = await supabase
    .from("product_variants")
    .insert([{ product_id: productId, ...variant }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Admin functions ──
export async function getAllPendingProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, status, created_at,
      categories (name),
      brands (name),
      product_images (image_url, display_order),
      users (name, email)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function approveProduct(productId) {
  const { error } = await supabase
    .from("products")
    .update({ status: "active" })
    .eq("id", productId);

  if (error) throw new Error(error.message);
}

export async function rejectProduct(productId) {
  const { error } = await supabase
    .from("products")
    .update({ status: "locking" })
    .eq("id", productId);

  if (error) throw new Error(error.message);
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total_amount, created_at,
      users (name, email),
      addresses (full_name, phone, province)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}
