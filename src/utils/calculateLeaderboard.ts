import type {
  Match,

  Prediction,

  User,
} from "../types"
import {
  rankedPlayers,
} from "./scoring"

export function calculateLeaderboard(
  users: User[],

  predictions: Prediction[],

  matches: Match[]
) {
  return rankedPlayers(
    users,
    predictions,
    matches
  )
}
