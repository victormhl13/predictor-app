export type User = {
  id: string

  name: string

  role: string

  active: boolean
}

export type Matchday = {
  id: string

  name: string

  is_open: boolean
}

export type Match = {
  id: string

  matchday_id: string

  home_team: string

  away_team: string

  kickoff: string

  home_score: number | null

  away_score: number | null

  api_fixture_id: number | null

  home_team_logo?: string | null

  away_team_logo?: string | null
}

export type Prediction = {
  id: string

  user_id: string

  match_id: string

  home_prediction: number

  away_prediction: number
}
