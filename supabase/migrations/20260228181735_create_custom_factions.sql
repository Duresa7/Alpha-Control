create table if not exists public.custom_factions (
  id          text primary key,
  label       text not null,
  marker_color text not null,
  bar_color   text not null,
  sort_order  integer not null default 0,
  is_builtin  boolean not null default false,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.custom_factions enable row level security;

create policy "custom_factions_select" on public.custom_factions
  for select to authenticated using (true);

create policy "custom_factions_insert" on public.custom_factions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_factions_update" on public.custom_factions
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_factions_delete" on public.custom_factions
  for delete to authenticated
  using (
    not is_builtin
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

drop trigger if exists custom_factions_updated_at on public.custom_factions;
create trigger custom_factions_updated_at
  before update on public.custom_factions
  for each row execute function public.update_updated_at();

-- Seed built-in factions
insert into public.custom_factions (id, label, marker_color, bar_color, sort_order, is_builtin)
values
  ('galactic_republic', 'Galactic Republic', '#FFD700', '#C8AA6E', 0, true),
  ('sith_empire',       'Sith Empire',       '#DC143C', '#DC143C', 1, true),
  ('hutt_cartel',       'Hutt Cartel',       '#8B9A46', '#8B9A46', 2, true),
  ('neutral',           'Neutral',           '#808080', '#808080', 3, true),
  ('contested',         'Contested',         '#FF8C00', '#FF8C00', 4, true)
on conflict (id) do nothing;
