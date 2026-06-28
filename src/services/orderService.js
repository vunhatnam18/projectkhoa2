// src/services/orderService.js
import { supabase } from "./supabaseClient";

function isMissingCheckoutRpc(error) {
  return (
    error?.code === "PGRST202" ||
    (
      error?.message?.includes("checkout_selected_cart_items") &&
      error?.message?.includes("schema cache")
    )
  );
}

// Tạo địa chỉ, đơn hàng, chi tiết đơn và bản ghi thanh toán
export async function createOrder({
  userId,
  address,
  items,
  totalAmount,
  paymentMethod = "cod",
  paymentStatus = "pending",
  transactionId = null,
  paidAt = null,
}) {
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

  // 4. Ghi nhận thanh toán để admin/trang thành công đọc được cùng một nguồn dữ liệu
  const { error: paymentErr } = await supabase
    .from("payments")
    .insert([{
      order_id: order.id,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      transaction_id: transactionId,
      paid_at: paidAt,
    }]);

  if (paymentErr) throw new Error(paymentErr.message);

  return order;
}

export async function checkoutSelectedCartItems({
  cartItemIds,
  address,
  paymentMethod = "cod",
  paymentStatus = "pending",
  transactionId = null,
  paidAt = null,
  shippingFee = 0,
  fallback = null,
}) {
  const { data: orderId, error } = await supabase.rpc("checkout_selected_cart_items", {
    p_cart_item_ids: cartItemIds.map(Number),
    p_full_name: address.fullName,
    p_phone: address.phone,
    p_province: address.province,
    p_district: address.district,
    p_ward: address.ward || null,
    p_street_detail: address.streetDetail,
    p_payment_method: paymentMethod,
    p_payment_status: paymentStatus,
    p_transaction_id: transactionId,
    p_paid_at: paidAt,
    p_shipping_fee: shippingFee,
  });

  if (error) {
    if (isMissingCheckoutRpc(error) && fallback?.userId && fallback?.items?.length) {
      try {
        return await createOrder({
          userId: fallback.userId,
          address,
          items: fallback.items,
          totalAmount: fallback.totalAmount,
          paymentMethod,
          paymentStatus,
          transactionId,
          paidAt,
        });
      } catch (fallbackError) {
        throw new Error(
          `Database chưa cài RPC checkout_selected_cart_items. Fallback tạo đơn trực tiếp cũng thất bại: ${fallbackError.message}`
        );
      }
    }

    if (isMissingCheckoutRpc(error)) {
      throw new Error(
        "Database chưa cài RPC checkout_selected_cart_items. Hãy chạy lại file supabase/cart_checkout_schema.sql trong Supabase SQL Editor."
      );
    }

    throw new Error(error.message);
  }

  return { id: orderId };
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
