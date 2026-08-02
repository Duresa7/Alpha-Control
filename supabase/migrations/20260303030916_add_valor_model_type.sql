do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'custom_fleets_model_type_check'
  ) then
    alter table public.custom_fleets
      drop constraint custom_fleets_model_type_check;
  end if;
  alter table public.custom_fleets
    add constraint custom_fleets_model_type_check
    check (model_type in ('sith', 'republic', 'venator', 'valor'));
end
$$;
