-- The map subscribes to postgres_changes on these tables, but none of them were
-- ever added to the supabase_realtime publication, so no events were delivered
-- and the shared-map sync silently did nothing.
--
-- Publication membership only controls which row changes are replicated to
-- subscribers. It does not read, modify, or delete any existing rows.
--
-- Replica identity is deliberately left at the default (primary key): INSERT and
-- UPDATE still carry the full new row, DELETE carries the id, and the WAL stays
-- small. REPLICA IDENTITY FULL is not needed here.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'custom_systems',
    'custom_fleets',
    'custom_factions',
    'app_settings'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end
$$;
