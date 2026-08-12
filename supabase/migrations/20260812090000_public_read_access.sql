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
