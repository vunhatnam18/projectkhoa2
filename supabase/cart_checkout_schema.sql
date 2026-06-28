-- Cart + checkout schema for HNstore.
-- Run this in Supabase SQL Editor after the existing marketplace schema.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.carts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active'
    check (status = any (array['active'::text, 'checked_out'::text, 'abandoned'::text])),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists carts_one_active_cart_per_user_idx
  on public.carts (user_id)
  where status = 'active';

create index if not exists carts_user_id_idx
  on public.carts (user_id);

drop trigger if exists set_carts_updated_at on public.carts;
create trigger set_carts_updated_at
before update on public.carts
for each row
execute function public.set_updated_at();

create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  cart_id bigint not null references public.carts(id) on delete cascade,
  variant_id bigint not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint cart_items_cart_variant_unique unique (cart_id, variant_id)
);

create index if not exists cart_items_cart_id_idx
  on public.cart_items (cart_id);

create index if not exists cart_items_variant_id_idx
  on public.cart_items (variant_id);

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
before update on public.cart_items
for each row
execute function public.set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "Buyers can view their own carts" on public.carts;
create policy "Buyers can view their own carts"
on public.carts
for select
using (auth.uid() = user_id);

drop policy if exists "Buyers can create their own carts" on public.carts;
create policy "Buyers can create their own carts"
on public.carts
for insert
with check (
  auth.uid() = user_id
  and status = 'active'
);

drop policy if exists "Buyers can update their own active carts" on public.carts;
create policy "Buyers can update their own active carts"
on public.carts
for update
using (
  auth.uid() = user_id
  and status = 'active'
)
with check (
  auth.uid() = user_id
  and status in ('active', 'abandoned')
);

drop policy if exists "Buyers can delete their own active carts" on public.carts;
create policy "Buyers can delete their own active carts"
on public.carts
for delete
using (
  auth.uid() = user_id
  and status = 'active'
);

drop policy if exists "Buyers can view their own cart items" on public.cart_items;
create policy "Buyers can view their own cart items"
on public.cart_items
for select
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Buyers can add items to their own active carts" on public.cart_items;
create policy "Buyers can add items to their own active carts"
on public.cart_items
for insert
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

drop policy if exists "Buyers can update items in their own active carts" on public.cart_items;
create policy "Buyers can update items in their own active carts"
on public.cart_items
for update
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

drop policy if exists "Buyers can delete items from their own active carts" on public.cart_items;
create policy "Buyers can delete items from their own active carts"
on public.cart_items
for delete
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

create or replace function public.get_or_create_active_cart()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id bigint;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để dùng giỏ hàng.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = v_user_id
      and u.role = 'buyer'
  ) then
    raise exception 'Chỉ buyer mới có thể dùng giỏ hàng.';
  end if;

  select c.id
  into v_cart_id
  from public.carts c
  where c.user_id = v_user_id
    and c.status = 'active';

  if v_cart_id is null then
    insert into public.carts (user_id, status)
    values (v_user_id, 'active')
    on conflict do nothing
    returning id into v_cart_id;
  end if;

  if v_cart_id is null then
    select c.id
    into v_cart_id
    from public.carts c
    where c.user_id = v_user_id
      and c.status = 'active';
  end if;

  return v_cart_id;
end;
$$;

create or replace function public.add_to_cart(
  p_variant_id bigint,
  p_quantity integer default 1
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id bigint;
  v_cart_item_id bigint;
  v_current_quantity integer := 0;
  v_stock integer;
begin
  if p_quantity < 1 then
    raise exception 'Số lượng sản phẩm phải lớn hơn 0.';
  end if;

  select pv.stock
  into v_stock
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = p_variant_id
    and p.status = 'active'
  for update of pv;

  if v_stock is null then
    raise exception 'Sản phẩm không tồn tại hoặc chưa được mở bán.';
  end if;

  v_cart_id := public.get_or_create_active_cart();

  select ci.quantity
  into v_current_quantity
  from public.cart_items ci
  where ci.cart_id = v_cart_id
    and ci.variant_id = p_variant_id;

  if coalesce(v_current_quantity, 0) + p_quantity > v_stock then
    raise exception 'Số lượng trong giỏ hàng vượt quá tồn kho hiện tại.';
  end if;

  insert into public.cart_items (cart_id, variant_id, quantity)
  values (v_cart_id, p_variant_id, p_quantity)
  on conflict (cart_id, variant_id)
  do update set
    quantity = public.cart_items.quantity + excluded.quantity,
    updated_at = now()
  returning id into v_cart_item_id;

  return v_cart_item_id;
end;
$$;

create or replace function public.checkout_cart(
  p_address_id bigint,
  p_payment_method text default 'cod'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id bigint;
  v_order_id bigint;
  v_total_amount numeric;
  v_bad_item record;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để thanh toán.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = v_user_id
      and u.role = 'buyer'
  ) then
    raise exception 'Chỉ buyer mới có thể thanh toán giỏ hàng.';
  end if;

  if not exists (
    select 1
    from public.addresses a
    where a.id = p_address_id
      and a.user_id = v_user_id
  ) then
    raise exception 'Địa chỉ giao hàng không hợp lệ.';
  end if;

  select c.id
  into v_cart_id
  from public.carts c
  where c.user_id = v_user_id
    and c.status = 'active'
  for update;

  if v_cart_id is null then
    raise exception 'Giỏ hàng không tồn tại.';
  end if;

  if not exists (
    select 1
    from public.cart_items ci
    where ci.cart_id = v_cart_id
  ) then
    raise exception 'Giỏ hàng đang trống.';
  end if;

  perform 1
  from public.product_variants pv
  join public.cart_items ci on ci.variant_id = pv.id
  where ci.cart_id = v_cart_id
  for update of pv;

  select
    ci.variant_id,
    ci.quantity,
    pv.stock,
    p.status as product_status
  into v_bad_item
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  join public.products p on p.id = pv.product_id
  where ci.cart_id = v_cart_id
    and (p.status <> 'active' or pv.stock < ci.quantity)
  limit 1;

  if found then
    raise exception 'Sản phẩm trong giỏ hàng không còn đủ điều kiện thanh toán.';
  end if;

  select coalesce(sum(pv.price * ci.quantity), 0)
  into v_total_amount
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart_id;

  insert into public.orders (user_id, address_id, status, total_amount)
  values (v_user_id, p_address_id, 'pending', v_total_amount)
  returning id into v_order_id;

  insert into public.order_items (order_id, variant_id, quantity, price, subtotal)
  select
    v_order_id,
    ci.variant_id,
    ci.quantity,
    pv.price,
    pv.price * ci.quantity
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart_id;

  update public.product_variants pv
  set stock = pv.stock - ci.quantity
  from public.cart_items ci
  where ci.cart_id = v_cart_id
    and pv.id = ci.variant_id;

  insert into public.payments (order_id, payment_method, payment_status)
  values (v_order_id, p_payment_method, 'pending');

  update public.carts
  set status = 'checked_out'
  where id = v_cart_id;

  insert into public.carts (user_id, status)
  values (v_user_id, 'active')
  on conflict do nothing;

  return v_order_id;
end;
$$;

create or replace function public.checkout_selected_cart_items(
  p_cart_item_ids bigint[],
  p_full_name text,
  p_phone text,
  p_province text,
  p_district text,
  p_ward text default null,
  p_street_detail text default null,
  p_payment_method text default 'cod',
  p_payment_status text default 'pending',
  p_transaction_id text default null,
  p_paid_at timestamp with time zone default null,
  p_shipping_fee numeric default 0
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id bigint;
  v_address_id bigint;
  v_order_id bigint;
  v_subtotal numeric;
  v_total_amount numeric;
  v_bad_item record;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để thanh toán.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = v_user_id
      and u.role = 'buyer'
  ) then
    raise exception 'Chỉ buyer mới có thể thanh toán giỏ hàng.';
  end if;

  if p_cart_item_ids is null or array_length(p_cart_item_ids, 1) is null then
    raise exception 'Vui lòng chọn sản phẩm để thanh toán.';
  end if;

  if coalesce(p_full_name, '') = ''
    or coalesce(p_phone, '') = ''
    or coalesce(p_province, '') = ''
    or coalesce(p_district, '') = ''
    or coalesce(p_street_detail, '') = '' then
    raise exception 'Thông tin giao hàng chưa đầy đủ.';
  end if;

  if p_shipping_fee < 0 then
    raise exception 'Phí vận chuyển không hợp lệ.';
  end if;

  select c.id
  into v_cart_id
  from public.carts c
  where c.user_id = v_user_id
    and c.status = 'active'
  for update;

  if v_cart_id is null then
    raise exception 'Giỏ hàng không tồn tại.';
  end if;

  if exists (
    select 1
    from unnest(p_cart_item_ids) selected_id
    where not exists (
      select 1
      from public.cart_items ci
      where ci.id = selected_id
        and ci.cart_id = v_cart_id
    )
  ) then
    raise exception 'Sản phẩm được chọn không thuộc giỏ hàng hiện tại.';
  end if;

  perform 1
  from public.product_variants pv
  join public.cart_items ci on ci.variant_id = pv.id
  where ci.cart_id = v_cart_id
    and ci.id = any(p_cart_item_ids)
  for update of pv;

  select
    ci.variant_id,
    ci.quantity,
    pv.stock,
    p.status as product_status
  into v_bad_item
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  join public.products p on p.id = pv.product_id
  where ci.cart_id = v_cart_id
    and ci.id = any(p_cart_item_ids)
    and (p.status <> 'active' or pv.stock < ci.quantity)
  limit 1;

  if found then
    raise exception 'Sản phẩm được chọn không còn đủ điều kiện thanh toán.';
  end if;

  select coalesce(sum(pv.price * ci.quantity), 0)
  into v_subtotal
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart_id
    and ci.id = any(p_cart_item_ids);

  if v_subtotal <= 0 then
    raise exception 'Không tìm thấy sản phẩm hợp lệ để thanh toán.';
  end if;

  v_total_amount := v_subtotal + coalesce(p_shipping_fee, 0);

  insert into public.addresses (
    user_id,
    full_name,
    phone,
    province,
    district,
    ward,
    street_detail,
    is_default
  )
  values (
    v_user_id,
    p_full_name,
    p_phone,
    p_province,
    p_district,
    nullif(p_ward, ''),
    p_street_detail,
    false
  )
  returning id into v_address_id;

  insert into public.orders (user_id, address_id, status, total_amount)
  values (v_user_id, v_address_id, 'pending', v_total_amount)
  returning id into v_order_id;

  insert into public.order_items (order_id, variant_id, quantity, price, subtotal)
  select
    v_order_id,
    ci.variant_id,
    ci.quantity,
    pv.price,
    pv.price * ci.quantity
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart_id
    and ci.id = any(p_cart_item_ids);

  update public.product_variants pv
  set stock = pv.stock - ci.quantity
  from public.cart_items ci
  where ci.cart_id = v_cart_id
    and ci.id = any(p_cart_item_ids)
    and pv.id = ci.variant_id;

  insert into public.payments (
    order_id,
    payment_method,
    payment_status,
    transaction_id,
    paid_at
  )
  values (
    v_order_id,
    p_payment_method,
    p_payment_status,
    nullif(p_transaction_id, ''),
    p_paid_at
  );

  delete from public.cart_items ci
  where ci.cart_id = v_cart_id
    and ci.id = any(p_cart_item_ids);

  return v_order_id;
end;
$$;

revoke all on function public.checkout_cart(bigint, text) from public;
grant execute on function public.checkout_cart(bigint, text) to authenticated;

revoke all on function public.checkout_selected_cart_items(
  bigint[],
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamp with time zone,
  numeric
) from public;
grant execute on function public.checkout_selected_cart_items(
  bigint[],
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamp with time zone,
  numeric
) to authenticated;

revoke all on function public.get_or_create_active_cart() from public;
grant execute on function public.get_or_create_active_cart() to authenticated;

revoke all on function public.add_to_cart(bigint, integer) from public;
grant execute on function public.add_to_cart(bigint, integer) to authenticated;

-- Force PostgREST/Supabase API to refresh stored function metadata after running this file.
notify pgrst, 'reload schema';
