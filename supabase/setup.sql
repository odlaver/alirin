-- ===========================================================================
-- ALIRIN · setup.sql — skema lengkap dalam satu berkas
-- ===========================================================================
--
-- Berkas ini adalah gabungan seluruh migrasi di supabase/migrations/, disusun
-- berurutan. Untuk fork baru: buat project Supabase kosong, buka SQL Editor,
-- tempel SELURUH isi berkas ini, lalu Run sekali. Aman diulang.
--
-- Alternatif (disarankan): pakai Supabase CLI —
--   supabase link --project-ref <ref> && supabase db push
-- CLI menjalankan tiap berkas migrasi otomatis, tanpa menyalin apa pun.
--
-- Dihasilkan otomatis dari 16 berkas migrasi oleh
-- scripts/build-setup-sql.mjs. Jangan diedit tangan; ubah migrasinya lalu
-- jalankan ulang skrip itu.
-- ===========================================================================


-- ###########################################################################
-- # (1/16) 20260601131500_alirin_reports_contract.sql
-- ###########################################################################

-- Reserved migration version.
-- The remote project already has this version in its migration history.
-- Keep it as a no-op so Supabase Preview can reconcile remote and local history.
select 1;

-- ###########################################################################
-- # (2/16) 20260605000100_reports_backend.sql
-- ###########################################################################

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

-- ###########################################################################
-- # (3/16) 20260605000200_reports_storage_bucket.sql
-- ###########################################################################

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

-- ###########################################################################
-- # (4/16) 20260605000300_reports_remote_compatibility.sql
-- ###########################################################################

alter table public.reports
  add column if not exists public_tracking_token text,
  add column if not exists kecamatan text not null default '',
  add column if not exists kelurahan text not null default '',
  add column if not exists blocked_reason text,
  add column if not exists field_notes jsonb not null default '[]'::jsonb,
  add column if not exists completion_photos jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.reports
set
  public_tracking_token = coalesce(nullif(public_tracking_token, ''), 'trk_' || replace(id::text, '-', '')),
  updated_at = coalesce(updated_at, created_at, now())
where public_tracking_token is null
  or public_tracking_token = ''
  or updated_at is null;

alter table public.reports
  alter column public_tracking_token set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

create unique index if not exists reports_public_tracking_token_idx
on public.reports (public_tracking_token);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);

alter table public.report_photos
  add column if not exists name text,
  add column if not exists type text not null default 'image/jpeg',
  add column if not exists size integer not null default 0,
  add column if not exists kind text not null default 'report';

create index if not exists report_photos_report_id_idx on public.report_photos (report_id);

alter table public.risk_breakdowns
  add column if not exists created_at timestamptz not null default now();

create index if not exists risk_breakdowns_report_id_idx on public.risk_breakdowns (report_id);

alter table public.report_status_history
  add column if not exists note text;

create index if not exists report_status_history_report_id_at_idx
on public.report_status_history (report_id, at);

-- ###########################################################################
-- # (5/16) 20260812090000_public_read_access.sql
-- ###########################################################################

-- Menyelaraskan hak akses per peran pada database live.
--
-- Kondisi yang diperbaiki (terverifikasi pada project live, 12 Agustus 2026):
--   1. anon (warga tanpa login) bisa SELECT tabel reports lengkap dengan
--      reporter_name dan reporter_contact -> nomor HP pelapor terbuka publik.
--   2. anon bisa UPDATE baris reports mana pun -> status laporan orang lain
--      bisa diubah dari luar aplikasi.
--   3. anon bisa INSERT laporan dengan status apa pun (mis. langsung 'selesai').
--   4. Belum ada jalur baca publik yang aman untuk peta dan pelacakan status.
--
-- Setelah migrasi ini:
--   - Peta publik membaca view public_reports (tanpa data pribadi pelapor).
--   - Pelacakan status memakai RPC get_report_by_tracking_token (per token).
--   - Tabel mentah hanya untuk staff (admin/petugas) yang login.

-- 1) Helper peran. Dibuat ulang agar migrasi ini mandiri.
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
  select coalesce(public.alirin_user_role() in ('admin', 'petugas'), false)
$$;

-- 2) Bersihkan policy lama pada tabel inti, lalu pasang set policy kanonik.
--    Policy lama dihapus berdasarkan katalog karena nama policy di database live
--    tidak seluruhnya sama dengan yang ada di riwayat migrasi repo ini.
do $$
declare
  target_table text;
  policy_name text;
begin
  foreach target_table in array array['reports', 'report_photos', 'risk_breakdowns', 'report_status_history']
  loop
    if to_regclass('public.' || target_table) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', target_table);

    for policy_name in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy %I on public.%I', policy_name, target_table);
    end loop;
  end loop;
end $$;

-- Warga hanya boleh membuat laporan baru berstatus 'masuk'.
create policy "reports_public_insert"
on public.reports
for insert
to anon, authenticated
with check (public.alirin_is_staff() or status = 'masuk');

create policy "reports_staff_select"
on public.reports
for select
to authenticated
using (public.alirin_is_staff());

create policy "reports_staff_update"
on public.reports
for update
to authenticated
using (public.alirin_is_staff())
with check (public.alirin_is_staff());

create policy "report_photos_public_insert"
on public.report_photos
for insert
to anon, authenticated
with check (public.alirin_is_staff() or coalesce(kind, 'report') = 'report');

create policy "report_photos_staff_select"
on public.report_photos
for select
to authenticated
using (public.alirin_is_staff());

create policy "report_photos_staff_write"
on public.report_photos
for update
to authenticated
using (public.alirin_is_staff())
with check (public.alirin_is_staff());

create policy "risk_breakdowns_public_insert"
on public.risk_breakdowns
for insert
to anon, authenticated
with check (true);

create policy "risk_breakdowns_staff_select"
on public.risk_breakdowns
for select
to authenticated
using (public.alirin_is_staff());

-- Riwayat status: warga hanya boleh menuliskan entri awal 'masuk'.
create policy "report_status_history_public_insert"
on public.report_status_history
for insert
to anon, authenticated
with check (public.alirin_is_staff() or status = 'masuk');

create policy "report_status_history_staff_select"
on public.report_status_history
for select
to authenticated
using (public.alirin_is_staff());

-- 3) Jalur baca publik untuk peta risiko.
--    View berjalan sebagai pemiliknya sehingga melewati RLS tabel dasar, karena
--    itu kolom pribadi pelapor (reporter_name, reporter_contact,
--    public_tracking_token, blocked_reason, field_notes) sengaja tidak ikut.
create or replace view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  r.lat,
  r.lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'url', p.url,
          'name', p.name,
          'type', p.type,
          'size', p.size,
          'kind', p.kind
        )
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id
        and coalesce(p.kind, 'report') = 'report'
    ),
    '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'label', b.label,
          'points', b.points,
          'weight', b.weight,
          'detail', b.detail
        )
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ),
    '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'status', h.status,
          'actor', h.actor,
          'note', h.note,
          'at', h.at
        )
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ),
    '[]'::jsonb
  ) as report_status_history
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- 4) Pelacakan status oleh pelapor. Tracking token berfungsi sebagai kredensial,
--    jadi pemegang token berhak melihat laporannya sendiri secara utuh.
create or replace function public.get_report_by_tracking_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(r)
    || jsonb_build_object(
      'report_photos', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'url', p.url,
              'name', p.name,
              'type', p.type,
              'size', p.size,
              'kind', p.kind
            )
            order by p.created_at
          )
          from public.report_photos p
          where p.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'risk_breakdowns', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', b.id,
              'label', b.label,
              'points', b.points,
              'weight', b.weight,
              'detail', b.detail
            )
          )
          from public.risk_breakdowns b
          where b.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'report_status_history', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'status', h.status,
              'actor', h.actor,
              'note', h.note,
              'at', h.at
            )
            order by h.at
          )
          from public.report_status_history h
          where h.report_id = r.id
        ),
        '[]'::jsonb
      )
    )
  from public.reports r
  where r.public_tracking_token = p_token
  limit 1;
$$;

revoke all on function public.get_report_by_tracking_token(text) from public;
grant execute on function public.get_report_by_tracking_token(text) to anon, authenticated;

-- 5) Membersihkan baris uji yang dipakai untuk membuktikan lubang akses di atas
--    (laporan "probe integritas", kode ALR-2026-9999). Aman dijalankan berulang.
delete from public.reports
where id = '00000000-0000-0000-0000-000000000000'
  and code = 'ALR-2026-9999';

-- ###########################################################################
-- # (6/16) 20260812093000_officers_registry.sql
-- ###########################################################################

-- Mengembalikan tabel public.officers yang ada di riwayat migrasi repo tapi
-- tidak ada di database live. Daftar petugas saat ini hanya hidup di
-- app/src/data/officers.js, sehingga reports.assigned_officer_id tidak punya
-- rujukan apa pun di sisi database.
--
-- Isi tabel disamakan persis dengan DEMO_OFFICERS pada app/src/data/officers.js.

create table if not exists public.officers (
  id text primary key,
  name text not null,
  area text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.officers enable row level security;

-- Nomor telepon petugas hanya untuk staff yang login, bukan konsumsi publik.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'officers'
  loop
    execute format('drop policy %I on public.officers', policy_name);
  end loop;
end $$;

create policy "officers_staff_select"
on public.officers
for select
to authenticated
using (public.alirin_is_staff());

-- ###########################################################################
-- # (7/16) 20260812210000_add_submission_mode.sql
-- ###########################################################################

-- Menambahkan kolom submission_mode ke reports supaya asal-usul laporan
-- (Cepat vs Lengkap dari mobile) ikut tersimpan dan bisa dibaca kembali di
-- device lain / web tanpa hilang informasi. Diambil sebagai text dengan check
-- constraint agar hanya menerima dua nilai kanonik.

alter table public.reports
  add column if not exists submission_mode text;

alter table public.reports
  drop constraint if exists reports_submission_mode_check;

alter table public.reports
  add constraint reports_submission_mode_check
  check (submission_mode is null or submission_mode in ('Cepat', 'Lengkap'));

-- Re-declare view public agar kolom baru ikut diekspos ke anon & authenticated.
-- Isi view sama persis dengan 20260812090000_public_read_access.sql, hanya
-- menambahkan r.submission_mode di kolom yang dipilih.
--
-- Harus drop dulu, bukan create or replace: Postgres menolak penyisipan kolom
-- di tengah daftar select sebuah view yang sudah ada (42P16, "cannot change
-- name of view column"). Grant di bawah memasang ulang hak baca yang ikut
-- terhapus bersama view lama.
drop view if exists public.public_reports;

create view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  r.lat,
  r.lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.submission_mode,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'url', p.url,
          'name', p.name,
          'type', p.type,
          'size', p.size,
          'kind', p.kind
        )
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id
        and coalesce(p.kind, 'report') = 'report'
    ),
    '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'label', b.label,
          'points', b.points,
          'weight', b.weight,
          'detail', b.detail
        )
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ),
    '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'status', h.status,
          'actor', h.actor,
          'note', h.note,
          'at', h.at
        )
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ),
    '[]'::jsonb
  ) as report_status_history
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- RPC get_report_by_tracking_token pakai to_jsonb(r) sehingga otomatis
-- ikut membawa kolom baru submission_mode tanpa perlu di-redeklarasi.

-- ###########################################################################
-- # (8/16) 20260826090000_risk_engine.sql
-- ###########################################################################

-- Risk & Priority Engine sebagai lapisan basis data.
--
-- Sebelum migrasi ini, risk score dihitung dua kali di sisi klien dengan rumus
-- yang berbeda (web 30/25/20/15/10, mobile 100% keparahan x pengali mode), dan
-- tidak satu pun sesuai bobot Proposal 4.4. Akibatnya seluruh laporan punya skor
-- berbeda antara nilai tersimpan dan nilai yang ditampilkan web.
--
-- Setelah migrasi ini basis data yang menghitung, lewat trigger, memakai rumus
-- tunggal di docs/RISK-ENGINE.md:
--   Risk Score = (0,35 x Keparahan) + (0,25 x Histori) + (0,25 x Cuaca) + (0,15 x Lokasi)
-- Klien tetap menghitung untuk pratinjau, tetapi angkanya selalu ditimpa di sini.

-- ---------------------------------------------------------------------------
-- 1. Kolom masukan cuaca
-- ---------------------------------------------------------------------------

-- Akumulasi curah hujan 3 jam ke depan dari prakiraan BMKG pada wilayah laporan,
-- diambil klien saat laporan dikirim lalu dibekukan supaya skor reproducible.
alter table public.reports
  add column if not exists rainfall_mm double precision;

alter table public.reports drop constraint if exists reports_rainfall_mm_check;
alter table public.reports
  add constraint reports_rainfall_mm_check
  check (rainfall_mm is null or rainfall_mm >= 0);

-- ---------------------------------------------------------------------------
-- 1b. Kunci faktor pada rincian skor
-- ---------------------------------------------------------------------------
--
-- Terverifikasi pada project live: reports.id, report_photos.report_id,
-- risk_breakdowns.id, dan risk_breakdowns.report_id semuanya bertipe uuid,
-- sedangkan migrasi 20260605000100 di repo mendeklarasikannya text. Bukti
-- lanjutan bahwa migrasi itu tidak pernah dieksekusi di remote.
--
-- Karena risk_breakdowns.id adalah uuid dengan default, kunci faktor
-- ('severity', 'history', ...) tidak bisa ditaruh di sana. Kolom terpisah ini
-- yang menyimpannya, dan klien membacanya sebagai id faktor.
alter table public.risk_breakdowns
  add column if not exists factor text;

alter table public.risk_breakdowns drop constraint if exists risk_breakdowns_factor_check;
alter table public.risk_breakdowns
  add constraint risk_breakdowns_factor_check
  check (factor is null or factor in ('severity', 'history', 'weather', 'location', 'bukti', 'sensor'));

create unique index if not exists risk_breakdowns_report_factor_idx
  on public.risk_breakdowns (report_id, factor) where factor is not null;

-- ---------------------------------------------------------------------------
-- 2. Master fasilitas publik (faktor Lokasi)
-- ---------------------------------------------------------------------------

create table if not exists public.public_facilities (
  id text primary key,
  name text not null,
  type text,
  lat double precision not null,
  lng double precision not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.public_facilities (id, name, type, lat, lng) values
  ('fac-rsam',      'RSUD Abdul Moeloek',     'Rumah sakit',  -5.3994, 105.2526),
  ('fac-stasiun',   'Stasiun Tanjung Karang', 'Transportasi', -5.4077, 105.2581),
  ('fac-bambu',     'Pasar Bambu Kuning',     'Pasar',        -5.4128, 105.2586),
  ('fac-terminal',  'Terminal Rajabasa',      'Transportasi', -5.3717, 105.2406),
  ('fac-unila',     'Universitas Lampung',    'Kampus',       -5.3648, 105.2438),
  ('fac-saburai',   'Lapangan Saburai',       'Ruang publik', -5.4238, 105.2588),
  ('fac-panjang',   'Pelabuhan Panjang',      'Pelabuhan',    -5.4729, 105.3182),
  ('fac-kangkung',  'Pasar Kangkung',         'Pasar',        -5.4395, 105.2674)
on conflict (id) do update set
  name = excluded.name, type = excluded.type,
  lat = excluded.lat, lng = excluded.lng;

alter table public.public_facilities enable row level security;

drop policy if exists "public_facilities_read" on public.public_facilities;
create policy "public_facilities_read"
on public.public_facilities for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 3. Fungsi sub-skor
-- ---------------------------------------------------------------------------

create or replace function public.alirin_distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable parallel safe as $$
  select 6371 * 2 * atan2(sqrt(h), sqrt(greatest(0, 1 - h)))
  from (
    select power(sin(radians(lat2 - lat1) / 2), 2)
         + cos(radians(lat1)) * cos(radians(lat2))
         * power(sin(radians(lng2 - lng1) / 2), 2) as h
  ) t;
$$;

-- Keparahan 0-100. Nilai tak dikenal jatuh ke 'ringan', sama seperti klien.
create or replace function public.alirin_severity_score(p_severity text)
returns integer language sql immutable parallel safe as $$
  select case p_severity
    when 'kritis' then 100
    when 'parah'  then 80
    when 'sedang' then 55
    else 25
  end;
$$;

-- Cuaca 0-100 dari curah hujan 3 jam, mengikuti kelas intensitas hujan BMKG.
-- NULL berarti data tidak tersedia; bobotnya nanti dibagi ulang.
create or replace function public.alirin_weather_score(p_rainfall_mm double precision)
returns integer language sql immutable parallel safe as $$
  select case
    when p_rainfall_mm is null or p_rainfall_mm < 0 then null
    when p_rainfall_mm = 0  then 0
    when p_rainfall_mm < 1  then 20
    when p_rainfall_mm < 5  then 45
    when p_rainfall_mm < 10 then 70
    when p_rainfall_mm < 20 then 88
    else 100
  end;
$$;

-- Lokasi 0-100 dari jarak ke fasilitas publik terdekat.
create or replace function public.alirin_location_score(
  p_lat double precision, p_lng double precision
) returns integer language sql stable parallel safe as $$
  select case
    when d is null then 10
    when d <= 0.25 then 100
    when d <= 0.5  then 80
    when d <= 1    then 58
    when d <= 2    then 34
    else 10
  end
  from (
    select min(public.alirin_distance_km(p_lat, p_lng, f.lat, f.lng)) as d
    from public.public_facilities f
    where f.active
  ) t;
$$;

-- Histori 0-100: kejadian berulang di titik yang sama, 180 hari sebelum laporan
-- ini dibuat. Jendela berlabuh pada created_at laporan yang dinilai supaya
-- skornya deterministik. Laporan yang ditolak tidak ikut dihitung.
create or replace function public.alirin_history_score(
  p_id text, p_lat double precision, p_lng double precision, p_created_at timestamptz
) returns integer language sql stable parallel safe as $$
  select least(100, count(*)::integer * 20)
  from public.reports r
  -- Dicasting ke text agar cocok baik saat reports.id bertipe uuid (kondisi
  -- project live) maupun text (deklarasi di migrasi repo).
  where r.id::text is distinct from p_id
    and r.status <> 'ditolak'
    and r.created_at <= p_created_at
    and r.created_at >= p_created_at - interval '180 days'
    -- Ditulis sebagai rentang, bukan abs(), supaya indeks reports_lat_lng_idx
    -- bisa dipakai. Kotak pembatas ini memangkas kandidat sebelum haversine.
    and r.lat between p_lat - 0.0035 and p_lat + 0.0035
    and r.lng between p_lng - 0.0035 and p_lng + 0.0035
    and public.alirin_distance_km(p_lat, p_lng, r.lat, r.lng) <= 0.35;
$$;

create index if not exists reports_lat_lng_idx on public.reports (lat, lng);
create index if not exists reports_created_at_status_idx on public.reports (created_at, status);

-- Penggabungan berbobot. Bila cuaca NULL, bobot 25% dibagi ulang proporsional
-- ke tiga faktor lain sehingga skor antar laporan tetap sebanding.
create or replace function public.alirin_risk_score(
  p_severity integer, p_history integer, p_weather integer, p_location integer
) returns integer language sql immutable parallel safe as $$
  select greatest(0, least(100, round(
    (p_severity * 35 + p_history * 25 + coalesce(p_weather, 0) * 25 + p_location * 15)::numeric
    / (35 + 25 + 15 + case when p_weather is null then 0 else 25 end)
  )::integer));
$$;

create or replace function public.alirin_risk_level(p_score integer)
returns text language sql immutable parallel safe as $$
  select case
    when p_score >= 80 then 'Kritis'
    when p_score >= 60 then 'Tinggi'
    when p_score >= 40 then 'Waspada'
    else 'Normal'
  end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger: skor selalu dihitung ulang di sini
-- ---------------------------------------------------------------------------

create or replace function public.alirin_apply_risk()
returns trigger language plpgsql as $$
declare
  v_severity integer;
  v_history  integer;
  v_weather  integer;
  v_location integer;
  v_score    integer;
begin
  v_severity := public.alirin_severity_score(new.severity);
  v_history  := public.alirin_history_score(new.id::text, new.lat, new.lng, coalesce(new.created_at, now()));
  v_weather  := public.alirin_weather_score(new.rainfall_mm);
  v_location := public.alirin_location_score(new.lat, new.lng);
  v_score    := public.alirin_risk_score(v_severity, v_history, v_weather, v_location);

  new.risk_score := v_score;
  new.risk_level := public.alirin_risk_level(v_score);

  -- Arsip mengikuti status, tidak bergantung pada klien mana yang menulis.
  if new.status in ('selesai', 'ditolak') then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  return new;
end $$;

drop trigger if exists reports_apply_risk on public.reports;
create trigger reports_apply_risk
before insert or update of severity, lat, lng, rainfall_mm, created_at, status
on public.reports
for each row execute function public.alirin_apply_risk();

-- Rincian skor: enam faktor tabel Proposal 4.4, dua di antaranya masih bobot 0.
create or replace function public.alirin_write_breakdown()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_severity      integer;
  v_history       integer;
  v_history_count integer;
  v_weather       integer;
  v_location      integer;
  v_total         integer;
  v_photos        integer;
  v_evidence      integer;
  v_near          record;
begin
  v_severity := public.alirin_severity_score(new.severity);
  v_history  := public.alirin_history_score(new.id::text, new.lat, new.lng, coalesce(new.created_at, now()));
  v_weather  := public.alirin_weather_score(new.rainfall_mm);
  v_location := public.alirin_location_score(new.lat, new.lng);
  v_total    := 35 + 25 + 15 + case when v_weather is null then 0 else 25 end;

  select count(*)::integer into v_history_count
  from public.reports r
  where r.id is distinct from new.id
    and r.status <> 'ditolak'
    and r.created_at <= coalesce(new.created_at, now())
    and r.created_at >= coalesce(new.created_at, now()) - interval '180 days'
    and r.lat between new.lat - 0.0035 and new.lat + 0.0035
    and r.lng between new.lng - 0.0035 and new.lng + 0.0035
    and public.alirin_distance_km(new.lat, new.lng, r.lat, r.lng) <= 0.35;

  select count(*)::integer into v_photos
  from public.report_photos p
  where p.report_id = new.id and coalesce(p.kind, 'report') = 'report';

  v_evidence := round(100.0 * (
      (case when v_photos > 0 then 1 else 0 end)
    + (case when length(coalesce(trim(new.description), '')) >= 10 then 1 else 0 end)
    + 1
  ) / 3.0);

  select f.name, public.alirin_distance_km(new.lat, new.lng, f.lat, f.lng) as d
    into v_near
  from public.public_facilities f
  where f.active
  order by 2 asc
  limit 1;

  delete from public.risk_breakdowns where report_id = new.id;

  insert into public.risk_breakdowns (report_id, factor, label, points, weight, detail) values
    (new.id, 'severity', 'Keparahan laporan',
      round(v_severity * 35.0 / v_total), round(35.0 * 100 / v_total),
      'Tingkat ' || coalesce(new.severity, 'belum diisi')),
    (new.id, 'history', 'Histori kejadian',
      round(v_history * 25.0 / v_total), round(25.0 * 100 / v_total),
      v_history_count::text || ' laporan lain dalam radius 350 m, 180 hari terakhir'),
    (new.id, 'weather', 'Cuaca',
      case when v_weather is null then 0 else round(v_weather * 25.0 / v_total) end,
      case when v_weather is null then 0 else round(25.0 * 100 / v_total) end,
      case when v_weather is null
        then 'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain'
        else round(new.rainfall_mm::numeric, 1)::text || ' mm dalam 3 jam (BMKG)' end),
    (new.id, 'location', 'Dampak lokasi',
      round(v_location * 15.0 / v_total), round(15.0 * 100 / v_total),
      coalesce(v_near.name || ', ' || round(v_near.d::numeric, 1)::text || ' km',
               'Tidak ada fasilitas publik terdekat')),
    (new.id, 'bukti', 'Kelengkapan bukti', 0, 0,
      v_photos::text || ' foto, '
        || case when length(coalesce(trim(new.description), '')) >= 10
             then 'deskripsi lengkap' else 'deskripsi singkat' end
        || ', koordinat ada. Kelengkapan ' || v_evidence::text || '% (belum dibobot)'),
    (new.id, 'sensor', 'Sensor lapangan', 0, 0,
      'Menunggu integrasi IoT (roadmap Tahap 4)');

  return null;
end $$;

drop trigger if exists reports_write_breakdown on public.reports;
create trigger reports_write_breakdown
after insert or update of severity, lat, lng, rainfall_mm, description, status
on public.reports
for each row execute function public.alirin_write_breakdown();

-- Foto laporan disisipkan setelah baris laporan tersimpan, sehingga saat
-- alirin_write_breakdown berjalan jumlah fotonya masih nol. Trigger ini
-- menyegarkan rincian begitu fotonya menyusul.
create or replace function public.alirin_refresh_breakdown_on_photo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- TG_OP diperiksa eksplisit: pada DELETE record NEW tidak ter-assign, jadi
  -- membaca new.report_id di sana bisa melempar error saat dijalankan.
  -- Kolomnya dipakai langsung tanpa variabel perantara agar tipenya selalu
  -- cocok dengan reports.id dan indeks primary key tetap terpakai.
  if tg_op = 'DELETE' then
    update public.reports set severity = severity where id = old.report_id;
  else
    update public.reports set severity = severity where id = new.report_id;
  end if;
  return null;
end $$;

drop trigger if exists report_photos_refresh_breakdown on public.report_photos;
create trigger report_photos_refresh_breakdown
after insert or delete on public.report_photos
for each row execute function public.alirin_refresh_breakdown_on_photo();

-- ---------------------------------------------------------------------------
-- 5. Trigger: penjaga transisi status
-- ---------------------------------------------------------------------------
--
-- Sebelum ini hanya web yang menegakkan urutan status; mobile menulis apa saja,
-- sehingga tercatat lompatan masuk -> dijadwalkan dan dijadwalkan -> selesai.
-- Aturan di sini identik dengan app/src/domain/status.js.

create or replace function public.alirin_allowed_status_transition(p_from text, p_to text)
returns boolean language sql immutable parallel safe as $$
  select case
    when p_from = p_to then true
    when p_from = 'masuk'        then p_to in ('diverifikasi', 'ditolak')
    when p_from = 'diverifikasi' then p_to in ('dijadwalkan', 'ditolak', 'masuk')
    when p_from = 'dijadwalkan'  then p_to in ('ditangani', 'diverifikasi', 'ditolak')
    when p_from = 'ditangani'    then p_to in ('selesai', 'dijadwalkan', 'diverifikasi')
    else false
  end;
$$;

create or replace function public.alirin_guard_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not public.alirin_allowed_status_transition(old.status, new.status) then
      raise exception
        'Transisi status tidak valid: % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    -- Bukti penyelesaian wajib. Proposal 4.3.3 menempatkan bukti tindak lanjut
    -- sebagai syarat penutupan, dan 5.4 menuntut bukti penyelesaian yang jelas.
    if new.status = 'selesai'
       and coalesce(jsonb_array_length(new.completion_photos), 0) = 0
       and not exists (
         select 1 from public.report_photos p
         where p.report_id = new.id and p.kind = 'completion'
       )
    then
      raise exception
        'Laporan tidak dapat ditutup tanpa foto bukti penyelesaian.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists reports_guard_status on public.reports;
create trigger reports_guard_status
before update on public.reports
for each row execute function public.alirin_guard_status();

-- ---------------------------------------------------------------------------
-- 6. Identitas petugas
-- ---------------------------------------------------------------------------
--
-- reports.assigned_officer_id sebelumnya string bebas tanpa rujukan apa pun,
-- dan tabel officers tidak terhubung ke akun Auth.

-- Dibungkus DO agar kegagalan hak akses ke schema auth tidak membatalkan
-- seluruh migrasi. SQL Editor Supabase menjalankan skrip dalam satu transaksi,
-- sehingga satu error di sini akan me-rollback semua yang di atasnya.
do $outer$
begin
  alter table public.officers
    add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

  create unique index if not exists officers_auth_user_id_idx
    on public.officers (auth_user_id) where auth_user_id is not null;
exception when others then
  raise notice 'officers.auth_user_id dilewati: %. Kolom ini opsional; sisa migrasi tetap berlaku.', sqlerrm;
end $outer$;

-- Daftar petugas dibaca aplikasi untuk penugasan, jadi nama & wilayah boleh
-- terbaca staff. Nomor telepon tetap hanya untuk staff yang login.
drop policy if exists "officers_staff_select" on public.officers;
create policy "officers_staff_select"
on public.officers for select to authenticated using (public.alirin_is_staff());

-- ---------------------------------------------------------------------------
-- 7. Hak akses
-- ---------------------------------------------------------------------------

-- Rincian skor kini ditulis trigger, bukan klien.
drop policy if exists "risk_breakdowns_public_insert" on public.risk_breakdowns;

-- Foto hanya boleh ditempelkan ke laporan yang baru masuk, bukan ke laporan
-- mana pun milik orang lain.
drop policy if exists "report_photos_public_insert" on public.report_photos;
create policy "report_photos_public_insert"
on public.report_photos for insert to anon, authenticated
with check (
  public.alirin_is_staff()
  or (
    coalesce(kind, 'report') = 'report'
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.status = 'masuk'
    )
  )
);

-- Riwayat status awal juga hanya untuk laporan yang masih berstatus masuk.
drop policy if exists "report_status_history_public_insert" on public.report_status_history;
create policy "report_status_history_public_insert"
on public.report_status_history for insert to anon, authenticated
with check (
  public.alirin_is_staff()
  or (
    status = 'masuk'
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.status = 'masuk'
    )
  )
);

-- Policy Storage. Dideklarasikan ulang di sini karena terbukti tidak ada di
-- project live: sesi admin mengirim DELETE ke /storage/v1/object/reports dan
-- dijawab HTTP 200 dengan nol berkas terhapus, artinya RLS menyaring semua
-- baris. Akibatnya berkas yatim tidak bisa dibersihkan lewat aplikasi sama
-- sekali. Gejala yang sama dengan CHECK constraint yang hilang: migrasi
-- 20260605000100 memakai bentuk yang tidak pernah dieksekusi di remote.
-- storage.objects dimiliki supabase_storage_admin, sehingga peran yang
-- menjalankan SQL Editor belum tentu boleh memasang policy di atasnya. Karena
-- seluruh skrip berjalan dalam satu transaksi, kegagalan di sini akan
-- membatalkan Risk Engine yang sudah dibuat di atas. Jadi blok ini dibuat
-- tidak mematikan: kalau ditolak, migrasi lanjut dan mencetak catatan.
do $outer$
begin
  execute $p$ drop policy if exists "reports_storage_public_read" on storage.objects $p$;
  execute $p$
    create policy "reports_storage_public_read"
    on storage.objects for select to anon, authenticated
    using (bucket_id = 'reports')
  $p$;

  execute $p$ drop policy if exists "reports_storage_public_upload" on storage.objects $p$;
  execute $p$
    create policy "reports_storage_public_upload"
    on storage.objects for insert to anon, authenticated
    with check (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = 'report-photos'
    )
  $p$;

  execute $p$ drop policy if exists "reports_storage_staff_update" on storage.objects $p$;
  execute $p$
    create policy "reports_storage_staff_update"
    on storage.objects for update to authenticated
    using (bucket_id = 'reports' and public.alirin_is_staff())
    with check (bucket_id = 'reports' and public.alirin_is_staff())
  $p$;

  execute $p$ drop policy if exists "reports_storage_staff_delete" on storage.objects $p$;
  execute $p$
    create policy "reports_storage_staff_delete"
    on storage.objects for delete to authenticated
    using (bucket_id = 'reports' and public.alirin_is_staff())
  $p$;

  raise notice 'Policy Storage terpasang.';
exception when others then
  raise notice 'Policy Storage dilewati: %.', sqlerrm;
  raise notice 'Pasang manual lewat Dashboard > Storage > Policies pada bucket reports, atau jalankan blok ini sebagai supabase_storage_admin. Tanpa itu, pembersihan berkas yatim tidak bisa dijalankan.';
end $outer$;

-- Moderasi: admin perlu jalan menghapus spam, duplikat, dan data uji.
-- Sebelumnya tidak ada policy DELETE sama sekali di seluruh tabel.
drop policy if exists "reports_admin_delete" on public.reports;
create policy "reports_admin_delete"
on public.reports for delete to authenticated
using (public.alirin_user_role() = 'admin');

drop policy if exists "report_photos_admin_delete" on public.report_photos;
create policy "report_photos_admin_delete"
on public.report_photos for delete to authenticated
using (public.alirin_user_role() = 'admin');

drop policy if exists "risk_breakdowns_admin_delete" on public.risk_breakdowns;
create policy "risk_breakdowns_admin_delete"
on public.risk_breakdowns for delete to authenticated
using (public.alirin_user_role() = 'admin');

drop policy if exists "report_status_history_admin_delete" on public.report_status_history;
create policy "report_status_history_admin_delete"
on public.report_status_history for delete to authenticated
using (public.alirin_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 8. View publik: koordinat dibulatkan
-- ---------------------------------------------------------------------------
--
-- Proposal 5.4: "data pelapor dan koordinat hanya dapat diakses petugas
-- berwenang". View lama mengekspos lat/lng presisi penuh ke anon, cukup untuk
-- menunjuk rumah pelapor. Pembulatan 3 desimal ~110 m: masih akurat untuk peta
-- risiko kota, tidak lagi menunjuk bangunan.

drop view if exists public.public_reports;

create view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  round(r.lat::numeric, 3)::double precision as lat,
  round(r.lng::numeric, 3)::double precision as lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.submission_mode,
  r.rainfall_mm,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', p.id, 'url', p.url, 'name', p.name,
                           'type', p.type, 'size', p.size, 'kind', p.kind)
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id and coalesce(p.kind, 'report') = 'report'
    ), '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', coalesce(b.factor, b.id::text), 'label', b.label,
                           'points', b.points, 'weight', b.weight, 'detail', b.detail)
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ), '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ), '[]'::jsonb
  ) as report_status_history
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- RPC pelacakan token ikut diperbarui agar rincian skor memakai kunci faktor
-- yang sama dengan view. Tanpa ini, halaman status warga menerima uuid sebagai
-- id faktor dan tidak bisa mencocokkannya dengan label mana pun.
create or replace function public.get_report_by_tracking_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(r)
    || jsonb_build_object(
      'report_photos', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id, 'url', p.url, 'name', p.name,
              'type', p.type, 'size', p.size, 'kind', p.kind
            )
            order by p.created_at
          )
          from public.report_photos p
          where p.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'risk_breakdowns', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', coalesce(b.factor, b.id::text), 'label', b.label,
              'points', b.points, 'weight', b.weight, 'detail', b.detail
            )
          )
          from public.risk_breakdowns b
          where b.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'report_status_history', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
            order by h.at
          )
          from public.report_status_history h
          where h.report_id = r.id
        ),
        '[]'::jsonb
      )
    )
  from public.reports r
  where r.public_tracking_token = p_token
  limit 1;
$$;

revoke all on function public.get_report_by_tracking_token(text) from public;
grant execute on function public.get_report_by_tracking_token(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Hitung ulang seluruh laporan yang sudah ada
-- ---------------------------------------------------------------------------
--
-- Menyentuh setiap baris agar trigger menyeragamkan risk_score, risk_level,
-- archived_at, dan rincian skor dengan rumus baru.
--
-- Wajib dijalankan SEBELUM constraint di bagian 10: constraint NOT VALID tetap
-- diperiksa pada setiap UPDATE, sehingga baris lama yang melanggar (severity
-- 'ngawur', wilayah kosong) akan menggagalkan seluruh migrasi bila urutannya
-- dibalik.

update public.reports set severity = severity;

-- ---------------------------------------------------------------------------
-- 10. Constraint integritas
-- ---------------------------------------------------------------------------
--
-- Migrasi 20260605000100 memakai "create table if not exists", sehingga pada
-- project yang tabelnya sudah ada lebih dulu seluruh CHECK di dalamnya tidak
-- pernah terpasang. Terbukti dari baris ber-severity 'ngawur' dan risk_level
-- 'Rendah' di database live. Constraint dipasang di sini secara eksplisit.
--
-- Dipasang NOT VALID supaya baris lama yang melanggar tidak memblokir migrasi;
-- penulisan baru tetap ditolak. Migrasi pembersihan berikutnya yang mem-VALIDATE
-- setelah baris uji dibuang.

alter table public.reports drop constraint if exists reports_severity_check;
alter table public.reports add constraint reports_severity_check
  check (severity in ('ringan', 'sedang', 'parah', 'kritis')) not valid;

alter table public.reports drop constraint if exists reports_category_check;
alter table public.reports add constraint reports_category_check
  check (category in ('sumbatan', 'genangan', 'aliran-lambat', 'drainase-rusak', 'bau', 'lainnya')) not valid;

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('masuk', 'diverifikasi', 'dijadwalkan', 'ditangani', 'selesai', 'ditolak')) not valid;

alter table public.reports drop constraint if exists reports_risk_score_check;
alter table public.reports add constraint reports_risk_score_check
  check (risk_score between 0 and 100) not valid;

alter table public.reports drop constraint if exists reports_risk_level_check;
alter table public.reports add constraint reports_risk_level_check
  check (risk_level in ('Normal', 'Waspada', 'Tinggi', 'Kritis')) not valid;

-- Batas wilayah Kota Bandar Lampung. Koordinat di luar ini adalah salah isi,
-- bukan laporan yang sah.
alter table public.reports drop constraint if exists reports_coordinate_bounds_check;
alter table public.reports add constraint reports_coordinate_bounds_check
  check (lat between -5.62 and -5.28 and lng between 105.15 and 105.36) not valid;

alter table public.reports drop constraint if exists reports_area_filled_check;
alter table public.reports add constraint reports_area_filled_check
  check (length(trim(kecamatan)) > 0 and length(trim(kelurahan)) > 0) not valid;

alter table public.reports drop constraint if exists reports_assigned_officer_fk;
alter table public.reports add constraint reports_assigned_officer_fk
  foreign key (assigned_officer_id) references public.officers (id)
  on delete set null not valid;

comment on function public.alirin_risk_score(integer, integer, integer, integer) is
  'Risk & Priority Engine ALIRIN. Bobot Proposal 4.4: keparahan 35, histori 25, cuaca 25, lokasi 15. Spesifikasi: docs/RISK-ENGINE.md';

-- ###########################################################################
-- # (9/16) 20260826091000_cleanup_probe_rows.sql
-- ###########################################################################

-- Pembersihan artefak probe dan pengaktifan constraint.
--
-- WAJIB dijalankan SETELAH 20260826090000_risk_engine.sql. Migrasi itulah yang
-- membuat constraint-nya; tanpa itu, VALIDATE di bawah tidak punya sasaran.
--
-- Yang dihapus HANYA baris yang tokennya berpola 'trk_probe_%'. Baris itu
-- ditanam manual saat pengujian lubang akses, bukan lewat aplikasi: tokennya
-- bisa ditebak, severity-nya 'ngawur' (nilai yang tidak pernah dihasilkan
-- aplikasi mana pun), dan tidak punya riwayat status sama sekali.
--
-- Yang SENGAJA TIDAK dihapus:
--   ALR-2026-9988/9989/9990 - kiriman mobile Lapor Cepat yang sah. Tidak punya
--     foto karena versi mobile lama memang tidak mewajibkannya pada mode Cepat.
--     Ini data uji pemakaian, bukan sampah.
--   ALR-2026-0013/0014 - wilayahnya kosong dan koordinatnya jatuh ke titik
--     cadangan pusat kota. Rusak, tetapi isinya laporan sungguhan. Perbaikan
--     atau penghapusannya diserahkan ke admin lewat policy DELETE yang baru,
--     bukan diputuskan migrasi.

-- ---------------------------------------------------------------------------
-- 0. Pastikan migrasi Risk Engine sudah berjalan
-- ---------------------------------------------------------------------------
--
-- Tanpa penjagaan ini, menjalankan berkas ini lebih dulu berakhir dengan
-- "constraint reports_severity_check does not exist" yang tidak menjelaskan
-- apa pun tentang penyebabnya.

do $$
begin
  if to_regprocedure('public.alirin_risk_score(integer,integer,integer,integer)') is null then
    raise exception
      'Migrasi 20260826090000_risk_engine.sql belum dijalankan. Jalankan berkas itu lebih dulu, baru berkas ini.'
      using errcode = 'raise_exception';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Hapus artefak probe
-- ---------------------------------------------------------------------------

delete from public.reports
where public_tracking_token like 'trk\_probe\_%';

-- ---------------------------------------------------------------------------
-- 2. Aktifkan constraint yang sudah bisa lolos untuk seluruh baris tersisa
-- ---------------------------------------------------------------------------
--
-- Di-VALIDATE satu per satu di dalam blok. Constraint yang belum ada dilewati
-- dengan catatan, dan constraint yang masih dilanggar baris lama tidak
-- membatalkan seluruh migrasi.

do $$
declare
  target text;
begin
  foreach target in array array[
    'reports_severity_check',
    'reports_category_check',
    'reports_status_check',
    'reports_risk_score_check',
    'reports_risk_level_check',
    'reports_coordinate_bounds_check',
    'reports_assigned_officer_fk'
  ]
  loop
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.reports'::regclass and conname = target
    ) then
      raise notice 'Dilewati: constraint % belum ada.', target;
      continue;
    end if;

    begin
      execute format('alter table public.reports validate constraint %I', target);
      raise notice 'Aktif: %.', target;
    exception when others then
      raise notice 'Belum bisa diaktifkan: % (%). Perbaiki baris yang melanggar lalu ulangi.', target, sqlerrm;
    end;
  end loop;
end $$;

-- reports_area_filled_check sengaja tidak ikut divalidasi: ALR-2026-0013 dan
-- ALR-2026-0014 masih berwilayah kosong. Menebak wilayahnya berarti mengarang
-- data. Constraint tetap menolak penulisan baru; jalankan
--   alter table public.reports validate constraint reports_area_filled_check;
-- setelah kedua baris itu diperbaiki atau dihapus admin.

-- ###########################################################################
-- # (10/16) 20260826100000_breakdown_apportion.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- P-2 · Rincian skor siap ditampilkan ke pengguna
-- ---------------------------------------------------------------------------
--
-- Dua perubahan, keduanya prasyarat sebelum rincian skor dipamerkan di layar.
--
-- 1. Poin tiap faktor kini berjumlah persis sama dengan skor akhir.
--    Sebelumnya tiap poin dibulatkan sendiri-sendiri, sehingga jumlahnya bisa
--    meleset satu poin dari skor -- mis. 47 + 0 + 7 = 54 pada laporan berskor
--    53. Selisih itu tidak terlihat selama rinciannya tidak ditampilkan.
--    Begitu ditampilkan, angka yang tidak berjumlah adalah cacat yang langsung
--    terlihat.
--
-- 2. Isi trigger dipindahkan ke fungsi yang menerima baris laporan, sehingga
--    rincian bisa dibangun ulang tanpa meng-UPDATE tabel reports. Ini
--    sekaligus memperbaiki bug laten: alirin_refresh_breakdown_on_photo
--    memakai `update reports set severity = severity`, dan pada dua laporan
--    berwilayah kosong UPDATE itu gagal karena reports_area_filled_check ikut
--    diperiksa. Artinya menambah foto ke laporan tersebut melempar error.

-- ---------------------------------------------------------------------------
-- 1. Pembagian sisa terbesar
-- ---------------------------------------------------------------------------
--
-- Tiap faktor mendapat bagian bulat ke bawah, lalu sisa poin dibagikan satu
-- per satu ke faktor dengan pecahan terbesar. Hasilnya selalu berjumlah
-- p_total, dan pembulatannya jatuh ke faktor yang paling berhak.

create or replace function public.alirin_apportion(p_exact numeric[], p_total integer)
returns integer[] language plpgsql immutable parallel safe as $$
declare
  v_n    integer := coalesce(array_length(p_exact, 1), 0);
  v_out  integer[];
  v_frac numeric[];
  v_gap  integer;
  v_best integer;
  i      integer;
begin
  if v_n = 0 then
    return array[]::integer[];
  end if;

  v_out  := array_fill(0, array[v_n]);
  v_frac := array_fill(0::numeric, array[v_n]);

  for i in 1 .. v_n loop
    v_out[i]  := floor(p_exact[i])::integer;
    v_frac[i] := p_exact[i] - floor(p_exact[i]);
  end loop;

  v_gap := p_total - (select coalesce(sum(x), 0) from unnest(v_out) as x);

  -- Sisa tidak pernah melebihi jumlah faktor, jadi perulangannya pendek.
  while v_gap > 0 loop
    v_best := 1;
    for i in 2 .. v_n loop
      if v_frac[i] > v_frac[v_best] then
        v_best := i;
      end if;
    end loop;
    v_out[v_best]  := v_out[v_best] + 1;
    v_frac[v_best] := -1;  -- sudah kebagian, tidak dipilih lagi
    v_gap := v_gap - 1;
  end loop;

  return v_out;
end $$;

-- Urutan faktor mengikuti tabel Proposal 4.4. Faktor tak dikenal jatuh ke
-- belakang alih-alih menghilang.
create or replace function public.alirin_factor_rank(p_factor text)
returns integer language sql immutable parallel safe as $$
  select coalesce(
    array_position(
      array['severity', 'history', 'weather', 'location', 'bukti', 'sensor']::text[],
      p_factor
    ),
    99
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Pembangun rincian yang bisa dipanggil langsung
-- ---------------------------------------------------------------------------

create or replace function public.alirin_rebuild_breakdown(r public.reports)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_severity      integer;
  v_history       integer;
  v_history_count integer;
  v_weather       integer;
  v_location      integer;
  v_total         integer;
  v_photos        integer;
  v_evidence      integer;
  v_near          record;
  v_points        integer[];
begin
  v_severity := public.alirin_severity_score(r.severity);
  v_history  := public.alirin_history_score(r.id::text, r.lat, r.lng, coalesce(r.created_at, now()));
  v_weather  := public.alirin_weather_score(r.rainfall_mm);
  v_location := public.alirin_location_score(r.lat, r.lng);
  v_total    := 35 + 25 + 15 + case when v_weather is null then 0 else 25 end;

  select count(*)::integer into v_history_count
  from public.reports x
  where x.id is distinct from r.id
    and x.status <> 'ditolak'
    and x.created_at <= coalesce(r.created_at, now())
    and x.created_at >= coalesce(r.created_at, now()) - interval '180 days'
    and x.lat between r.lat - 0.0035 and r.lat + 0.0035
    and x.lng between r.lng - 0.0035 and r.lng + 0.0035
    and public.alirin_distance_km(r.lat, r.lng, x.lat, x.lng) <= 0.35;

  select count(*)::integer into v_photos
  from public.report_photos p
  where p.report_id = r.id and coalesce(p.kind, 'report') = 'report';

  v_evidence := round(100.0 * (
      (case when v_photos > 0 then 1 else 0 end)
    + (case when length(coalesce(trim(r.description), '')) >= 10 then 1 else 0 end)
    + 1
  ) / 3.0);

  select f.name, public.alirin_distance_km(r.lat, r.lng, f.lat, f.lng) as d
    into v_near
  from public.public_facilities f
  where f.active
  order by 2 asc
  limit 1;

  -- Poin dibagi dari skor yang tersimpan, bukan dibulatkan sendiri-sendiri,
  -- supaya jumlahnya selalu sama dengan angka yang dilihat pengguna.
  v_points := public.alirin_apportion(
    array[
      v_severity * 35.0 / v_total,
      v_history  * 25.0 / v_total,
      case when v_weather is null then 0 else v_weather * 25.0 / v_total end,
      v_location * 15.0 / v_total
    ],
    coalesce(r.risk_score, public.alirin_risk_score(v_severity, v_history, v_weather, v_location))
  );

  delete from public.risk_breakdowns where report_id = r.id;

  insert into public.risk_breakdowns (report_id, factor, label, points, weight, detail) values
    (r.id, 'severity', 'Keparahan laporan',
      v_points[1], round(35.0 * 100 / v_total),
      'Tingkat ' || coalesce(r.severity, 'belum diisi')),
    (r.id, 'history', 'Histori kejadian',
      v_points[2], round(25.0 * 100 / v_total),
      v_history_count::text || ' laporan lain dalam radius 350 m, 180 hari terakhir'),
    (r.id, 'weather', 'Cuaca',
      v_points[3],
      case when v_weather is null then 0 else round(25.0 * 100 / v_total) end,
      case when v_weather is null
        then 'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain'
        else round(r.rainfall_mm::numeric, 1)::text || ' mm dalam 3 jam (BMKG)' end),
    (r.id, 'location', 'Dampak lokasi',
      v_points[4], round(15.0 * 100 / v_total),
      coalesce(v_near.name || ', ' || round(v_near.d::numeric, 1)::text || ' km',
               'Tidak ada fasilitas publik terdekat')),
    (r.id, 'bukti', 'Kelengkapan bukti', 0, 0,
      v_photos::text || ' foto, '
        || case when length(coalesce(trim(r.description), '')) >= 10
             then 'deskripsi lengkap' else 'deskripsi singkat' end
        || ', koordinat ada. Kelengkapan ' || v_evidence::text || '% (belum dibobot)'),
    (r.id, 'sensor', 'Sensor lapangan', 0, 0,
      'Menunggu integrasi IoT (roadmap Tahap 4)');
end $$;

-- ---------------------------------------------------------------------------
-- 3. Trigger memakai fungsi di atas
-- ---------------------------------------------------------------------------

create or replace function public.alirin_write_breakdown()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.alirin_rebuild_breakdown(new);
  return null;
end $$;

-- Foto disisipkan setelah baris laporan tersimpan, sehingga saat rincian
-- pertama kali ditulis jumlah fotonya masih nol. Trigger ini menyegarkannya
-- begitu foto menyusul -- kini tanpa meng-UPDATE reports.
create or replace function public.alirin_refresh_breakdown_on_photo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_report public.reports;
begin
  -- TG_OP diperiksa eksplisit dan di luar SQL: pada INSERT record OLD tidak
  -- ter-assign dan pada DELETE record NEW tidak ter-assign, jadi keduanya tidak
  -- boleh muncul dalam satu ekspresi yang sama.
  if tg_op = 'DELETE' then
    select * into v_report from public.reports where id = old.report_id;
  else
    select * into v_report from public.reports where id = new.report_id;
  end if;

  if found then
    perform public.alirin_rebuild_breakdown(v_report);
  end if;
  return null;
end $$;

-- Hanya dipanggil dari trigger. SECURITY DEFINER berarti fungsi ini menulis
-- dengan hak pemilik, jadi jangan biarkan klien memanggilnya sendiri dengan
-- baris karangan. Trigger tetap bisa karena ia berjalan sebagai pemilik.
revoke execute on function public.alirin_rebuild_breakdown(public.reports)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Bangun ulang rincian laporan yang sudah ada
-- ---------------------------------------------------------------------------
--
-- Lewat fungsi, bukan lewat UPDATE, sehingga dua laporan berwilayah kosong
-- ikut terbangun ulang alih-alih menggagalkan seluruh migrasi.

do $$
declare
  v_report public.reports;
begin
  for v_report in select * from public.reports loop
    perform public.alirin_rebuild_breakdown(v_report);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Urutan faktor yang ditentukan
-- ---------------------------------------------------------------------------
--
-- jsonb_agg tanpa ORDER BY mengembalikan baris dalam urutan yang tidak
-- dijanjikan. Selama rincian tidak ditampilkan, hal itu tidak terasa. Begitu
-- ditampilkan, urutan faktornya bisa berubah-ubah antar pemuatan. Urutannya
-- dipatok mengikuti tabel Proposal 4.4.

create or replace view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  round(r.lat::numeric, 3)::double precision as lat,
  round(r.lng::numeric, 3)::double precision as lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.submission_mode,
  r.rainfall_mm,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', p.id, 'url', p.url, 'name', p.name,
                           'type', p.type, 'size', p.size, 'kind', p.kind)
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id and coalesce(p.kind, 'report') = 'report'
    ), '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', coalesce(b.factor, b.id::text), 'label', b.label,
                           'points', b.points, 'weight', b.weight, 'detail', b.detail)
        order by public.alirin_factor_rank(b.factor)
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ), '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ), '[]'::jsonb
  ) as report_status_history
from public.reports r;

grant select on public.public_reports to anon, authenticated;

create or replace function public.get_report_by_tracking_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(r)
    || jsonb_build_object(
      'report_photos', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id, 'url', p.url, 'name', p.name,
              'type', p.type, 'size', p.size, 'kind', p.kind
            )
            order by p.created_at
          )
          from public.report_photos p
          where p.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'risk_breakdowns', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', coalesce(b.factor, b.id::text), 'label', b.label,
              'points', b.points, 'weight', b.weight, 'detail', b.detail
            )
            order by public.alirin_factor_rank(b.factor)
          )
          from public.risk_breakdowns b
          where b.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'report_status_history', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
            order by h.at
          )
          from public.report_status_history h
          where h.report_id = r.id
        ),
        '[]'::jsonb
      )
    )
  from public.reports r
  where r.public_tracking_token = p_token
  limit 1;
$$;

revoke all on function public.get_report_by_tracking_token(text) from public;
grant execute on function public.get_report_by_tracking_token(text) to anon, authenticated;

-- ###########################################################################
-- # (11/16) 20260826110000_hulu_hilir.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- P-3 · Relasi hulu-hilir
-- ---------------------------------------------------------------------------
--
-- Inovasi ke-2 proposal, dan satu-satunya janji yang sampai sekarang nol
-- implementasi di kedua codebase. Wujudnya di sini bukan pemodelan hidrologi,
-- melainkan tiga hal sederhana:
--
--   1. Tabel relasi antar kecamatan, diisi dari wawancara lapangan yang sudah
--      ada di Proposal 1.1 dan 1.4. Tiap baris membawa kolom `sumber` supaya
--      asalnya bisa ditelusuri dan tidak ada yang mengarang relasi.
--   2. Cache curah hujan per kecamatan, diisi klien saat memanggil BMKG.
--   3. Faktor Cuaca membaca hujan di kecamatan hulu, bukan hanya di titik
--      laporan. Inilah yang menerjemahkan wawasan warga menjadi angka --
--      "hujan lokal belum tentu langsung memicu banjir" (Proposal 1.4).
--
-- Bobotnya tidak berubah: Cuaca tetap 25%. Yang berubah adalah nilai yang
-- masuk ke sub-skor Cuaca.

-- ---------------------------------------------------------------------------
-- 1. Relasi antar wilayah
-- ---------------------------------------------------------------------------

create table if not exists public.area_flow_relations (
  id              text primary key,
  kecamatan_hulu  text not null,
  kecamatan_hilir text not null,
  kekuatan        smallint not null,
  sumber          text not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint area_flow_kekuatan_check check (kekuatan between 1 and 3),
  constraint area_flow_beda_check check (kecamatan_hulu <> kecamatan_hilir),
  constraint area_flow_unik unique (kecamatan_hulu, kecamatan_hilir)
);

comment on column public.area_flow_relations.kekuatan is
  '3 = disebut langsung oleh warga di lokasi terdampak, 2 = disebut pada arah aliran umum, 1 = arah aliran umum dan berjarak jauh';
comment on column public.area_flow_relations.sumber is
  'Kutipan asal relasi. Tidak boleh diisi selain dari bukti lapangan yang tertulis.';

-- Seluruh baris di bawah berasal dari Proposal ALIRIN. Tidak ada yang
-- ditambahkan dari perkiraan sendiri.
--
-- Proposal 1.1: "Genangan di satu titik dapat dipengaruhi aliran dari Kemiling,
-- BKP, Gunung Betung, atau Batu Putu menuju Rajabasa, Telukbetung, Kedaton, dan
-- Sukarame."
--
-- Proposal 1.4, Kota Karang (Telukbetung): "Banjir besar di wilayah bawah dapat
-- dipengaruhi kiriman air dari Gunung Betung dan Batu Putu."
--
-- Proposal 1.4, Perumahan Gelora Persada (Rajabasa Raya): "Warga Rajabasa
-- mengenali hubungan banjir dengan hujan deras di Kemiling dan BKP."
--
-- Catatan pemetaan nama: BKP (Bukit Kemiling Permai) berada di Kecamatan
-- Kemiling; Batu Putu adalah kelurahan di Kecamatan Teluk Betung Barat;
-- Gunung Betung adalah kawasan perbukitan di atas Kemiling dan Teluk Betung
-- Barat; Kota Karang adalah kelurahan di Kecamatan Teluk Betung Timur.
-- "Telukbetung" pada Proposal 1.1 tidak menyebut satu dari empat kecamatan
-- Teluk Betung, jadi relasi yang bersandar padanya diberi kekuatan lebih rendah
-- daripada yang disebut langsung di 1.4.

insert into public.area_flow_relations (id, kecamatan_hulu, kecamatan_hilir, kekuatan, sumber) values
  ('flow-kemiling-rajabasa', 'Kemiling', 'Rajabasa', 3,
   'Proposal 1.4 Gelora Persada: warga Rajabasa mengenali hubungan banjir dengan hujan deras di Kemiling dan BKP'),
  ('flow-tbb-tbt', 'Teluk Betung Barat', 'Teluk Betung Timur', 3,
   'Proposal 1.4 Kota Karang: kiriman air dari Gunung Betung dan Batu Putu (Batu Putu = kelurahan di Teluk Betung Barat)'),
  ('flow-kemiling-tbb', 'Kemiling', 'Teluk Betung Barat', 2,
   'Proposal 1.1: aliran dari Kemiling dan Gunung Betung menuju Telukbetung'),
  ('flow-kemiling-kedaton', 'Kemiling', 'Kedaton', 2,
   'Proposal 1.1: aliran dari Kemiling dan BKP menuju Kedaton'),
  ('flow-kemiling-tbu', 'Kemiling', 'Teluk Betung Utara', 1,
   'Proposal 1.1: aliran menuju Telukbetung, kecamatannya tidak disebut spesifik'),
  ('flow-rajabasa-kedaton', 'Rajabasa', 'Kedaton', 2,
   'Proposal 1.1: Rajabasa dan Kedaton sama-sama penerima aliran, Rajabasa berada di atas Kedaton'),
  ('flow-kedaton-sukarame', 'Kedaton', 'Sukarame', 1,
   'Proposal 1.1: aliran menuju Kedaton dan Sukarame, Sukarame berada lebih hilir')
on conflict (id) do update set
  kecamatan_hulu = excluded.kecamatan_hulu,
  kecamatan_hilir = excluded.kecamatan_hilir,
  kekuatan = excluded.kekuatan,
  sumber = excluded.sumber;

alter table public.area_flow_relations enable row level security;

drop policy if exists "area_flow_relations_read" on public.area_flow_relations;
create policy "area_flow_relations_read"
on public.area_flow_relations for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 2. Cache curah hujan per kecamatan
-- ---------------------------------------------------------------------------
--
-- Satu baris per kecamatan, ditimpa setiap kali ada klien yang memanggil BMKG.
-- Kuncinya kecamatan, jadi tabelnya tidak bisa tumbuh melebihi 20 baris dan
-- tidak perlu dibersihkan berkala.
--
-- KEAMANAN: anon boleh menulis, sama seperti anon boleh mengirim laporan.
-- Nilainya dibatasi constraint 0-500 mm dan hanya dipakai bila umurnya di bawah
-- 3 jam, tetapi pengguna yang berniat jahat tetap bisa menaikkan angka satu
-- kecamatan. Selama masih prototipe ini dapat diterima; pemindahan panggilan
-- BMKG ke Edge Function (rekomendasi P-1) menutupnya sekaligus.

create table if not exists public.area_weather (
  kecamatan    text primary key,
  rainfall_mm  double precision not null,
  weather_desc text,
  observed_at  timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint area_weather_rainfall_check check (rainfall_mm >= 0 and rainfall_mm <= 500)
);

alter table public.area_weather enable row level security;

drop policy if exists "area_weather_read" on public.area_weather;
create policy "area_weather_read"
on public.area_weather for select to anon, authenticated using (true);

drop policy if exists "area_weather_write" on public.area_weather;
create policy "area_weather_write"
on public.area_weather for insert to anon, authenticated with check (true);

drop policy if exists "area_weather_update" on public.area_weather;
create policy "area_weather_update"
on public.area_weather for update to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 3. Curah hujan efektif
-- ---------------------------------------------------------------------------
--
-- Hujan di hulu tidak diteruskan bulat-bulat: dikalikan kekuatan relasi dibagi
-- 3, sehingga relasi yang disebut langsung oleh warga berpengaruh penuh dan
-- relasi arah aliran umum berpengaruh sebagian.
--
-- Yang dipakai adalah yang terbesar antara hujan lokal dan sumbangan hulu.
-- Bukan dijumlahkan: sub-skor Cuaca menyatakan intensitas hujan, bukan volume.

-- Nama kecamatan ditulis berbeda-beda: aplikasi memakai 'Teluk Betung Barat',
-- BMKG menulis 'Telukbetung Barat'. Pencocokan mengabaikan spasi dan tanda baca
-- supaya keduanya tetap bertemu.
create or replace function public.alirin_area_key(p_area text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(lower(coalesce(p_area, '')), '[^a-z0-9]', '', 'g');
$$;

create or replace function public.alirin_rain_context(
  p_kecamatan text,
  p_local     double precision,
  p_at        timestamptz
)
returns table (
  effective    double precision,
  up_kecamatan text,
  up_rainfall  double precision,
  up_effective double precision,
  up_kekuatan  smallint
)
language sql stable as $$
  with hulu as (
    select w.kecamatan, w.rainfall_mm, f.kekuatan,
           w.rainfall_mm * (f.kekuatan / 3.0) as sumbangan
    from public.area_flow_relations f
    join public.area_weather w
      on public.alirin_area_key(w.kecamatan) = public.alirin_area_key(f.kecamatan_hulu)
    where f.active
      and public.alirin_area_key(f.kecamatan_hilir) = public.alirin_area_key(p_kecamatan)
      and w.observed_at between p_at - interval '3 hours' and p_at + interval '3 hours'
    order by 4 desc
    limit 1
  )
  select
    case
      when p_local is null and not exists (select 1 from hulu) then null
      else greatest(coalesce(p_local, 0), coalesce((select sumbangan from hulu), 0))
    end,
    (select kecamatan from hulu),
    (select rainfall_mm from hulu),
    (select sumbangan from hulu),
    (select kekuatan from hulu);
$$;

-- Label intensitas hujan, mengikuti kelas BMKG yang sama dengan
-- describeRainfall di web dan RiskEngine.describeRainfall di mobile.
-- Sebelumnya hanya klien yang punya label ini, sehingga rincian yang tersimpan
-- di basis data berbunyi "18.0 mm dalam 3 jam" tanpa menyebut itu hujan lebat.
create or replace function public.alirin_rainfall_label(p_mm double precision)
returns text language sql immutable parallel safe as $$
  select case
    when p_mm is null or p_mm < 0 then 'Data BMKG belum tersedia'
    when p_mm = 0   then 'Tidak hujan'
    when p_mm < 1   then 'Gerimis'
    when p_mm < 5   then 'Hujan ringan'
    when p_mm < 10  then 'Hujan sedang'
    when p_mm < 20  then 'Hujan lebat'
    else 'Hujan sangat lebat'
  end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Laporan menyimpan konteks hulu yang dipakai
-- ---------------------------------------------------------------------------
--
-- Cache cuaca ditimpa terus-menerus, jadi nilai yang dipakai saat menilai harus
-- ikut tersimpan di barisnya. Tanpa ini skor lama tidak bisa direproduksi.

alter table public.reports add column if not exists upstream_kecamatan text;
alter table public.reports add column if not exists upstream_rainfall_mm double precision;

-- ---------------------------------------------------------------------------
-- 5. Trigger skor membaca hulu
-- ---------------------------------------------------------------------------

create or replace function public.alirin_apply_risk()
returns trigger language plpgsql as $$
declare
  v_severity integer;
  v_history  integer;
  v_weather  integer;
  v_location integer;
  v_score    integer;
  v_rain     record;
begin
  select * into v_rain from public.alirin_rain_context(
    new.kecamatan, new.rainfall_mm, coalesce(new.created_at, now())
  );

  v_severity := public.alirin_severity_score(new.severity);
  v_history  := public.alirin_history_score(new.id::text, new.lat, new.lng, coalesce(new.created_at, now()));
  v_weather  := public.alirin_weather_score(v_rain.effective);
  v_location := public.alirin_location_score(new.lat, new.lng);
  v_score    := public.alirin_risk_score(v_severity, v_history, v_weather, v_location);

  new.risk_score := v_score;
  new.risk_level := public.alirin_risk_level(v_score);

  -- Hanya dicatat bila hulu benar-benar yang menentukan; kalau hujan lokal
  -- lebih besar, mencantumkan hulu justru menyesatkan.
  if v_rain.up_kecamatan is not null
     and coalesce(v_rain.up_effective, 0) > coalesce(new.rainfall_mm, 0) then
    new.upstream_kecamatan := v_rain.up_kecamatan;
    new.upstream_rainfall_mm := v_rain.up_rainfall;
  else
    new.upstream_kecamatan := null;
    new.upstream_rainfall_mm := null;
  end if;

  -- Arsip mengikuti status, tidak bergantung pada klien mana yang menulis.
  if new.status in ('selesai', 'ditolak') then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  return new;
end $$;

create or replace function public.alirin_rebuild_breakdown(r public.reports)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_severity      integer;
  v_history       integer;
  v_history_count integer;
  v_weather       integer;
  v_location      integer;
  v_total         integer;
  v_photos        integer;
  v_evidence      integer;
  v_near          record;
  v_rain          record;
  v_points        integer[];
  v_weather_detail text;
begin
  select * into v_rain from public.alirin_rain_context(
    r.kecamatan, r.rainfall_mm, coalesce(r.created_at, now())
  );

  v_severity := public.alirin_severity_score(r.severity);
  v_history  := public.alirin_history_score(r.id::text, r.lat, r.lng, coalesce(r.created_at, now()));
  v_weather  := public.alirin_weather_score(v_rain.effective);
  v_location := public.alirin_location_score(r.lat, r.lng);
  v_total    := 35 + 25 + 15 + case when v_weather is null then 0 else 25 end;

  select count(*)::integer into v_history_count
  from public.reports x
  where x.id is distinct from r.id
    and x.status <> 'ditolak'
    and x.created_at <= coalesce(r.created_at, now())
    and x.created_at >= coalesce(r.created_at, now()) - interval '180 days'
    and x.lat between r.lat - 0.0035 and r.lat + 0.0035
    and x.lng between r.lng - 0.0035 and r.lng + 0.0035
    and public.alirin_distance_km(r.lat, r.lng, x.lat, x.lng) <= 0.35;

  select count(*)::integer into v_photos
  from public.report_photos p
  where p.report_id = r.id and coalesce(p.kind, 'report') = 'report';

  v_evidence := round(100.0 * (
      (case when v_photos > 0 then 1 else 0 end)
    + (case when length(coalesce(trim(r.description), '')) >= 10 then 1 else 0 end)
    + 1
  ) / 3.0);

  select f.name, public.alirin_distance_km(r.lat, r.lng, f.lat, f.lng) as d
    into v_near
  from public.public_facilities f
  where f.active
  order by 2 asc
  limit 1;

  -- Rinciannya harus menyebut hulu ketika hulu yang menentukan. Tanpa itu,
  -- pengguna melihat skor cuaca tinggi sementara di tempatnya sedang cerah,
  -- dan angkanya tampak salah padahal justru itu intinya.
  v_weather_detail := case
    when v_weather is null then
      'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain'
    when v_rain.up_kecamatan is not null
         and coalesce(v_rain.up_effective, 0) > coalesce(r.rainfall_mm, 0) then
      public.alirin_rainfall_label(v_rain.up_rainfall) || ' di hulu ' || v_rain.up_kecamatan
        || ' (' || round(v_rain.up_rainfall::numeric, 1)::text || ' mm, relasi '
        || case v_rain.up_kekuatan when 3 then 'kuat' when 2 then 'sedang' else 'lemah' end || ')'
        || ', lokal ' || round(coalesce(r.rainfall_mm, 0)::numeric, 1)::text || ' mm'
    else
      public.alirin_rainfall_label(r.rainfall_mm) || ', '
        || round(coalesce(r.rainfall_mm, 0)::numeric, 1)::text || ' mm dalam 3 jam (BMKG)'
  end;

  v_points := public.alirin_apportion(
    array[
      v_severity * 35.0 / v_total,
      v_history  * 25.0 / v_total,
      case when v_weather is null then 0 else v_weather * 25.0 / v_total end,
      v_location * 15.0 / v_total
    ],
    coalesce(r.risk_score, public.alirin_risk_score(v_severity, v_history, v_weather, v_location))
  );

  delete from public.risk_breakdowns where report_id = r.id;

  insert into public.risk_breakdowns (report_id, factor, label, points, weight, detail) values
    (r.id, 'severity', 'Keparahan laporan',
      v_points[1], round(35.0 * 100 / v_total),
      'Tingkat ' || coalesce(r.severity, 'belum diisi')),
    (r.id, 'history', 'Histori kejadian',
      v_points[2], round(25.0 * 100 / v_total),
      v_history_count::text || ' laporan lain dalam radius 350 m, 180 hari terakhir'),
    (r.id, 'weather', 'Cuaca',
      v_points[3],
      case when v_weather is null then 0 else round(25.0 * 100 / v_total) end,
      v_weather_detail),
    (r.id, 'location', 'Dampak lokasi',
      v_points[4], round(15.0 * 100 / v_total),
      coalesce(v_near.name || ', ' || round(v_near.d::numeric, 1)::text || ' km',
               'Tidak ada fasilitas publik terdekat')),
    (r.id, 'bukti', 'Kelengkapan bukti', 0, 0,
      v_photos::text || ' foto, '
        || case when length(coalesce(trim(r.description), '')) >= 10
             then 'deskripsi lengkap' else 'deskripsi singkat' end
        || ', koordinat ada. Kelengkapan ' || v_evidence::text || '% (belum dibobot)'),
    (r.id, 'sensor', 'Sensor lapangan', 0, 0,
      'Menunggu integrasi IoT (roadmap Tahap 4)');
end $$;

revoke execute on function public.alirin_rebuild_breakdown(public.reports)
  from public, anon, authenticated;

-- Kedua trigger harus ikut menyala saat kecamatan berubah, karena kecamatan
-- yang menentukan relasi hulu mana yang berlaku.
drop trigger if exists reports_apply_risk on public.reports;
create trigger reports_apply_risk
before insert or update of severity, lat, lng, rainfall_mm, created_at, status, kecamatan
on public.reports
for each row execute function public.alirin_apply_risk();

drop trigger if exists reports_write_breakdown on public.reports;
create trigger reports_write_breakdown
after insert or update of severity, lat, lng, rainfall_mm, description, status, kecamatan
on public.reports
for each row execute function public.alirin_write_breakdown();

-- ---------------------------------------------------------------------------
-- 6. View publik memancarkan konteks hulu
-- ---------------------------------------------------------------------------

create or replace view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  round(r.lat::numeric, 3)::double precision as lat,
  round(r.lng::numeric, 3)::double precision as lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.submission_mode,
  r.rainfall_mm,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', p.id, 'url', p.url, 'name', p.name,
                           'type', p.type, 'size', p.size, 'kind', p.kind)
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id and coalesce(p.kind, 'report') = 'report'
    ), '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', coalesce(b.factor, b.id::text), 'label', b.label,
                           'points', b.points, 'weight', b.weight, 'detail', b.detail)
        order by public.alirin_factor_rank(b.factor)
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ), '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ), '[]'::jsonb
  ) as report_status_history,
  -- Kolom baru wajib di akhir: create or replace view tidak boleh menyisipkan
  -- kolom di tengah daftar yang sudah ada.
  r.upstream_kecamatan,
  r.upstream_rainfall_mm
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Hitung ulang laporan yang sudah ada
-- ---------------------------------------------------------------------------
--
-- Cache cuaca masih kosong saat migrasi dijalankan, jadi tidak ada satu pun
-- laporan yang berubah skornya di sini, dan kolom hulu tetap null. Yang
-- dibangun ulang adalah rincian skornya, memakai teks detail Cuaca yang baru.

do $$
declare
  v_report public.reports;
begin
  for v_report in select * from public.reports loop
    perform public.alirin_rebuild_breakdown(v_report);
  end loop;
end $$;

-- ###########################################################################
-- # (12/16) 20260826120000_ai_assessment.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- P-1 · AI sebagai penilai risiko, berdampingan dengan baseline
-- ---------------------------------------------------------------------------
--
-- Proposal 4.3.4 menjanjikan AI membaca pola dari faktor yang sama lalu
-- dibandingkan dengan baseline serta verifikasi lapangan. Kunci pertahanannya
-- ada pada kata "dibandingkan": skor baseline tidak disentuh.
--
-- risk_score tetap satu-satunya angka yang dipakai mengurutkan penanganan, dan
-- tetap ditulis oleh trigger alirin_apply_risk. Kolom ai_* di bawah diisi Edge
-- Function assess-risk, dan hanya untuk disandingkan. Dengan begitu keduanya
-- bisa diaudit -- termasuk saat AI keliru, yang justru bahan evaluasi akurasi
-- yang dijanjikan Proposal 4.4.

alter table public.reports add column if not exists ai_risk_score integer;
alter table public.reports add column if not exists ai_risk_reason text;
alter table public.reports add column if not exists ai_recommendations jsonb not null default '[]'::jsonb;
alter table public.reports add column if not exists ai_model text;
alter table public.reports add column if not exists ai_assessed_at timestamptz;

do $$
begin
  alter table public.reports
    add constraint reports_ai_risk_score_check
    check (ai_risk_score is null or (ai_risk_score between 0 and 100)) not valid;
exception
  when duplicate_object then null;
end $$;

comment on column public.reports.ai_risk_score is
  'Penilaian AI. Pembanding, bukan pengganti risk_score. Jangan dipakai mengurutkan penanganan.';

-- Trigger skor sengaja TIDAK menyertakan kolom ai_* pada daftar UPDATE OF-nya,
-- supaya menulis hasil AI tidak memicu perhitungan ulang baseline dan rincian.
-- Kalau sampai ikut, setiap penilaian AI akan menimpa rincian skor tanpa alasan.

-- ---------------------------------------------------------------------------
-- View publik memancarkan hasil AI
-- ---------------------------------------------------------------------------
--
-- Kolom baru wajib di akhir: create or replace view tidak boleh menyisipkan
-- kolom di tengah daftar yang sudah ada.

create or replace view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  round(r.lat::numeric, 3)::double precision as lat,
  round(r.lng::numeric, 3)::double precision as lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.submission_mode,
  r.rainfall_mm,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', p.id, 'url', p.url, 'name', p.name,
                           'type', p.type, 'size', p.size, 'kind', p.kind)
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id and coalesce(p.kind, 'report') = 'report'
    ), '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', coalesce(b.factor, b.id::text), 'label', b.label,
                           'points', b.points, 'weight', b.weight, 'detail', b.detail)
        order by public.alirin_factor_rank(b.factor)
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ), '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ), '[]'::jsonb
  ) as report_status_history,
  r.upstream_kecamatan,
  r.upstream_rainfall_mm,
  r.ai_risk_score,
  r.ai_risk_reason,
  r.ai_recommendations,
  r.ai_model,
  r.ai_assessed_at
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pelacakan lewat token ikut membawa hasil AI
-- ---------------------------------------------------------------------------
--
-- Fungsi ini memakai to_jsonb(r), jadi kolom baru otomatis ikut. Dibuat ulang
-- hanya supaya urutan faktor tetap dipatok setelah view diganti.

create or replace function public.get_report_by_tracking_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(r)
    || jsonb_build_object(
      'report_photos', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id, 'url', p.url, 'name', p.name,
              'type', p.type, 'size', p.size, 'kind', p.kind
            )
            order by p.created_at
          )
          from public.report_photos p
          where p.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'risk_breakdowns', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', coalesce(b.factor, b.id::text), 'label', b.label,
              'points', b.points, 'weight', b.weight, 'detail', b.detail
            )
            order by public.alirin_factor_rank(b.factor)
          )
          from public.risk_breakdowns b
          where b.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'report_status_history', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
            order by h.at
          )
          from public.report_status_history h
          where h.report_id = r.id
        ),
        '[]'::jsonb
      )
    )
  from public.reports r
  where r.public_tracking_token = p_token
  limit 1;
$$;

revoke all on function public.get_report_by_tracking_token(text) from public;
grant execute on function public.get_report_by_tracking_token(text) to anon, authenticated;

-- ###########################################################################
-- # (13/16) 20260826130000_validate_constraints.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- Mengunci constraint yang masih NOT VALID
-- ---------------------------------------------------------------------------
--
-- Constraint NOT VALID tetap diperiksa pada setiap INSERT dan UPDATE, tetapi
-- baris lama yang melanggarnya dibiarkan. Selama masih NOT VALID, pelanggaran
-- itu hanya tercatat di laporan audit dan tidak di mana pun lagi.
--
-- ALR-2026-0013 dan ALR-2026-0014 adalah dua baris yang menahan
-- reports_area_filled_check. Keduanya berwilayah kosong karena koordinatnya
-- jatuh ke titik cadangan, dan sudah dihapus atas keputusan tim pada
-- 26 Agustus 2026 -- menebak wilayahnya dinilai lebih buruk daripada
-- menghapusnya. Selama masih ada, keduanya menggagalkan setiap UPDATE ke
-- barisnya: penyegaran rincian saat foto masuk, dan penyimpanan penilaian AI.
--
-- Berkas ini memvalidasi SEMUA constraint yang masih NOT VALID, bukan hanya
-- satu, supaya tidak ada yang tertinggal diam-diam. Aman diulang: constraint
-- yang sudah valid tidak muncul di daftar.

do $$
declare
  r record;
  v_valid integer := 0;
  v_gagal integer := 0;
begin
  for r in
    select rel.relname as tabel, con.conname as nama
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and not con.convalidated
    order by rel.relname, con.conname
  loop
    begin
      execute format('alter table public.%I validate constraint %I', r.tabel, r.nama);
      v_valid := v_valid + 1;
      raise notice 'VALID  %.%', r.tabel, r.nama;
    exception when others then
      -- Satu constraint yang masih dilanggar tidak boleh menggagalkan yang lain.
      -- Alasannya dicetak supaya barisnya bisa dicari, bukan ditebak.
      v_gagal := v_gagal + 1;
      raise notice 'GAGAL  %.% -- %', r.tabel, r.nama, sqlerrm;
    end;
  end loop;

  raise notice '% constraint divalidasi, % masih dilanggar.', v_valid, v_gagal;
end $$;

-- ###########################################################################
-- # (14/16) 20260826140000_anon_identity.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- P-8 · Identitas warga per perangkat + penutup celah eskalasi peran
-- ---------------------------------------------------------------------------
--
-- Bagian 1 di bawah adalah SYARAT KEAMANAN sebelum anonymous sign-in dinyalakan,
-- bukan sekadar pelengkap.
--
-- alirin_user_role() lama membaca user_metadata sebagai sumber peran. Tetapi
-- user_metadata bisa ditulis pemiliknya sendiri lewat auth.updateUser(). Selama
-- anonymous sign-in mati, celah itu terlindungi konfirmasi email pada signup.
-- Begitu anonymous sign-in menyala, siapa pun bisa:
--
--     signInAnonymously()  ->  updateUser({ data: { role: 'admin' } })
--
-- dan langsung lolos alirin_is_staff(), lalu membaca seluruh tabel reports
-- mentah -- termasuk reporter_contact dan public_tracking_token yang dijaga
-- justru untuk pelapor.
--
-- Perbaikannya: peran hanya boleh dibaca dari app_metadata, yang tidak bisa
-- ditulis pengguna (hanya service role / admin). user_metadata tidak lagi
-- dipercaya untuk keputusan otorisasi apa pun.

create or replace function public.alirin_user_role()
returns text
language sql
stable
as $$
  -- HANYA app_metadata. user_metadata sengaja tidak dibaca: pengguna bisa
  -- menulisnya sendiri, jadi tidak boleh menentukan peran.
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'app_role', '')
  )
$$;

-- Anonim tidak akan pernah punya app_metadata.role, jadi alirin_is_staff()
-- otomatis false untuknya. Tetap ditegaskan supaya niatnya terbaca jelas.
create or replace function public.alirin_is_staff()
returns boolean
language sql
stable
as $$
  select coalesce(public.alirin_user_role() in ('admin', 'petugas'), false)
$$;

-- ---------------------------------------------------------------------------
-- 2. Kepemilikan laporan per perangkat
-- ---------------------------------------------------------------------------
--
-- Setiap perangkat memperoleh satu identitas anonim yang stabil, dan laporan
-- yang dikirimnya menyimpan auth.uid() di kolom reporter_id. Dari sini tiga hal
-- menjadi mungkin (rekomendasi P-8 laporan audit):
--   - layar Status menampilkan laporan milik pengguna sendiri, tanpa token,
--   - rate limiting per perangkat,
--   - verifikasi gotong-royong yang benar: tiga reporter_id BERBEDA.

alter table public.reports add column if not exists reporter_id uuid;

-- Diisi otomatis saat laporan dibuat, dari identitas pemanggil. Klien tidak
-- perlu -- dan tidak boleh -- menentukannya sendiri: trigger BEFORE INSERT
-- menimpanya dengan auth.uid() yang sebenarnya, jadi satu perangkat tidak bisa
-- mengaku sebagai perangkat lain.
create or replace function public.alirin_stamp_reporter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Staff yang membuat laporan atas nama warga tidak dicap sebagai pemilik.
  if public.alirin_is_staff() then
    new.reporter_id := null;
  else
    new.reporter_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists reports_stamp_reporter on public.reports;
create trigger reports_stamp_reporter
before insert on public.reports
for each row execute function public.alirin_stamp_reporter();

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id) where reporter_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Pelapor boleh membaca laporannya sendiri -- lewat view yang tetap privat
-- ---------------------------------------------------------------------------
--
-- Yang boleh dilihat pemilik BUKAN baris mentah (yang membawa reporter_contact
-- milik orang lain lewat query lain), melainkan barisnya sendiri saja. RPC di
-- bawah mengembalikan laporan milik auth.uid() dalam bentuk yang sama dengan
-- public_reports, plus token pelacakannya sendiri.

create or replace function public.get_my_reports()
returns setof public.public_reports
language sql
stable
security definer
set search_path = public
as $$
  select pr.*
  from public.public_reports pr
  join public.reports r on r.id = pr.id
  where r.reporter_id is not null
    and r.reporter_id = auth.uid()
  order by pr.created_at desc
$$;

revoke all on function public.get_my_reports() from public;
grant execute on function public.get_my_reports() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Ambang anti-penyalahgunaan: rate limit per perangkat
-- ---------------------------------------------------------------------------
--
-- Satu perangkat dibatasi jumlah laporan dalam jendela pendek. Ditegakkan di
-- policy INSERT, bukan hanya di klien, supaya tidak bisa dilewati. Staff
-- dikecualikan. Laporan tanpa reporter_id (mis. dari alur lama) tidak dibatasi
-- di sini agar tidak memutus jalur yang sudah ada.

create or replace function public.alirin_reporter_under_limit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select count(*) < 8
      from public.reports r
      where r.reporter_id = auth.uid()
        and r.created_at >= now() - interval '1 hour'
    ),
    true
  )
$$;

drop policy if exists "reports_public_insert" on public.reports;
create policy "reports_public_insert"
on public.reports
for insert
to anon, authenticated
with check (
  public.alirin_is_staff()
  or (status = 'masuk' and public.alirin_reporter_under_limit())
);

-- ---------------------------------------------------------------------------
-- 5. Verifikasi gotong-royong: tiga reporter_id BERBEDA
-- ---------------------------------------------------------------------------
--
-- Spesifikasi menuntut tiga pelapor berbeda dalam radius 100 m per 24 jam.
-- Sampai reporter_id ada, "berbeda" tidak bisa dibuktikan dan aplikasi hanya
-- bisa menghitung laporan. Fungsi ini menghitung pemilik unik, dan dipakai
-- klien untuk menggantikan hitungan laporan yang lama.

create or replace function public.alirin_community_signal(
  p_report_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_at  timestamptz
)
returns table (report_count integer, unique_reporters integer, meets_threshold boolean)
language sql
stable
security definer
set search_path = public
as $$
  -- Termasuk laporan ini sendiri bila sudah tersimpan. Tidak ada +1 buatan:
  -- pelapor yang mengirim dua laporan di area yang sama tetap terhitung satu
  -- orang, dan itulah inti "tiga pelapor BERBEDA".
  with dekat as (
    select r.reporter_id
    from public.reports r
    where r.status <> 'ditolak'
      and r.created_at between p_at - interval '24 hours' and p_at
      and r.lat between p_lat - 0.0015 and p_lat + 0.0015
      and r.lng between p_lng - 0.0015 and p_lng + 0.0015
      and public.alirin_distance_km(p_lat, p_lng, r.lat, r.lng) <= 0.1
  )
  select
    count(*)::integer,
    count(distinct reporter_id)::integer,
    count(distinct reporter_id) >= 3
  from dekat;
$$;

revoke all on function public.alirin_community_signal(uuid, double precision, double precision, timestamptz) from public;
grant execute on function public.alirin_community_signal(uuid, double precision, double precision, timestamptz) to anon, authenticated;

-- ###########################################################################
-- # (15/16) 20260826150000_alerts.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- P-6 · Alert saat risiko melewati ambang
-- ---------------------------------------------------------------------------
--
-- Proposal mendefinisikan alert sebagai "pemberitahuan saat skor melewati
-- ambang" dan menempatkan warga sebagai "penerima informasi status dan alert".
-- Sampai sekarang mekanismenya belum ada.
--
-- Dua sumber alert:
--   1. Skor laporan melewati 80 (kelas Kritis). Dibuat trigger saat laporan
--      masuk atau skornya naik melewati ambang.
--   2. Hujan deras di wilayah hulu. Karena P-3, hujan di Kemiling kini bisa
--      memperingatkan Rajabasa -- jenis alert yang tidak bisa diberikan
--      aplikasi pengaduan biasa. Dibuat saat cache cuaca kecamatan diperbarui.
--
-- Alert bersifat publik-baca (warga adalah penerimanya) tetapi tidak membawa
-- data pribadi: hanya kecamatan, kelurahan, dan pesan.

create table if not exists public.alerts (
  id          uuid primary key default gen_random_uuid(),
  jenis       text not null,
  kecamatan   text,
  kelurahan   text,
  report_id   uuid references public.reports(id) on delete cascade,
  pesan       text not null,
  skor        integer,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint alerts_jenis_check check (jenis in ('skor', 'hulu'))
);

create index if not exists alerts_active_idx on public.alerts (active, created_at desc);

-- Satu laporan tidak boleh menumpuk banyak alert skor. Satu titik hulu-hilir
-- tidak boleh menumpuk banyak alert hujan dalam waktu dekat. Indeks unik parsial
-- menjaga keduanya idempoten.
create unique index if not exists alerts_skor_unik
  on public.alerts (report_id) where jenis = 'skor';

alter table public.alerts enable row level security;

drop policy if exists "alerts_public_read" on public.alerts;
create policy "alerts_public_read"
on public.alerts for select to anon, authenticated using (active);

drop policy if exists "alerts_staff_write" on public.alerts;
create policy "alerts_staff_write"
on public.alerts for update to authenticated
using (public.alirin_is_staff()) with check (public.alirin_is_staff());

drop policy if exists "alerts_staff_delete" on public.alerts;
create policy "alerts_staff_delete"
on public.alerts for delete to authenticated using (public.alirin_is_staff());

-- ---------------------------------------------------------------------------
-- 1. Alert saat skor laporan melewati ambang
-- ---------------------------------------------------------------------------

create or replace function public.alirin_alert_threshold()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ambang constant integer := 80;
  v_naik boolean;
begin
  -- Hanya saat MELEWATI ambang, bukan setiap update di atasnya. Pada INSERT,
  -- OLD tidak ter-assign, jadi diperlakukan seolah skor lama nol.
  v_naik := new.risk_score >= v_ambang
    and (tg_op = 'INSERT' or coalesce(old.risk_score, 0) < v_ambang);

  if v_naik and new.status not in ('selesai', 'ditolak') then
    insert into public.alerts (jenis, kecamatan, kelurahan, report_id, pesan, skor)
    values (
      'skor', new.kecamatan, new.kelurahan, new.id,
      'Laporan ' || new.code || ' di ' || coalesce(new.kelurahan, 'wilayah tak dikenal')
        || ' mencapai skor risiko ' || new.risk_score || ' (Kritis).',
      new.risk_score
    )
    on conflict (report_id) where jenis = 'skor'
    do update set skor = excluded.skor, pesan = excluded.pesan, active = true, created_at = now();
  end if;

  -- Skor turun di bawah ambang, atau laporan selesai: alertnya diistirahatkan.
  if new.status in ('selesai', 'ditolak') or new.risk_score < v_ambang then
    update public.alerts set active = false
    where report_id = new.id and jenis = 'skor' and active;
  end if;

  return null;
end $$;

-- AFTER, supaya risk_score sudah final saat dibaca (alirin_apply_risk berjalan
-- BEFORE dan menetapkannya).
drop trigger if exists reports_alert_threshold on public.reports;
create trigger reports_alert_threshold
after insert or update of risk_score, status on public.reports
for each row execute function public.alirin_alert_threshold();

-- ---------------------------------------------------------------------------
-- 2. Alert hujan deras di hulu
-- ---------------------------------------------------------------------------
--
-- Saat cache cuaca kecamatan menunjukkan hujan lebat (>= 10 mm, kelas "Hujan
-- lebat"), setiap kecamatan HILIR-nya diberi peringatan. Inilah alert yang
-- dijanjikan P-3: memperingatkan wilayah bawah sebelum kirimannya tiba.

create or replace function public.alirin_alert_upstream()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ambang constant double precision := 10.0;
  r record;
begin
  if new.rainfall_mm < v_ambang then
    -- Hujan mereda: istirahatkan alert hulu dari kecamatan ini.
    update public.alerts set active = false
    where jenis = 'hulu' and active
      and kecamatan in (
        select f.kecamatan_hilir from public.area_flow_relations f
        where public.alirin_area_key(f.kecamatan_hulu) = public.alirin_area_key(new.kecamatan)
      );
    return null;
  end if;

  for r in
    select f.kecamatan_hilir, f.kekuatan
    from public.area_flow_relations f
    where f.active
      and public.alirin_area_key(f.kecamatan_hulu) = public.alirin_area_key(new.kecamatan)
  loop
    -- Idempoten per pasangan hulu-hilir per 3 jam: alert lama yang masih segar
    -- diperbarui, bukan digandakan.
    update public.alerts
    set skor = round(new.rainfall_mm)::integer, created_at = now(), active = true
    where jenis = 'hulu' and kecamatan = r.kecamatan_hilir
      and kelurahan = new.kecamatan
      and created_at >= now() - interval '3 hours';

    if not found then
      insert into public.alerts (jenis, kecamatan, kelurahan, pesan, skor)
      values (
        'hulu', r.kecamatan_hilir, new.kecamatan,
        public.alirin_rainfall_label(new.rainfall_mm) || ' terdeteksi di hulu '
          || new.kecamatan || ' (' || round(new.rainfall_mm::numeric, 1)::text
          || ' mm). Wilayah ' || r.kecamatan_hilir || ' berpotensi menerima kiriman air.',
        round(new.rainfall_mm)::integer
      );
    end if;
  end loop;

  return null;
end $$;

-- kelurahan pada tabel alert dipakai menyimpan kecamatan hulu asal, supaya
-- idempotensi per pasangan bisa dijaga tanpa kolom tambahan.
drop trigger if exists area_weather_alert_upstream on public.area_weather;
create trigger area_weather_alert_upstream
after insert or update of rainfall_mm on public.area_weather
for each row execute function public.alirin_alert_upstream();

-- ---------------------------------------------------------------------------
-- 3. Backfill alert skor untuk laporan yang sudah kritis
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select * from public.reports
    where risk_score >= 80 and status not in ('selesai', 'ditolak')
  loop
    insert into public.alerts (jenis, kecamatan, kelurahan, report_id, pesan, skor)
    values (
      'skor', r.kecamatan, r.kelurahan, r.id,
      'Laporan ' || r.code || ' di ' || coalesce(r.kelurahan, 'wilayah tak dikenal')
        || ' mencapai skor risiko ' || r.risk_score || ' (Kritis).',
      r.risk_score
    )
    on conflict (report_id) where jenis = 'skor' do nothing;
  end loop;
end $$;

-- ###########################################################################
-- # (16/16) 20260826160000_recurring_points.sql
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- P-4 · Titik berulang sebagai dasar rencana preventif
-- ---------------------------------------------------------------------------
--
-- Faktor "history" pada risk score mengukur kerumunan sesaat: berapa laporan
-- lain yang berdekatan pada saat sebuah laporan dinilai. Yang dibutuhkan
-- Proposal (§4.3.4, §7.2.4) berbeda: pengulangan LINTAS WAKTU -- berapa kali
-- satu titik bermasalah dalam setahun, dan seberapa sering ia berulang setelah
-- ditutup.
--
-- Fungsi di bawah mengelompokkan laporan dalam radius ~100 m dan menghitung
-- frekuensi, rentang tanggal, jeda rata-rata antar kejadian, serta apakah titik
-- itu pernah kembali bermasalah SETELAH sebuah laporan di sana selesai. Titik
-- yang berulang setelah ditangani adalah kandidat terkuat untuk pemeliharaan
-- terencana -- respons reaktif jelas belum menyelesaikannya.
--
-- Pengelompokannya sederhana dan deterministik: setiap laporan menjadi jangkar,
-- lalu menyerap laporan lain dalam radiusnya. Sebuah laporan hanya boleh menjadi
-- anggota satu klaster (klaster jangkar dengan laporan paling awal menang),
-- sehingga tidak ada penghitungan ganda. Ini bukan clustering hidrologis;
-- cukup untuk daftar preventif tingkat kota.

create or replace function public.alirin_recurring_points(
  p_window_days integer default 365,
  p_min_events  integer default 2,
  p_radius_km   double precision default 0.1
)
returns table (
  cluster_id       uuid,
  lat              double precision,
  lng              double precision,
  kecamatan        text,
  kelurahan        text,
  event_count      integer,
  first_at         timestamptz,
  last_at          timestamptz,
  avg_gap_days     double precision,
  recurred_after_done boolean,
  last_status      text,
  sample_code      text
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      r.id, r.lat, r.lng, r.kecamatan, r.kelurahan, r.code,
      r.status, r.created_at,
      row_number() over (order by r.created_at, r.id) as seq
    from public.reports r
    where r.status <> 'ditolak'
      and r.created_at >= now() - make_interval(days => p_window_days)
      -- Koordinat presisi hanya untuk staf. Peran authenticated juga mencakup
      -- warga anonim, jadi GRANT saja tidak cukup: penjagaan ada di dalam.
      and public.alirin_is_staff()
  ),
  -- Jangkar = laporan yang TIDAK berada dalam radius laporan lain yang lebih
  -- awal. Setiap laporan lalu menempel ke jangkar terdekat yang lebih awal
  -- (termasuk dirinya bila ia jangkar).
  anchors as (
    select b.*
    from base b
    where not exists (
      select 1 from base e
      where e.seq < b.seq
        and public.alirin_distance_km(b.lat, b.lng, e.lat, e.lng) <= p_radius_km
    )
  ),
  membership as (
    select
      b.id, b.status, b.created_at, b.code, b.lat, b.lng, b.kecamatan, b.kelurahan,
      (
        select a.id
        from anchors a
        where a.seq <= b.seq
          and public.alirin_distance_km(b.lat, b.lng, a.lat, a.lng) <= p_radius_km
        order by a.seq desc
        limit 1
      ) as anchor_id
    from base b
  ),
  grouped as (
    select
      m.anchor_id,
      count(*)::integer as event_count,
      min(m.created_at) as first_at,
      max(m.created_at) as last_at,
      -- Berulang setelah ditangani: ada laporan yang MASUK setelah sebuah
      -- laporan di titik yang sama SELESAI.
      bool_or(
        exists (
          select 1 from membership d
          where d.anchor_id = m.anchor_id
            and d.status = 'selesai'
            and d.created_at < m.created_at
        )
      ) as recurred_after_done
    from membership m
    group by m.anchor_id
  )
  select
    a.id as cluster_id,
    a.lat, a.lng, a.kecamatan, a.kelurahan,
    g.event_count,
    g.first_at,
    g.last_at,
    case when g.event_count > 1
      then round((extract(epoch from (g.last_at - g.first_at)) / 86400.0 / (g.event_count - 1))::numeric, 1)::double precision
      else null end as avg_gap_days,
    g.recurred_after_done,
    (select m.status from membership m where m.anchor_id = a.id order by m.created_at desc limit 1) as last_status,
    a.code as sample_code
  from grouped g
  join anchors a on a.id = g.anchor_id
  where g.event_count >= p_min_events
  order by g.recurred_after_done desc, g.event_count desc, g.last_at desc;
$$;

revoke all on function public.alirin_recurring_points(integer, integer, double precision) from public;
grant execute on function public.alirin_recurring_points(integer, integer, double precision) to authenticated;
