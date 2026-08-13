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
