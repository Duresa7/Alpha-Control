alter table public.custom_fleets
  add column if not exists model_type text;

update public.custom_fleets
set model_type = case
  when faction = 'sith_empire' then 'sith'
  else 'republic'
end
where model_type is null;

alter table public.custom_fleets
  alter column model_type set default 'republic',
  alter column model_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custom_fleets_model_type_check'
  ) then
    alter table public.custom_fleets
      add constraint custom_fleets_model_type_check
      check (model_type in ('sith', 'republic', 'venator'));
  end if;
end
$$;
