create or replace function public.admin_sync_match(
  p_token uuid,
  p_match_id uuid,
  p_home_team text,
  p_away_team text,
  p_kickoff timestamptz,
  p_home_team_logo text,
  p_away_team_logo text,
  p_home_score integer default null,
  p_away_score integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin(p_token);

  if (
    (p_home_score is null) <>
    (p_away_score is null)
  ) or p_home_score < 0
    or p_away_score < 0 then
    raise exception 'Invalid score';
  end if;

  update public.matches
  set home_team = trim(p_home_team),
      away_team = trim(p_away_team),
      kickoff = p_kickoff,
      home_team_logo = nullif(p_home_team_logo, ''),
      away_team_logo = nullif(p_away_team_logo, ''),
      home_score = coalesce(p_home_score, home_score),
      away_score = coalesce(p_away_score, away_score)
  where id = p_match_id;
end;
$$;

revoke execute on function public.admin_sync_match(
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  text,
  text,
  integer,
  integer
) from public;

grant execute on function public.admin_sync_match(
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  text,
  text,
  integer,
  integer
) to anon, authenticated;
