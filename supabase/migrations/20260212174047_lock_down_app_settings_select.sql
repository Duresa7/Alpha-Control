drop policy if exists "app_settings_select" on public.app_settings;

create policy "app_settings_select" on public.app_settings
  for select to authenticated
  using (public.current_user_role() in ('admin', 'bossman'));
