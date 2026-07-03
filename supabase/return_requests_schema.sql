-- ============================================================
-- Schema cho chức năng Hoàn hàng
-- Chạy trong Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.return_requests (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists return_requests_order_id_idx on public.return_requests (order_id);
create index if not exists return_requests_user_id_idx  on public.return_requests (user_id);

-- Mỗi đơn chỉ được yêu cầu hoàn 1 lần
create unique index if not exists return_requests_order_unique
  on public.return_requests (order_id);

-- RLS
alter table public.return_requests enable row level security;

drop policy if exists "Users can view own return requests"   on public.return_requests;
drop policy if exists "Users can create return requests"    on public.return_requests;
drop policy if exists "Admins can view all return requests" on public.return_requests;
drop policy if exists "Admins can update return requests"   on public.return_requests;

create policy "Users can view own return requests"
  on public.return_requests for select
  using (auth.uid() = user_id);

create policy "Users can create return requests"
  on public.return_requests for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all return requests"
  on public.return_requests for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Admins can update return requests"
  on public.return_requests for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Trigger updated_at
drop trigger if exists set_return_requests_updated_at on public.return_requests;
create trigger set_return_requests_updated_at
  before update on public.return_requests
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
