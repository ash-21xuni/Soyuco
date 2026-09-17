-- Run this once in the Supabase SQL editor to enable self-service account
-- deletion from the app's Settings page. It defines a function that runs
-- with the privileges of its owner (postgres), which is the only way a
-- logged-in user can remove their own row from the protected auth.users
-- table without a service-role key.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.entries where user_id = uid;
  delete from public.todos where user_id = uid;
  delete from public.habits where user_id = uid;
  delete from public.events where user_id = uid;
  delete from public.mood_history where user_id = uid;
  delete from public.transactions where user_id = uid;
  delete from public.goals where user_id = uid;
  delete from public.budget_limits where user_id = uid;
  delete from public.ai_messages where user_id = uid;
  delete from public.collections where user_id = uid;
  delete from public.profiles where id = uid;

  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
