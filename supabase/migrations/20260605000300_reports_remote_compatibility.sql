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
