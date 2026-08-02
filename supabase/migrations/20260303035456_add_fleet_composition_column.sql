alter table public.custom_fleets
  add column if not exists composition jsonb not null default '[]'::jsonb;
