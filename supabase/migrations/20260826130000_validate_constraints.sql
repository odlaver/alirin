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
