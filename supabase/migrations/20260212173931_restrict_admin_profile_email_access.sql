drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select_bossman" on public.profiles;

create policy "profiles_select_bossman" on public.profiles
  for select to authenticated
  using (public.current_user_role() = 'bossman');

create or replace function public.fetch_audit_logs_with_display_names(
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id bigint,
  user_id uuid,
  action text,
  entity_type text,
  entity_id text,
  entity_name text,
  details jsonb,
  created_at timestamptz,
  display_name text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    logs.id,
    logs.user_id,
    logs.action,
    logs.entity_type,
    logs.entity_id,
    logs.entity_name,
    logs.details,
    logs.created_at,
    profiles.display_name,
    count(*) over() as total_count
  from public.audit_logs logs
  left join public.profiles profiles on profiles.id = logs.user_id
  where public.current_user_role() in ('admin', 'bossman')
  order by logs.created_at desc
  limit greatest(coalesce(p_limit, 50), 0)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke all on function public.fetch_audit_logs_with_display_names(integer, integer) from public;
grant execute on function public.fetch_audit_logs_with_display_names(integer, integer) to authenticated;
