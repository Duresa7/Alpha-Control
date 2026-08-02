-- Bylines on articles and comments need author display names, but the
-- profiles RLS policy intentionally restricts reads to the caller's own row,
-- so every byline but your own resolved to "Anonymous".
--
-- This exposes display_name only for accounts that have authored an article or
-- a comment -- names that already appear publicly alongside that content. It
-- never exposes email, role, or any other profile column, and the RLS policy
-- on profiles is left unchanged.
create or replace function public.fetch_profile_names(p_ids uuid[])
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name
  from public.profiles p
  where p.id = any (coalesce(p_ids, '{}'::uuid[]))
    and (
      exists (select 1 from public.articles a where a.author_id = p.id)
      or exists (select 1 from public.article_comments c where c.user_id = p.id)
    )
$$;

revoke all on function public.fetch_profile_names(uuid[]) from public;
grant execute on function public.fetch_profile_names(uuid[]) to anon, authenticated;
