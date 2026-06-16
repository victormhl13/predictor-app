export type User = {
  id: number
  name: string
  pin: string
  role: "admin" | "user"
  active: boolean
}

export type Matchday = {
  id: number
  name: string
}

export type Match = {
  id: number
  matchdayId: number

  homeTeam: string
  awayTeam: string

  kickoff: string

  homeScore: number | null
  awayScore: number | null
}

export type Prediction = {
  id: number

  userId: number

  matchId: number

  homePrediction: number

  awayPrediction: number
}

export const appData = {
  users: [
    {
      id: 1,
      name: "Victor",
      pin: "1234",
      role: "admin",
      active: true,
    },
  ] as User[],

  matchdays: [] as Matchday[],

  matches: [] as Match[],

  predictions: [] as Prediction[],
}