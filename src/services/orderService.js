// src/services/orderService.js
import { supabase } from "./supabaseClient";

// Tạo hoặc lấy địa chỉ, rồi tạo đơn hàng
export async function createOrder({ userId, address, items, totalAmount }) {
  // 1. Lưu địa chỉ vào bảng addresses
  const { data: addr, error: addrErr } = await supabase
    .from("addresses")
    .insert([{
      user_id: userId,
      full_name: address.fullName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward || null,
      street_detail: address.streetDetail,
      is_default: false,
    }])
    .select()
    .single();

  if (addrErr) throw new Error(addrErr.message);

  // 2. Tạo đơn hàng
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert([{
      user_id: userId,
      address_id: addr.id,
      status: "pending",
      total_amount: totalAmount,
    }])
    .select()
    .single();

  if (orderErr) throw new Error(orderErr.message);

  // 3. Tạo order_items
  const orderItems = items.map(item => ({
    order_id: order.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsErr) throw new Error(itemsErr.message);

  return order;
}

// Lấy danh sách đơn hàng của user
export async function getUserOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total_amount, created_at,
      addresses (full_name, phone, province, district, street_detail),
      order_items (
        quantity, price, subtotal,
        product_variants (
          color, size, storage,
          products (name, slug, product_images (image_url, display_order))
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Lấy chi tiết 1 đơn hàng
export async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total_amount, created_at,
      addresses (full_name, phone, province, district, ward, street_detail),
      order_items (
        id, quantity, price, subtotal,
        product_variants (
          id, color, size, storage,
          products (id, name, slug, product_images (image_url, display_order))
        )
      ),
      payments (payment_method, payment_status, paid_at)
    `)
    .eq("id", orderId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
