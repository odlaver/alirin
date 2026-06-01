create extension if not exists pgcrypto;

create table if not exists public.officers (
  id text primary key,
  name text not null,
  area text not null default '',
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'petugas')),
  display_name text not null,
  officer_id text references public.officers(id),
  area text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category text not null,
  severity text not null,
  description text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  kecamatan text not null,
  kelurahan text not null,
  address text not null default '',
  status text not null default 'masuk' check (
    status in ('masuk', 'diverifikasi', 'ditolak', 'dijadwalkan', 'ditangani', 'selesai')
  ),
  risk_level text not null default 'Normal',
  risk_score integer not null default 0,
  reporter_name text not null default 'Anonim',
  reporter_contact text not null default '-',
  assigned_officer_id text references public.officers(id),
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
  report_id uuid not null references public.reports(id) on delete cascade,
  url text not null,
  name text not null default 'foto.jpg',
  type text not null default 'image/jpeg',
  size integer not null default 0,
  kind text not null default 'report' check (kind in ('report', 'completion')),
  created_at timestamptz not null default now()
);

create table if not exists public.risk_breakdowns (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  label text not null,
  points integer not null default 0,
  weight integer not null default 0,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status text not null,
  actor text not null default 'Sistem',
  note text not null default '',
  at timestamptz not null default now()
);

create index if not exists reports_code_idx on public.reports (code);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_assigned_officer_idx on public.reports (assigned_officer_id);
create index if not exists report_photos_report_id_idx on public.report_photos (report_id);
create index if not exists risk_breakdowns_report_id_idx on public.risk_breakdowns (report_id);
create index if not exists report_status_history_report_id_idx on public.report_status_history (report_id, at);

insert into public.officers (id, name, area, phone) values
  ('ofc-budi', 'Budi Santoso', 'Kedaton & Rajabasa', '0812-7700-120'),
  ('ofc-rina', 'Rina Wati', 'Kemiling & Langkapura', '0812-7700-221'),
  ('ofc-deni', 'Deni Pratama', 'Panjang & Teluk Betung', '0812-7700-330')
on conflict (id) do update set
  name = excluded.name,
  area = excluded.area,
  phone = excluded.phone,
  updated_at = now();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists officers_touch_updated_at on public.officers;
create trigger officers_touch_updated_at
before update on public.officers
for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_officer_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select officer_id from public.profiles where id = auth.uid()
$$;

create or replace function public.can_access_report(report_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reports report
    where report.id = report_uuid
      and (
        public.current_profile_role() = 'admin'
        or report.assigned_officer_id = public.current_officer_id()
      )
  )
$$;

create or replace function public.report_exists(report_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.reports where id = report_uuid)
$$;

alter table public.officers enable row level security;
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_photos enable row level security;
alter table public.risk_breakdowns enable row level security;
alter table public.report_status_history enable row level security;

drop policy if exists "officers select by authenticated" on public.officers;
create policy "officers select by authenticated"
on public.officers for select
to authenticated
using (true);

drop policy if exists "profiles select self or admin" on public.profiles;
create policy "profiles select self or admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_profile_role() = 'admin');

drop policy if exists "profiles update admin" on public.profiles;
create policy "profiles update admin"
on public.profiles for update
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

drop policy if exists "reports insert public" on public.reports;
create policy "reports insert public"
on public.reports for insert
to anon, authenticated
with check (true);

drop policy if exists "reports select staff" on public.reports;
create policy "reports select staff"
on public.reports for select
to authenticated
using (
  public.current_profile_role() = 'admin'
  or assigned_officer_id = public.current_officer_id()
);

drop policy if exists "reports update admin" on public.reports;
create policy "reports update admin"
on public.reports for update
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

drop policy if exists "reports update assigned officer" on public.reports;
create policy "reports update assigned officer"
on public.reports for update
to authenticated
using (assigned_officer_id = public.current_officer_id())
with check (assigned_officer_id = public.current_officer_id());

drop policy if exists "report photos insert public" on public.report_photos;
create policy "report photos insert public"
on public.report_photos for insert
to anon, authenticated
with check (public.report_exists(report_id));

drop policy if exists "report photos select staff" on public.report_photos;
create policy "report photos select staff"
on public.report_photos for select
to authenticated
using (public.can_access_report(report_id));

drop policy if exists "risk breakdown insert public" on public.risk_breakdowns;
create policy "risk breakdown insert public"
on public.risk_breakdowns for insert
to anon, authenticated
with check (public.report_exists(report_id));

drop policy if exists "risk breakdown select staff" on public.risk_breakdowns;
create policy "risk breakdown select staff"
on public.risk_breakdowns for select
to authenticated
using (public.can_access_report(report_id));

drop policy if exists "status history insert public" on public.report_status_history;
create policy "status history insert public"
on public.report_status_history for insert
to anon, authenticated
with check (public.report_exists(report_id));

drop policy if exists "status history select staff" on public.report_status_history;
create policy "status history select staff"
on public.report_status_history for select
to authenticated
using (public.can_access_report(report_id));

insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;

drop policy if exists "reports bucket public read" on storage.objects;
create policy "reports bucket public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'reports');

drop policy if exists "reports bucket upload" on storage.objects;
create policy "reports bucket upload"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'reports');
