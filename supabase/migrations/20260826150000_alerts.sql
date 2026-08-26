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
