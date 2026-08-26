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
