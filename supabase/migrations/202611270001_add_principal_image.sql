alter table public.school_profile
  add column if not exists principal_image_url text,
  add column if not exists principal_image_storage_path text;

create policy "Read published principal portrait" on storage.objects
for select to anon, authenticated using (
  bucket_id = 'school-assets' and exists (
    select 1 from public.school_profile s
    where s.published and s.principal_image_storage_path = name
  )
);