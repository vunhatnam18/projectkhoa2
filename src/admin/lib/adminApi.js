// src/admin/lib/adminApi.js
//
// Tổng hợp tất cả các truy vấn Supabase dùng cho Admin Panel.
// Mục đích: tách query khỏi UI, dễ test & dễ sửa khi schema thay đổi.
//
// QUAN TRỌNG: import `supabase` từ file client đã có sẵn trong dự án của bạn.
// Nếu đường dẫn khác, chỉ cần sửa dòng import dưới đây.
import { supabase } from '../../services/supabaseClient';

// ---------------------------------------------------------------------------
// AUTH / PHÂN QUYỀN
// ---------------------------------------------------------------------------

/**
 * Lấy user hiện tại (từ Supabase Auth) kèm role thật từ bảng public.users.
 * Trả về null nếu chưa đăng nhập.
 */
export async function getCurrentAppUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, name, email, phone, role, created_at')
    .eq('id', authData.user.id)
    .single();

  if (profileError) return null;
  return profile;
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

/**
 * Lấy các số liệu tổng quan cho Dashboard.
 * Dùng { count: 'exact', head: true } để chỉ lấy số lượng, không tải dữ liệu thừa.
 */
export async function fetchDashboardStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    buyersRes,
    sellersRes,
    newUsersTodayRes,
    productsRes,
    pendingProductsRes,
    ordersRes,
    paidPaymentsRes,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'buyer'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('payments')
      .select('order_id, orders(total_amount)')
      .eq('payment_status', 'paid'),
  ]);

  const totalRevenue = (paidPaymentsRes.data || []).reduce((sum, p) => {
    return sum + (p.orders?.total_amount ? Number(p.orders.total_amount) : 0);
  }, 0);

  return {
    totalBuyers: buyersRes.count || 0,
    totalSellers: sellersRes.count || 0,
    newUsersToday: newUsersTodayRes.count || 0,
    totalProducts: productsRes.count || 0,
    pendingProducts: pendingProductsRes.count || 0,
    totalOrders: ordersRes.count || 0,
    totalRevenue,
  };
}

/**
 * Doanh thu nhóm theo ngày, trong N ngày gần nhất (mặc định 14 ngày).
 * Tính trên payments đã 'paid', join sang orders.total_amount, group theo paid_at.
 */
export async function fetchRevenueByDay(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('payments')
    .select('paid_at, orders(total_amount)')
    .eq('payment_status', 'paid')
    .gte('paid_at', since.toISOString())
    .order('paid_at', { ascending: true });

  if (error) throw error;

  const map = new Map();
  for (const row of data || []) {
    if (!row.paid_at) continue;
    const day = row.paid_at.slice(0, 10); // YYYY-MM-DD
    const amount = row.orders?.total_amount ? Number(row.orders.total_amount) : 0;
    map.set(day, (map.get(day) || 0) + amount);
  }

  return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
}

/**
 * Số lượng đơn hàng theo trạng thái — dùng để vẽ biểu đồ tròn/cột "hiệu suất bán hàng".
 */
export async function fetchOrderStatusBreakdown() {
  const { data, error } = await supabase.from('orders').select('status');
  if (error) throw error;

  const counts = {};
  for (const row of data || []) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// QUẢN LÝ NGƯỜI DÙNG (buyer + seller chung bảng users, phân biệt bằng role)
// ---------------------------------------------------------------------------

/**
 * Lấy danh sách user có phân trang + tìm kiếm + lọc theo role.
 * @param {Object} opts
 * @param {string} opts.role - 'buyer' | 'seller' | 'all'
 * @param {string} opts.search - tìm theo tên hoặc email
 * @param {number} opts.page - bắt đầu từ 1
 * @param {number} opts.pageSize
 */
export async function fetchUsers({ role = 'all', search = '', page = 1, pageSize = 10 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('users')
    .select('id, name, email, phone, role, created_at', { count: 'exact' });

  if (role !== 'all') {
    query = query.eq('role', role);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

/**
 * Lấy chi tiết 1 user: thông tin cá nhân + địa chỉ + lịch sử đơn hàng.
 */
export async function fetchUserDetail(userId) {
  const [userRes, addressesRes, ordersRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('addresses').select('*').eq('user_id', userId),
    supabase
      .from('orders')
      .select('id, status, total_amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (userRes.error) throw userRes.error;

  return {
    user: userRes.data,
    addresses: addressesRes.data || [],
    orders: ordersRes.data || [],
  };
}

/**
 * Đổi role của 1 user (vd: nâng quyền hoặc hạ quyền).
 * Lưu ý: trường role chỉ nhận 'admin' | 'buyer' | 'seller' theo CHECK constraint.
 */
export async function updateUserRole(userId, role) {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) throw error;
}

/**
 * Xóa user. CẢNH BÁO: nếu user có orders/products liên quan và DB có khóa ngoại
 * ràng buộc (không có ON DELETE CASCADE), lệnh này có thể lỗi - cần xử lý ở UI.
 */
export async function deleteUser(userId) {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// QUẢN LÝ NGƯỜI BÁN (seller) — báo cáo doanh thu / đơn hàng / sản phẩm theo seller
// ---------------------------------------------------------------------------

/**
 * Báo cáo nhanh cho 1 seller: tổng sản phẩm, tổng đơn hàng có chứa sản phẩm
 * của seller này, doanh thu (qua order_items -> product_variants -> products).
 */
export async function fetchSellerReport(sellerId) {
  const [productsRes, orderItemsRes, reviewsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, status, base_price', { count: 'exact' })
      .eq('seller_id', sellerId),
    supabase
      .from('order_items')
      .select('id, quantity, subtotal, order_id, variant_id, product_variants(product_id, products(seller_id, name))')
      .eq('product_variants.products.seller_id', sellerId),
    supabase
      .from('reviews')
      .select('rating, products!inner(seller_id)')
      .eq('products.seller_id', sellerId),
  ]);

  const products = productsRes.data || [];
  // Lọc lại order_items theo đúng seller (phòng trường hợp filter lồng không khớp do PostgREST)
  const relevantItems = (orderItemsRes.data || []).filter(
    (it) => it.product_variants?.products?.seller_id === sellerId
  );
  const totalRevenue = relevantItems.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
  const totalOrders = new Set(relevantItems.map((it) => it.order_id)).size;

  const ratings = (reviewsRes.data || []).map((r) => r.rating);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;

  return {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === 'active').length,
    pendingProducts: products.filter((p) => p.status === 'pending').length,
    totalOrders,
    totalRevenue,
    avgRating,
  };
}

// ---------------------------------------------------------------------------
// QUẢN LÝ SẢN PHẨM
// ---------------------------------------------------------------------------

/**
 * Danh sách sản phẩm có phân trang, lọc theo status, tìm theo tên, kèm tên seller/category.
 */
export async function fetchProducts({
  status = 'all',
  search = '',
  page = 1,
  pageSize = 10,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select(
      `id, name, slug, base_price, status, created_at,
       seller:seller_id ( id, name, email ),
       category:category_id ( id, name ),
       brand:brand_id ( id, name )`,
      { count: 'exact' }
    );

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

/**
 * Chi tiết 1 sản phẩm: thông tin chính + hình ảnh + biến thể (variants).
 */
export async function fetchProductDetail(productId) {
  const [productRes, imagesRes, variantsRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        `*, seller:seller_id ( id, name, email, phone ), category:category_id ( id, name ), brand:brand_id ( id, name )`
      )
      .eq('id', productId)
      .single(),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true }),
    supabase.from('product_variants').select('*').eq('product_id', productId),
  ]);

  if (productRes.error) throw productRes.error;

  return {
    product: productRes.data,
    images: imagesRes.data || [],
    variants: variantsRes.data || [],
  };
}

/**
 * Duyệt / từ chối / khóa sản phẩm.
 * status hợp lệ theo CHECK constraint: 'active' | 'pending' | 'locking'
 */
export async function updateProductStatus(productId, status) {
  const { error } = await supabase.from('products').update({ status }).eq('id', productId);
  if (error) throw error;
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

/**
 * Lấy toàn bộ sản phẩm của 1 seller (không phân trang) — dùng cho trang
 * báo cáo chi tiết seller.
 */
export async function fetchProductsBySeller(sellerId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, base_price, status')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// QUẢN LÝ ĐƠN HÀNG
// ---------------------------------------------------------------------------

const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

export async function fetchOrders({
  status = 'all',
  search = '',
  page = 1,
  pageSize = 10,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('orders')
    .select(
      `id, status, total_amount, created_at,
       buyer:user_id ( id, name, email )`,
      { count: 'exact' }
    );

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    // Tìm theo mã đơn (id) nếu search là số, ngược lại bỏ qua điều kiện này
    const asNumber = Number(search);
    if (!Number.isNaN(asNumber)) {
      query = query.eq('id', asNumber);
    }
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

/**
 * Chi tiết đơn hàng: thông tin đơn + người mua + địa chỉ giao + các order_items
 * (kèm variant + product + seller) + payment.
 */
export async function fetchOrderDetail(orderId) {
  const [orderRes, addressRes, itemsRes, paymentRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, buyer:user_id ( id, name, email, phone )')
      .eq('id', orderId)
      .single(),
    supabase.from('orders').select('address_id, addresses(*)').eq('id', orderId).single(),
    supabase
      .from('order_items')
      .select(
        `*, variant:variant_id ( id, sku, color, size, storage, product_id,
          product:product_id ( id, name, seller_id, seller:seller_id ( id, name ) ) )`
      )
      .eq('order_id', orderId),
    supabase.from('payments').select('*').eq('order_id', orderId).maybeSingle(),
  ]);

  if (orderRes.error) throw orderRes.error;

  return {
    order: orderRes.data,
    address: addressRes.data?.addresses || null,
    items: itemsRes.data || [],
    payment: paymentRes.data || null,
  };
}

/**
 * Admin can thiệp đổi trạng thái đơn hàng (xác nhận, hủy, đánh dấu hoàn tất...).
 */
export async function updateOrderStatus(orderId, status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(`Trạng thái không hợp lệ: ${status}`);
  }
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export { ORDER_STATUSES };

// ---------------------------------------------------------------------------
// QUẢN LÝ THANH TOÁN
// ---------------------------------------------------------------------------

export async function fetchPayments({
  status = 'all',
  page = 1,
  pageSize = 10,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('payments')
    .select(
      `id, payment_method, payment_status, transaction_id, paid_at, created_at,
       order:order_id ( id, total_amount, user_id, buyer:user_id ( id, name, email ) )`,
      { count: 'exact' }
    );

  if (status !== 'all') {
    query = query.eq('payment_status', status);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

/**
 * Hoàn tiền cho 1 payment. Nếu thanh toán bằng ví, RPC sẽ cộng lại tiền vào ví user.
 */
export async function refundPayment(paymentId) {
  const { error } = await supabase.rpc('refund_payment', { p_payment_id: paymentId });
  if (error) throw error;
}
