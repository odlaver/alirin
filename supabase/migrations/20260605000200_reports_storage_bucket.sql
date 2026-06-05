insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "reports_storage_public_read" on storage.objects;
create policy "reports_storage_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'reports');

drop policy if exists "reports_storage_public_upload" on storage.objects;
create policy "reports_storage_public_upload"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] = 'report-photos'
);
