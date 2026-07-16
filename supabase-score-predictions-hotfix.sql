drop function if exists public.admin_set_score(uuid, uuid, integer, integer);

create or replace function public.admin_set_score(
  p_token uuid,
  p_match_id uuid,
  p_home_score integer,
  p_away_score integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);

  if p_home_score < 0 or p_away_score < 0 then
    raise exception 'Invalid score';
  end if;

  update public.matches
  set
    home_score = p_home_score,
    away_score = p_away_score
  where id = p_match_id;

  if not found then
    raise exception 'Match not found';
  end if;
end;
$$;

drop function if exists public.my_predictions(uuid);

create or replace function public.my_predictions(p_token uuid)
returns table (
  id uuid,
  user_id uuid,
  match_id uuid,
  home_prediction integer,
  away_prediction integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user public.users;
begin
  select * into v_user
  from public.session_user(p_token);

  if v_user.id is null then
    raise exception 'Valid session required';
  end if;

  return query
  select
    p.id::uuid,
    p.user_id::uuid,
    p.match_id::uuid,
    p.home_prediction::integer,
    p.away_prediction::integer
  from public.predictions p
  where p.user_id = v_user.id
  order by p.id;
end;
$$;

drop function if exists public.finished_predictions();

create or replace function public.finished_predictions()
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
    p.id::uuid,
    p.user_id::uuid,
    p.match_id::uuid,
    p.home_prediction::integer,
    p.away_prediction::integer
  from public.predictions p
  join public.matches m
    on m.id = p.match_id
  where m.home_score is not null
    and m.away_score is not null
  order by m.kickoff, p.id
$$;

drop function if exists public.locked_predictions();

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
    p.id::uuid,
    p.user_id::uuid,
    p.match_id::uuid,
    p.home_prediction::integer,
    p.away_prediction::integer
  from public.predictions p
  join public.matches m
    on m.id = p.match_id
  where m.kickoff <= now()
    or (
      m.home_score is not null
      and m.away_score is not null
    )
  order by m.kickoff, p.id
$$;

drop function if exists public.save_predictions(uuid, jsonb);

create or replace function public.save_predictions(
  p_token uuid,
  p_predictions jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_count integer := 0;
begin
  select * into v_user
  from public.session_user(p_token);

  if v_user.id is null then
    raise exception 'Valid session required';
  end if;

  if p_predictions is null
    or jsonb_typeof(p_predictions) <> 'array' then
    raise exception 'Invalid predictions payload';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_predictions) item
    left join public.matches m
      on m.id = (item->>'match_id')::uuid
    where m.id is null
      or m.kickoff <= now()
      or m.home_score is not null
      or m.away_score is not null
      or (item->>'home')::integer < 0
      or (item->>'away')::integer < 0
  ) then
    raise exception
      'One or more predictions are locked or invalid';
  end if;

  insert into public.predictions(
    user_id,
    match_id,
    home_prediction,
    away_prediction
  )
  select
    v_user.id,
    (item->>'match_id')::uuid,
    (item->>'home')::integer,
    (item->>'away')::integer
  from jsonb_array_elements(p_predictions) item
  join public.matches m
    on m.id = (item->>'match_id')::uuid
  where m.kickoff > now()
    and m.home_score is null
    and m.away_score is null
  on conflict (user_id, match_id)
  do update set
    home_prediction = excluded.home_prediction,
    away_prediction = excluded.away_prediction;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

drop function if exists public.admin_all_predictions(uuid);

create or replace function public.admin_all_predictions(
  p_token uuid
)
returns table (
  id uuid,
  user_id uuid,
  match_id uuid,
  home_prediction integer,
  away_prediction integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.require_admin(p_token);

  return query
  select
    p.id::uuid,
    p.user_id::uuid,
    p.match_id::uuid,
    p.home_prediction::integer,
    p.away_prediction::integer
  from public.predictions p
  order by p.id;
end;
$$;

revoke execute on function public.admin_set_score(
  uuid, uuid, integer, integer
) from public;
revoke execute on function public.my_predictions(uuid)
  from public;
revoke execute on function public.finished_predictions()
  from public;
revoke execute on function public.locked_predictions()
  from public;
revoke execute on function public.save_predictions(uuid, jsonb)
  from public;
revoke execute on function public.admin_all_predictions(uuid)
  from public;

grant execute on function public.admin_set_score(
  uuid, uuid, integer, integer
) to anon, authenticated;
grant execute on function public.my_predictions(uuid)
  to anon, authenticated;
grant execute on function public.finished_predictions()
  to anon, authenticated;
grant execute on function public.locked_predictions()
  to anon, authenticated;
grant execute on function public.save_predictions(uuid, jsonb)
  to anon, authenticated;
grant execute on function public.admin_all_predictions(uuid)
  to anon, authenticated;
