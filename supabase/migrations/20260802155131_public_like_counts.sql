-- Visitors read articles without signing in, so like counts have to be visible
-- without signing in too. Opening up article_likes directly would expose which
-- user liked which article to the public internet, so counts are served by a
-- function that returns tallies only and never the underlying user ids.
create or replace function public.fetch_article_like_counts(p_article_ids uuid[])
returns table (article_id uuid, likes_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.article_id, count(*)::bigint
  from public.article_likes l
  where l.article_id = any (coalesce(p_article_ids, '{}'::uuid[]))
  group by l.article_id
$$;

revoke all on function public.fetch_article_like_counts(uuid[]) from public;
grant execute on function public.fetch_article_like_counts(uuid[]) to anon, authenticated;

-- With counts served by the function above, nothing needs to read another
-- user's like rows. Narrow the policy from "any signed-in user can read every
-- like" to "you can read your own likes", which is all the client requires to
-- render the filled-in heart.
--
-- Liking still requires an account: likes_insert_own and likes_delete_own both
-- check auth.uid() = user_id, which is null for anonymous visitors.
drop policy if exists "likes_select_authenticated" on public.article_likes;

create policy "likes_select_own" on public.article_likes
  for select to authenticated
  using ((select auth.uid()) = user_id);
