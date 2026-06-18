create extension if not exists pgcrypto;

alter table public.matches
  add column if not exists home_team_logo text,
  add column if not exists away_team_logo text;

alter table public.users
  add column if not exists pin_hash text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'pin'
  ) then
    execute '
      update public.users
      set pin_hash = crypt(pin, gen_salt(''bf''))
      where pin_hash is null
    ';
    execute '
      alter table public.users
      drop column pin
    ';
  end if;
end $$;

alter table public.users
  alter column pin_hash set not null;

create table if not exists public.app_sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_user_id_idx
  on public.app_sessions(user_id);

create unique index if not exists matches_api_fixture_id_unique
  on public.matches(api_fixture_id)
  where api_fixture_id is not null;

create unique index if not exists predictions_user_match_unique
  on public.predictions(user_id, match_id);

create or replace function public.session_user(p_token uuid)
returns public.users
language sql
security definer
set search_path = public
stable
as $$
  select u.*
  from public.app_sessions s
  join public.users u on u.id = s.user_id
  where s.token = p_token
    and s.expires_at > now()
    and u.active = true
  limit 1
$$;

create or replace function public.require_admin(p_token uuid)
returns uuid
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

  if v_user.id is null or v_user.role <> 'admin' then
    raise exception 'Admin session required';
  end if;

  return v_user.id;
end;
$$;

create or replace function public.login_with_pin(
  p_name text,
  p_pin text
)
returns table (
  id uuid,
  name text,
  role text,
  active boolean,
  session_token uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_token uuid;
begin
  select * into v_user
  from public.users u
  where lower(u.name) = lower(trim(p_name))
    and u.active = true
    and u.pin_hash = crypt(p_pin, u.pin_hash)
  limit 1;

  if v_user.id is null then
    return;
  end if;

  delete from public.app_sessions
  where expires_at <= now();

  insert into public.app_sessions(user_id)
  values (v_user.id)
  returning token into v_token;

  return query
  select
    v_user.id,
    v_user.name,
    v_user.role,
    v_user.active,
    v_token;
end;
$$;

create or replace function public.logout_session(p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.app_sessions
  where token = p_token
$$;

create or replace function public.list_public_users()
returns table (
  id uuid,
  name text,
  role text,
  active boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.name, u.role, u.active
  from public.users u
  where u.active = true
  order by u.name
$$;

create or replace function public.admin_list_users(p_token uuid)
returns table (
  id uuid,
  name text,
  role text,
  active boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.require_admin(p_token);
  return query
  select u.id, u.name, u.role, u.active
  from public.users u
  order by u.name;
end;
$$;

create or replace function public.admin_create_user(
  p_token uuid,
  p_name text,
  p_pin text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform public.require_admin(p_token);

  if length(trim(p_name)) < 2
    or p_pin !~ '^[0-9]{4}$'
    or p_role not in ('user', 'admin') then
    raise exception 'Invalid user data';
  end if;

  insert into public.users(name, pin_hash, role, active)
  values (
    trim(p_name),
    crypt(p_pin, gen_salt('bf')),
    p_role,
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.admin_set_user_active(
  p_token uuid,
  p_user_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  v_actor := public.require_admin(p_token);
  if v_actor = p_user_id and p_active = false then
    raise exception 'Cannot disable your own account';
  end if;
  update public.users
  set active = p_active
  where id = p_user_id;
end;
$$;

create or replace function public.admin_create_matchday_with_matches(
  p_token uuid,
  p_name text,
  p_matches jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matchday_id uuid;
begin
  perform public.require_admin(p_token);

  select id into v_matchday_id
  from public.matchdays
  where name = trim(p_name)
  limit 1;

  if v_matchday_id is null then
    insert into public.matchdays(name, is_open)
    values (trim(p_name), true)
    returning id into v_matchday_id;
  else
    update public.matchdays
    set is_open = true
    where id = v_matchday_id;
  end if;

  insert into public.matches(
    matchday_id,
    home_team,
    away_team,
    kickoff,
    api_fixture_id,
    home_team_logo,
    away_team_logo
  )
  select
    v_matchday_id,
    item->>'home_team',
    item->>'away_team',
    (item->>'kickoff')::timestamptz,
    nullif(item->>'api_fixture_id', '')::bigint,
    nullif(item->>'home_team_logo', ''),
    nullif(item->>'away_team_logo', '')
  from jsonb_array_elements(p_matches) item
  on conflict (api_fixture_id)
    where api_fixture_id is not null
  do update set
    matchday_id = excluded.matchday_id,
    home_team = excluded.home_team,
    away_team = excluded.away_team,
    kickoff = excluded.kickoff,
    home_team_logo = excluded.home_team_logo,
    away_team_logo = excluded.away_team_logo;

  return v_matchday_id;
end;
$$;

create or replace function public.admin_add_match(
  p_token uuid,
  p_matchday_id uuid,
  p_home_team text,
  p_away_team text,
  p_kickoff timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform public.require_admin(p_token);
  insert into public.matches(
    matchday_id, home_team, away_team, kickoff
  )
  values (
    p_matchday_id,
    trim(p_home_team),
    trim(p_away_team),
    p_kickoff
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_import_matches(
  p_token uuid,
  p_matchday_id uuid,
  p_matches jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform public.require_admin(p_token);

  insert into public.matches(
    matchday_id,
    home_team,
    away_team,
    kickoff,
    api_fixture_id,
    home_team_logo,
    away_team_logo
  )
  select
    p_matchday_id,
    item->>'home_team',
    item->>'away_team',
    (item->>'kickoff')::timestamptz,
    nullif(item->>'api_fixture_id', '')::bigint,
    nullif(item->>'home_team_logo', ''),
    nullif(item->>'away_team_logo', '')
  from jsonb_array_elements(p_matches) item
  on conflict (api_fixture_id)
    where api_fixture_id is not null
  do update set
    matchday_id = excluded.matchday_id,
    home_team = excluded.home_team,
    away_team = excluded.away_team,
    kickoff = excluded.kickoff,
    home_team_logo = excluded.home_team_logo,
    away_team_logo = excluded.away_team_logo;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

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
  set home_score = p_home_score,
      away_score = p_away_score
  where id = p_match_id;
end;
$$;

create or replace function public.admin_update_match(
  p_token uuid,
  p_match_id uuid,
  p_home_team text,
  p_away_team text,
  p_kickoff timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);
  update public.matches
  set home_team = trim(p_home_team),
      away_team = trim(p_away_team),
      kickoff = p_kickoff
  where id = p_match_id;
end;
$$;

create or replace function public.admin_set_matchday_open(
  p_token uuid,
  p_matchday_id uuid,
  p_is_open boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);
  update public.matchdays
  set is_open = p_is_open
  where id = p_matchday_id;
end;
$$;

create or replace function public.admin_delete_match(
  p_token uuid,
  p_match_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);
  delete from public.matches
  where id = p_match_id;
end;
$$;

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
    p.id,
    p.user_id,
    p.match_id,
    p.home_prediction,
    p.away_prediction
  from public.predictions p
  where p.user_id = v_user.id;
end;
$$;

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
    p.id,
    p.user_id,
    p.match_id,
    p.home_prediction,
    p.away_prediction
  from public.predictions p
  join public.matches m
    on m.id = p.match_id
  where m.home_score is not null
    and m.away_score is not null
$$;

create or replace function public.save_prediction(
  p_token uuid,
  p_match_id uuid,
  p_home integer,
  p_away integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_kickoff timestamptz;
begin
  select * into v_user
  from public.session_user(p_token);
  if v_user.id is null then
    raise exception 'Valid session required';
  end if;

  select kickoff into v_kickoff
  from public.matches
  where id = p_match_id;

  if v_kickoff is null or v_kickoff <= now() then
    raise exception 'Predictions are locked';
  end if;

  if p_home < 0 or p_away < 0 then
    raise exception 'Invalid prediction';
  end if;

  insert into public.predictions(
    user_id, match_id, home_prediction, away_prediction
  )
  values (
    v_user.id, p_match_id, p_home, p_away
  )
  on conflict (user_id, match_id)
  do update set
    home_prediction = excluded.home_prediction,
    away_prediction = excluded.away_prediction;
end;
$$;

alter table public.users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.matchdays enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users',
        'app_sessions',
        'matchdays',
        'matches',
        'predictions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      p.policyname,
      p.schemaname,
      p.tablename
    );
  end loop;
end $$;

create policy matchdays_public_read
  on public.matchdays
  for select
  to anon, authenticated
  using (true);

create policy matches_public_read
  on public.matches
  for select
  to anon, authenticated
  using (true);

revoke all on public.users from anon, authenticated;
revoke all on public.app_sessions from anon, authenticated;
revoke insert, update, delete on public.matchdays from anon, authenticated;
revoke insert, update, delete on public.matches from anon, authenticated;
revoke insert, update, delete on public.predictions from anon, authenticated;
revoke select on public.predictions from anon, authenticated;

grant select on public.matchdays to anon, authenticated;
grant select on public.matches to anon, authenticated;

revoke execute on function public.session_user(uuid) from public, anon, authenticated;
revoke execute on function public.require_admin(uuid) from public, anon, authenticated;
revoke execute on function public.login_with_pin(text, text) from public;
revoke execute on function public.logout_session(uuid) from public;
revoke execute on function public.list_public_users() from public;
revoke execute on function public.admin_list_users(uuid) from public;
revoke execute on function public.admin_create_user(uuid, text, text, text) from public;
revoke execute on function public.admin_set_user_active(uuid, uuid, boolean) from public;
revoke execute on function public.admin_create_matchday_with_matches(uuid, text, jsonb) from public;
revoke execute on function public.admin_add_match(uuid, uuid, text, text, timestamptz) from public;
revoke execute on function public.admin_import_matches(uuid, uuid, jsonb) from public;
revoke execute on function public.admin_set_score(uuid, uuid, integer, integer) from public;
revoke execute on function public.admin_update_match(uuid, uuid, text, text, timestamptz) from public;
revoke execute on function public.admin_set_matchday_open(uuid, uuid, boolean) from public;
revoke execute on function public.admin_delete_match(uuid, uuid) from public;
revoke execute on function public.my_predictions(uuid) from public;
revoke execute on function public.finished_predictions() from public;
revoke execute on function public.save_prediction(uuid, uuid, integer, integer) from public;

grant execute on function public.login_with_pin(text, text) to anon, authenticated;
grant execute on function public.logout_session(uuid) to anon, authenticated;
grant execute on function public.list_public_users() to anon, authenticated;
grant execute on function public.admin_list_users(uuid) to anon, authenticated;
grant execute on function public.admin_create_user(uuid, text, text, text) to anon, authenticated;
grant execute on function public.admin_set_user_active(uuid, uuid, boolean) to anon, authenticated;
grant execute on function public.admin_create_matchday_with_matches(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.admin_add_match(uuid, uuid, text, text, timestamptz) to anon, authenticated;
grant execute on function public.admin_import_matches(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.admin_set_score(uuid, uuid, integer, integer) to anon, authenticated;
grant execute on function public.admin_update_match(uuid, uuid, text, text, timestamptz) to anon, authenticated;
grant execute on function public.admin_set_matchday_open(uuid, uuid, boolean) to anon, authenticated;
grant execute on function public.admin_delete_match(uuid, uuid) to anon, authenticated;
grant execute on function public.my_predictions(uuid) to anon, authenticated;
grant execute on function public.finished_predictions() to anon, authenticated;
grant execute on function public.save_prediction(uuid, uuid, integer, integer) to anon, authenticated;
