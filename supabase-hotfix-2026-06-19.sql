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
  where lower(u.name::text) = lower(trim(p_name))
    and u.active = true
    and u.pin_hash = extensions.crypt(p_pin, u.pin_hash)
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
    v_user.name::text,
    v_user.role::text,
    v_user.active,
    v_token;
end;
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
  select
    u.id,
    u.name::text,
    u.role::text,
    u.active
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
  select
    u.id,
    u.name::text,
    u.role::text,
    u.active
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

  insert into public.users(
    name,
    pin_hash,
    role,
    active
  )
  values (
    trim(p_name),
    extensions.crypt(
      p_pin,
      extensions.gen_salt('bf')
    ),
    p_role,
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.login_with_pin(text, text)
  to anon, authenticated;
grant execute on function public.list_public_users()
  to anon, authenticated;
grant execute on function public.admin_list_users(uuid)
  to anon, authenticated;
grant execute on function public.admin_create_user(uuid, text, text, text)
  to anon, authenticated;
