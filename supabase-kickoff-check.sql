-- Use this only if the app still shows the wrong kickoff time after deploy + Sync.
-- It shows what Supabase has saved and how that timestamp renders in Romania.

select
  md.name as matchday,
  m.home_team,
  m.away_team,
  m.kickoff,
  m.kickoff at time zone 'Europe/Bucharest' as kickoff_ro,
  m.api_fixture_id,
  m.rescheduled_at
from public.matches m
join public.matchdays md
  on md.id = m.matchday_id
where
  m.home_team ilike '%PETROLUL%'
  and m.away_team ilike '%RAPID%'
order by m.kickoff;

-- Emergency manual correction for Petrolul - Rapid, if LPF sync is still blocked.
-- Uncomment only if the SELECT above still shows 18:30 RO.
--
-- update public.matches
-- set
--   kickoff = '2026-08-21 20:30:00 Europe/Bucharest'::timestamptz,
--   rescheduled_at = now()
-- where
--   home_team ilike '%PETROLUL%'
--   and away_team ilike '%RAPID%';
