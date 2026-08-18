-- =====================================================
-- ScrapLens — Migration 002: Storage Bucket
-- =====================================================

-- Supabase Storage bucket for scrap images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scraps-images',
  'scraps-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Authenticated users can upload scrap images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'scraps-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Scrap images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'scraps-images');

create policy "Users can delete own scrap images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'scraps-images' and auth.uid()::text = (storage.foldername(name))[1]);
