import { supabase } from "./supabaseClient";

function getPrimaryImage(product) {
  const images = product?.product_images || [];
  return [...images].sort((a, b) => a.display_order - b.display_order)[0]?.image_url || null;
}

function normalizeCartRow(row) {
  const variant = row.product_variants;
  const product = variant?.products;
  const variantLabel = [variant?.storage, variant?.color, variant?.size].filter(Boolean).join(" / ");

  return {
    id: String(row.id),
    cartItemId: row.id,
    variantId: variant?.id || row.variant_id,
    productId: product?.id || null,
    name: product?.name || "Sản phẩm",
    slug: product?.slug || "",
    variantLabel,
    price: Number(variant?.price || 0),
    stock: Number(variant?.stock || 0),
    quantity: row.quantity,
    image: getPrimaryImage(product),
  };
}

export async function getCartItems() {
  const { data: cartId, error: cartError } = await supabase.rpc("get_or_create_active_cart");
  if (cartError) throw new Error(cartError.message);

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      variant_id,
      product_variants (
        id,
        price,
        stock,
        color,
        size,
        storage,
        products (
          id,
          name,
          slug,
          product_images (image_url, display_order)
        )
      )
    `)
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeCartRow);
}

export async function addCartItem(variantId, quantity = 1) {
  const { error } = await supabase.rpc("add_to_cart", {
    p_variant_id: variantId,
    p_quantity: quantity,
  });

  if (error) throw new Error(error.message);
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  if (quantity < 1) return removeCartItem(cartItemId);

  const { data: row, error: fetchError } = await supabase
    .from("cart_items")
    .select("id, product_variants (stock)")
    .eq("id", cartItemId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  const stock = Number(row.product_variants?.stock || 0);
  if (quantity > stock) {
    throw new Error("Số lượng trong giỏ hàng vượt quá tồn kho hiện tại.");
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) throw new Error(error.message);
}

export async function removeCartItem(cartItemId) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) throw new Error(error.message);
}

export async function removeCartItems(cartItemIds) {
  if (!cartItemIds.length) return;

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .in("id", cartItemIds);

  if (error) throw new Error(error.message);
}
