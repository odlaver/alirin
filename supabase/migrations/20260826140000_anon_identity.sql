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
