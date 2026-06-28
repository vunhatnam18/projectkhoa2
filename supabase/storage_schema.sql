-- Supabase Storage setup for product images.
-- Run this once in Supabase SQL Editor before sellers upload product photos.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "Sellers can upload product images" on storage.objects;
create policy "Sellers can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('seller', 'admin')
  )
);

drop policy if exists "Sellers can update product images" on storage.objects;
create policy "Sellers can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('seller', 'admin')
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('seller', 'admin')
  )
);

drop policy if exists "Sellers can delete product images" on storage.objects;
create policy "Sellers can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('seller', 'admin')
  )
);
