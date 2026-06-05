create extension if not exists pgcrypto;

create table if not exists public.reports (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  public_tracking_token text not null unique,
  category text not null check (category in ('sumbatan', 'genangan', 'aliran-lambat', 'drainase-rusak', 'bau', 'lainnya')),
  description text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  kecamatan text not null,
  kelurahan text not null,
  status text not null default 'masuk' check (status in ('masuk', 'diverifikasi', 'dijadwalkan', 'ditangani', 'selesai', 'ditolak')),
  severity text not null check (severity in ('ringan', 'sedang', 'parah', 'kritis')),
  risk_level text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  reporter_name text,
  reporter_contact text,
  assigned_officer_id text,
  assigned_officer_name text,
  blocked_reason text,
  field_notes jsonb not null default '[]'::jsonb,
  completion_photos jsonb not null default '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  url text not null,
  name text,
  type text,
  size integer not null default 0,
  kind text not null default 'report' check (kind in ('report', 'completion')),
  created_at timestamptz not null default now()
);

create table if not exists public.risk_breakdowns (
  id text not null,
  report_id text not null references public.reports(id) on delete cascade,
  label text not null,
  points integer not null default 0,
  weight integer not null default 0,
  detail text,
  created_at timestamptz not null default now(),
  primary key (report_id, id)
);

create table if not exists public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  status text not null check (status in ('masuk', 'diverifikasi', 'dijadwalkan', 'ditangani', 'selesai', 'ditolak')),
  actor text not null default 'Sistem',
  note text,
  at timestamptz not null default now()
);

create table if not exists public.officers (
  id text primary key,
  name text not null,
  area text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_public_tracking_token_idx on public.reports (public_tracking_token);
create index if not exists report_photos_report_id_idx on public.report_photos (report_id);
create index if not exists risk_breakdowns_report_id_idx on public.risk_breakdowns (report_id);
create index if not exists report_status_history_report_id_at_idx on public.report_status_history (report_id, at);

create or replace function public.alirin_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'app_role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'app_role', '')
  )
$$;

create or replace function public.alirin_is_staff()
returns boolean
language sql
stable
as $$
  select public.alirin_user_role() in ('admin', 'petugas')
$$;

alter table public.reports enable row level security;
alter table public.report_photos enable row level security;
alter table public.risk_breakdowns enable row level security;
alter table public.report_status_history enable row level security;
alter table public.officers enable row level security;

drop policy if exists "reports_public_insert" on public.reports;
create policy "reports_public_insert"
on public.reports
for insert
to anon, authenticated
with check (true);

drop policy if exists "reports_staff_select" on public.reports;
create policy "reports_staff_select"
on public.reports
for select
to authenticated
using (public.alirin_is_staff());

drop policy if exists "reports_staff_update" on public.reports;
create policy "reports_staff_update"
on public.reports
for update
to authenticated
using (public.alirin_is_staff())
with check (public.alirin_is_staff());

drop policy if exists "report_photos_public_insert" on public.report_photos;
create policy "report_photos_public_insert"
on public.report_photos
for insert
to anon, authenticated
with check (true);

drop policy if exists "report_photos_staff_select" on public.report_photos;
create policy "report_photos_staff_select"
on public.report_photos
for select
to authenticated
using (public.alirin_is_staff());

drop policy if exists "risk_breakdowns_public_insert" on public.risk_breakdowns;
create policy "risk_breakdowns_public_insert"
on public.risk_breakdowns
for insert
to anon, authenticated
with check (true);

drop policy if exists "risk_breakdowns_staff_select" on public.risk_breakdowns;
create policy "risk_breakdowns_staff_select"
on public.risk_breakdowns
for select
to authenticated
using (public.alirin_is_staff());

drop policy if exists "report_status_history_public_insert" on public.report_status_history;
create policy "report_status_history_public_insert"
on public.report_status_history
for insert
to anon, authenticated
with check (true);

drop policy if exists "report_status_history_staff_select" on public.report_status_history;
create policy "report_status_history_staff_select"
on public.report_status_history
for select
to authenticated
using (public.alirin_is_staff());

drop policy if exists "officers_staff_select" on public.officers;
create policy "officers_staff_select"
on public.officers
for select
to authenticated
using (public.alirin_is_staff());

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

drop policy if exists "reports_storage_staff_update" on storage.objects;
create policy "reports_storage_staff_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'reports' and public.alirin_is_staff())
with check (bucket_id = 'reports' and public.alirin_is_staff());

drop policy if exists "reports_storage_staff_delete" on storage.objects;
create policy "reports_storage_staff_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'reports' and public.alirin_is_staff());

insert into public.officers (id, name, area, phone)
values
  ('ofc-budi', 'Budi Santoso', 'Kedaton & Rajabasa', '0812-7700-120'),
  ('ofc-rina', 'Rina Wati', 'Kemiling & Langkapura', '0812-7700-221'),
  ('ofc-deni', 'Deni Pratama', 'Panjang & Teluk Betung', '0812-7700-330')
on conflict (id) do update set
  name = excluded.name,
  area = excluded.area,
  phone = excluded.phone,
  updated_at = now();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'reports'
    )
  then
    alter publication supabase_realtime add table public.reports;
  end if;
end $$;
