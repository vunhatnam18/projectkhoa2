-- ============================================================
-- Schema cho Voucher và Chăm sóc khách hàng
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- ── VOUCHERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vouchers (
  id bigint generated always as identity primary key,
  code text not null unique,
  description text,
  discount_type text not null default 'percent'
    check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) default 0,
  max_discount_amount numeric(12,2),          -- cap cho percent
  usage_limit integer,                         -- null = không giới hạn
  used_count integer not null default 0,
  valid_from timestamp with time zone default now(),
  valid_until timestamp with time zone,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

alter table public.vouchers enable row level security;

-- Tất cả đều đọc được voucher active
create policy "Public can read active vouchers"
  on public.vouchers for select
  using (is_active = true);

-- Chỉ admin mới thêm/sửa/xóa
create policy "Admins manage vouchers"
  on public.vouchers for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ── SUPPORT MESSAGES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_messages (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  guest_name text,
  guest_email text,
  message text not null,
  reply text,
  status text not null default 'open'
    check (status in ('open', 'replied', 'closed')),
  created_at timestamp with time zone default now(),
  replied_at timestamp with time zone
);

alter table public.support_messages enable row level security;

-- User xem tin nhắn của mình
create policy "Users can view own messages"
  on public.support_messages for select
  using (auth.uid() = user_id or user_id is null);

-- Ai cũng gửi được (kể cả khách)
create policy "Anyone can send support message"
  on public.support_messages for insert
  with check (true);

-- Admin xem và reply hết
create policy "Admins can view all messages"
  on public.support_messages for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Admins can update messages"
  on public.support_messages for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Seed 3 voucher mẫu
insert into public.vouchers (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until) values
  ('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percent', 10, 100000, 100000, 1000, now() + interval '1 year'),
  ('SALE50K',   'Giảm 50.000đ cho đơn từ 300K',   'fixed',   50000,  300000, null,    500,  now() + interval '6 months'),
  ('VIP20',     'Giảm 20% tối đa 200K',             'percent', 20, 500000, 200000, 200,  now() + interval '3 months')
on conflict (code) do nothing;

notify pgrst, 'reload schema';
