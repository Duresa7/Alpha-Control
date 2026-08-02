create or replace function public.set_user_role(
  p_user_id uuid,
  p_role    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id      uuid := auth.uid();
  v_actor_role    text;
  v_old_role      text;
  v_display_name  text;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select role
  into v_actor_role
  from public.profiles
  where id = v_actor_id;

  if v_actor_role not in ('admin', 'bossman') then
    raise exception 'Only admins can change roles';
  end if;

  if p_user_id is null then
    raise exception 'Target user is required';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'You cannot change your own role';
  end if;

  select role, display_name
  into v_old_role, v_display_name
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if v_actor_role = 'admin' then
    if p_role not in ('user', 'galaxy_user') then
      raise exception 'Admins can only assign user or galaxy_user roles';
    end if;

    if v_old_role not in ('user', 'galaxy_user') then
      raise exception 'Admins can only manage user or galaxy_user accounts';
    end if;
  elsif p_role not in ('user', 'galaxy_user', 'admin', 'bossman') then
    raise exception 'Invalid role';
  end if;

  if v_old_role = p_role then
    update public.profiles
    set galaxy_map_requested = case when p_role <> 'user' then false else galaxy_map_requested end,
        updated_at = now()
    where id = p_user_id;
    return;
  end if;

  perform set_config('app.allow_profile_role_update', 'true', true);

  update public.profiles
  set role = p_role,
      galaxy_map_requested = case when p_role <> 'user' then false else galaxy_map_requested end,
      updated_at = now()
  where id = p_user_id;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    details
  )
  values (
    v_actor_id,
    'role_changed',
    'user',
    p_user_id::text,
    coalesce(v_display_name, ''),
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_role
    )
  );
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;

create or replace function public.fetch_user_management_profiles()
returns table (
  id                   uuid,
  display_name         text,
  email                text,
  role                 text,
  galaxy_map_requested boolean,
  created_at           timestamptz,
  updated_at           timestamptz,
  can_manage           boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id   uuid := auth.uid();
  v_actor_role text;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select profiles.role
  into v_actor_role
  from public.profiles
  where profiles.id = v_actor_id;

  if v_actor_role not in ('admin', 'bossman') then
    raise exception 'Only admins can view user management';
  end if;

  return query
  select
    profiles.id,
    profiles.display_name,
    case
      when v_actor_role = 'bossman' then nullif(profiles.email, '')
      else null
    end as email,
    profiles.role,
    profiles.galaxy_map_requested,
    profiles.created_at,
    profiles.updated_at,
    case
      when profiles.id = v_actor_id then false
      when v_actor_role = 'bossman' then true
      else profiles.role in ('user', 'galaxy_user')
    end as can_manage
  from public.profiles
  where v_actor_role = 'bossman'
     or (profiles.role in ('user', 'galaxy_user') and profiles.id <> v_actor_id)
  order by profiles.created_at asc, profiles.display_name asc, profiles.id asc;
end;
$$;

revoke all on function public.fetch_user_management_profiles() from public;
grant execute on function public.fetch_user_management_profiles() to authenticated;
