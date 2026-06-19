import { supabase } from "./supabase"
import type {
  Prediction,
  User,
} from "../types"

function rpcMessage(
  error: {
    code?: string
    message?: string
  } | null,
  fallback: string
) {
  if (!error) return fallback
  if (error.code === "23505") {
    return "This item already exists."
  }
  if (
    error.message?.includes(
      "Invalid session"
    )
  ) {
    return "Your session has expired. Please sign in again."
  }
  return error.message || fallback
}

function sessionToken() {
  const token =
    localStorage.getItem(
      "goalpredict_session"
    )

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    )
  }

  return token
}

export async function loginWithPin(
  name: string,
  pin: string
) {
  const { data, error } =
    await supabase.rpc(
      "login_with_pin",
      {
        p_name: name,
        p_pin: pin,
      }
    )

  if (error) {
    console.error(
      "Login RPC failed",
      error
    )
    throw new Error(
      "Sign-in is temporarily unavailable."
    )
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Name or PIN is incorrect."
    )
  }

  const row = data[0]
  const user: User = {
    id: row.id,
    name: row.name,
    role: row.role,
    active: row.active,
  }

  return {
    user,
    token:
      row.session_token as string,
  }
}

export async function logoutSession() {
  const token =
    localStorage.getItem(
      "goalpredict_session"
    )

  if (token) {
    await supabase.rpc(
      "logout_session",
      {
        p_token: token,
      }
    )
  }
}

export async function listPublicUsers() {
  const { data, error } =
    await supabase.rpc(
      "list_public_users"
    )
  if (error) throw error
  return (data || []) as User[]
}

export async function listAdminUsers() {
  const { data, error } =
    await supabase.rpc(
      "admin_list_users",
      {
        p_token:
          sessionToken(),
      }
    )
  if (error) throw error
  return (data || []) as User[]
}

export async function createUser(
  name: string,
  pin: string,
  role: string
) {
  const { error } =
    await supabase.rpc(
      "admin_create_user",
      {
        p_token:
          sessionToken(),
        p_name: name,
        p_pin: pin,
        p_role: role,
      }
    )
  if (error) {
    throw new Error(
      error.code === "23505"
        ? "A user with this name already exists."
        : rpcMessage(
            error,
            "Could not create user."
          )
    )
  }
}

export async function setUserActive(
  userId: string,
  active: boolean
) {
  const { error } =
    await supabase.rpc(
      "admin_set_user_active",
      {
        p_token:
          sessionToken(),
        p_user_id: userId,
        p_active: active,
      }
    )
  if (error) throw error
}

export async function createMatchdayWithMatches(
  name: string,
  matches: unknown[]
) {
  const { error } =
    await supabase.rpc(
      "admin_create_matchday_with_matches",
      {
        p_token:
          sessionToken(),
        p_name: name,
        p_matches: matches,
      }
    )
  if (error) throw error
}

export async function addManualMatch(
  matchdayId: string,
  homeTeam: string,
  awayTeam: string,
  kickoff: string
) {
  const { error } =
    await supabase.rpc(
      "admin_add_match",
      {
        p_token:
          sessionToken(),
        p_matchday_id:
          matchdayId,
        p_home_team: homeTeam,
        p_away_team: awayTeam,
        p_kickoff: kickoff,
      }
    )
  if (error) throw error
}

export async function importMatches(
  matchdayId: string,
  matches: unknown[]
) {
  const { data, error } =
    await supabase.rpc(
      "admin_import_matches",
      {
        p_token:
          sessionToken(),
        p_matchday_id:
          matchdayId,
        p_matches: matches,
      }
    )
  if (error) throw error
  return Number(data || 0)
}

export async function setFinalScore(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  const { error } =
    await supabase.rpc(
      "admin_set_score",
      {
        p_token:
          sessionToken(),
        p_match_id: matchId,
        p_home_score:
          homeScore,
        p_away_score:
          awayScore,
      }
    )
  if (error) throw error
}

export async function updateMatch(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  kickoff: string
) {
  const { error } =
    await supabase.rpc(
      "admin_update_match",
      {
        p_token:
          sessionToken(),
        p_match_id: matchId,
        p_home_team: homeTeam,
        p_away_team: awayTeam,
        p_kickoff: kickoff,
      }
    )
  if (error) throw error
}

export async function syncMatch(
  matchId: string,
  details: {
    homeTeam: string
    awayTeam: string
    kickoff: string
    homeLogo?: string | null
    awayLogo?: string | null
    homeScore?: number | null
    awayScore?: number | null
  }
) {
  const { error } =
    await supabase.rpc(
      "admin_sync_match",
      {
        p_token:
          sessionToken(),
        p_match_id: matchId,
        p_home_team:
          details.homeTeam,
        p_away_team:
          details.awayTeam,
        p_kickoff:
          details.kickoff,
        p_home_team_logo:
          details.homeLogo ||
          null,
        p_away_team_logo:
          details.awayLogo ||
          null,
        p_home_score:
          details.homeScore ??
          null,
        p_away_score:
          details.awayScore ??
          null,
      }
    )
  if (error) throw error
}

export async function setMatchdayOpen(
  matchdayId: string,
  open: boolean
) {
  const { error } =
    await supabase.rpc(
      "admin_set_matchday_open",
      {
        p_token:
          sessionToken(),
        p_matchday_id:
          matchdayId,
        p_is_open: open,
      }
    )
  if (error) throw error
}

export async function deleteMatch(
  matchId: string
) {
  const { error } =
    await supabase.rpc(
      "admin_delete_match",
      {
        p_token:
          sessionToken(),
        p_match_id: matchId,
      }
    )
  if (error) throw error
}

export async function getMyPredictions() {
  const { data, error } =
    await supabase.rpc(
      "my_predictions",
      {
        p_token:
          sessionToken(),
      }
    )
  if (error) throw error
  return (data ||
    []) as Prediction[]
}

export async function getFinishedPredictions() {
  const { data, error } =
    await supabase.rpc(
      "finished_predictions"
    )
  if (error) throw error
  return (data ||
    []) as Prediction[]
}

export async function saveMyPrediction(
  matchId: string,
  home: number,
  away: number
) {
  const { error } =
    await supabase.rpc(
      "save_prediction",
      {
        p_token:
          sessionToken(),
        p_match_id: matchId,
        p_home: home,
        p_away: away,
      }
    )
  if (error) throw error
}
