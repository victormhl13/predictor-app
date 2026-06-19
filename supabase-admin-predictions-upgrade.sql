create or replace function public.admin_reset_user_pin(
  p_token uuid,
  p_user_id uuid,
  p_new_pin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);

  if p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits';
  end if;

  update public.users
  set pin_hash = extensions.crypt(
    p_new_pin,
    extensions.gen_salt('bf')
  )
  where id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  delete from public.app_sessions
  where user_id = p_user_id;
end;
$$;

create or replace function public.admin_delete_matchday(
  p_token uuid,
  p_matchday_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);

  delete from public.predictions
  where match_id in (
    select id
    from public.matches
    where matchday_id = p_matchday_id
  );

  delete from public.matches
  where matchday_id = p_matchday_id;

  delete from public.matchdays
  where id = p_matchday_id;

  if not found then
    raise exception 'Matchday not found';
  end if;
end;
$$;

create or replace function public.locked_predictions()
returns table (
  id uuid,
  user_id uuid,
  match_id uuid,
  home_prediction integer,
  away_prediction integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.user_id,
    p.match_id,
    p.home_prediction,
    p.away_prediction
  from public.predictions p
  join public.matches m
    on m.id = p.match_id
  where m.kickoff <= now()
$$;

revoke execute on function public.admin_reset_user_pin(
  uuid, uuid, text
) from public;
revoke execute on function public.admin_delete_matchday(
  uuid, uuid
) from public;
revoke execute on function public.locked_predictions()
  from public;

grant execute on function public.admin_reset_user_pin(
  uuid, uuid, text
) to anon, authenticated;
grant execute on function public.admin_delete_matchday(
  uuid, uuid
) to anon, authenticated;
grant execute on function public.locked_predictions()
  to anon, authenticated;
