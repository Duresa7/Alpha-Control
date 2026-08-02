create or replace function public.prepare_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_email        text;
begin
  new.user_id := auth.uid();

  if new.user_id is null then
    raise exception 'Invalid feedback user';
  end if;

  new.message := btrim(new.message);
  if new.message = '' then
    raise exception 'Feedback message is required';
  end if;

  if char_length(new.message) > 2000 then
    raise exception 'Feedback message is too long';
  end if;

  if new.category = 'other' then
    new.other_label := nullif(btrim(coalesce(new.other_label, '')), '');
    if new.other_label is null then
      raise exception 'Other feedback requires a label';
    end if;
  else
    new.other_label := null;
  end if;

  select display_name, email
  into v_display_name, v_email
  from public.profiles
  where id = new.user_id;

  new.display_name := coalesce(
    nullif(v_display_name, ''),
    nullif(split_part(coalesce(v_email, ''), '@', 1), ''),
    'Anonymous'
  );

  return new;
end;
$$;

drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_authenticated" on public.feedback
  for insert to authenticated
  with check (auth.uid() is not null);
