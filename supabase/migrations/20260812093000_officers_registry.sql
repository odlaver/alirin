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
