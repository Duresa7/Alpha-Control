-- galaxy_user accounts could not read app_settings at all, so loadSetting
-- ('current_year') returned null for them and the map silently fell back to the
-- hardcoded default year. That is 30 of 40 accounts seeing a stale timeline the
-- moment an admin changes the year.
--
-- app_settings is a generic key-value table, so read access is granted for the
-- current_year key only rather than the whole table. Any setting added later
-- stays restricted to admin and bossman by default.
drop policy if exists "app_settings_select" on public.app_settings;

create policy "app_settings_select" on public.app_settings
  for select to authenticated
  using (
    (select app_private.current_user_role()) in ('admin', 'bossman')
    or (
      (select app_private.current_user_role()) = 'galaxy_user'
      and key = 'current_year'
    )
  );
