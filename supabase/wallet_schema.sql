-- Wallet schema for HNstore.
-- Run after the base marketplace schema and auth_role_schema.sql.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.wallets (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  balance numeric(14, 2) not null default 0 check (balance >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint wallets_user_unique unique (user_id)
);

create index if not exists wallets_user_id_idx
  on public.wallets (user_id);

drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at
before update on public.wallets
for each row
execute function public.set_updated_at();

create table if not exists public.wallet_transactions (
  id bigint generated always as identity primary key,
  wallet_id bigint not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdraw')),
  amount numeric(14, 2) not null check (amount > 0),
  balance_after numeric(14, 2) not null check (balance_after >= 0),
  note text,
  created_at timestamp with time zone default now()
);

create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);

create index if not exists wallet_transactions_wallet_id_idx
  on public.wallet_transactions (wallet_id);

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "Users can view their own wallet" on public.wallets;
create policy "Users can view their own wallet"
on public.wallets
for select
using (auth.uid() = user_id);

drop policy if exists "Users can view their own wallet transactions" on public.wallet_transactions;
create policy "Users can view their own wallet transactions"
on public.wallet_transactions
for select
using (auth.uid() = user_id);

create or replace function public.get_or_create_wallet()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet_id bigint;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để sử dụng ví.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = v_user_id
  ) then
    raise exception 'Tài khoản không hợp lệ.';
  end if;

  insert into public.wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing
  returning id into v_wallet_id;

  if v_wallet_id is null then
    select w.id
    into v_wallet_id
    from public.wallets w
    where w.user_id = v_user_id;
  end if;

  return v_wallet_id;
end;
$$;

drop function if exists public.wallet_deposit(numeric, text);
create function public.wallet_deposit(
  p_amount numeric,
  p_note text default 'Nạp tiền (mô phỏng)'
)
returns table (new_balance numeric, transaction_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet_id bigint;
  v_balance numeric(14, 2);
  v_transaction_id bigint;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để nạp tiền.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Số tiền nạp phải lớn hơn 0.';
  end if;

  v_wallet_id := public.get_or_create_wallet();

  update public.wallets w
  set balance = w.balance + p_amount
  where w.id = v_wallet_id
    and w.user_id = v_user_id
  returning w.balance into v_balance;

  insert into public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    balance_after,
    note
  )
  values (
    v_wallet_id,
    v_user_id,
    'deposit',
    p_amount,
    v_balance,
    nullif(p_note, '')
  )
  returning id into v_transaction_id;

  return query select v_balance, v_transaction_id;
end;
$$;

drop function if exists public.wallet_withdraw(numeric, text);
create function public.wallet_withdraw(
  p_amount numeric,
  p_note text default 'Rút tiền (mô phỏng)'
)
returns table (new_balance numeric, transaction_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet_id bigint;
  v_current_balance numeric(14, 2);
  v_balance numeric(14, 2);
  v_transaction_id bigint;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để rút tiền.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Số tiền rút phải lớn hơn 0.';
  end if;

  v_wallet_id := public.get_or_create_wallet();

  select w.balance
  into v_current_balance
  from public.wallets w
  where w.id = v_wallet_id
    and w.user_id = v_user_id
  for update;

  if v_current_balance < p_amount then
    raise exception 'Số dư ví không đủ.';
  end if;

  update public.wallets w
  set balance = w.balance - p_amount
  where w.id = v_wallet_id
    and w.user_id = v_user_id
  returning w.balance into v_balance;

  insert into public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    balance_after,
    note
  )
  values (
    v_wallet_id,
    v_user_id,
    'withdraw',
    p_amount,
    v_balance,
    nullif(p_note, '')
  )
  returning id into v_transaction_id;

  return query select v_balance, v_transaction_id;
end;
$$;

create or replace function public.refund_payment(p_payment_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_payment record;
  v_wallet_id bigint;
  v_balance numeric(14, 2);
begin
  if v_admin_id is null then
    raise exception 'Bạn cần đăng nhập để hoàn tiền.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = v_admin_id
      and u.role = 'admin'
  ) then
    raise exception 'Bạn không có quyền hoàn tiền.';
  end if;

  select
    p.id,
    p.payment_method,
    p.payment_status,
    o.id as order_id,
    o.user_id,
    o.total_amount
  into v_payment
  from public.payments p
  join public.orders o on o.id = p.order_id
  where p.id = p_payment_id
  for update of p;

  if not found then
    raise exception 'Không tìm thấy giao dịch thanh toán.';
  end if;

  if v_payment.payment_status <> 'paid' then
    raise exception 'Chỉ có thể hoàn tiền giao dịch đã thanh toán.';
  end if;

  update public.payments
  set payment_status = 'refunded'
  where id = p_payment_id;

  if v_payment.payment_method = 'wallet' then
    insert into public.wallets (user_id, balance)
    values (v_payment.user_id, 0)
    on conflict (user_id) do nothing
    returning id into v_wallet_id;

    if v_wallet_id is null then
      select w.id
      into v_wallet_id
      from public.wallets w
      where w.user_id = v_payment.user_id
      for update;
    end if;

    update public.wallets w
    set balance = w.balance + v_payment.total_amount
    where w.id = v_wallet_id
    returning w.balance into v_balance;

    insert into public.wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      balance_after,
      note
    )
    values (
      v_wallet_id,
      v_payment.user_id,
      'deposit',
      v_payment.total_amount,
      v_balance,
      'Hoàn tiền đơn hàng #' || v_payment.order_id
    );
  end if;
end;
$$;

revoke all on function public.get_or_create_wallet() from public;
grant execute on function public.get_or_create_wallet() to authenticated;

revoke all on function public.wallet_deposit(numeric, text) from public;
grant execute on function public.wallet_deposit(numeric, text) to authenticated;

revoke all on function public.wallet_withdraw(numeric, text) from public;
grant execute on function public.wallet_withdraw(numeric, text) to authenticated;

revoke all on function public.refund_payment(bigint) from public;
grant execute on function public.refund_payment(bigint) to authenticated;

-- Force PostgREST/Supabase API to refresh RPC metadata after changing return columns.
notify pgrst, 'reload schema';
