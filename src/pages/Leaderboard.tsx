import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

import { calculateLeaderboard } from "../utils/calculateLeaderboard"

import type {
  User,

  Match,

  Prediction,
} from "../types"

type LeaderboardPlayer =
  User & {
    points: number
  }

function Leaderboard() {
  const [
    leaderboard,

    setLeaderboard,
  ] = useState<
    LeaderboardPlayer[]
  >([])

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    const {
      data: users,
    } = await supabase

      .from("users")

      .select("*")

    const {
      data: predictions,
    } = await supabase

      .from("predictions")

      .select("*")

    const {
      data: matches,
    } = await supabase

      .from("matches")

      .select("*")

    if (
      !users ||

      !predictions ||

      !matches
    ) {
      return
    }

    const scores =
      calculateLeaderboard(
        users as User[],

        predictions as Prediction[],

        matches as Match[]
      )

    setLeaderboard(
      scores
    )
  }

  function getMedal(
    index: number
  ) {
    if (index === 0)
      return "🥇"

    if (index === 1)
      return "🥈"

    if (index === 2)
      return "🥉"

    return `${index + 1}.`
  }

  return (
    <div>
      <h2>
        🏆 Leaderboard
      </h2>

      {leaderboard.map(
        (
          player,

          index
        ) => (
          <div
            key={player.id}
            style={{
              backgroundColor:
                index === 0
                  ? "#2A2412"
                  : "#1E1E1E",

              border:
                index === 0
                  ? "1px solid #FFD700"
                  : "1px solid #2A2A2A",

              borderRadius:
                "12px",

              padding:
                "16px",

              marginBottom:
                "12px",
            }}
          >
            <h3>
              {getMedal(
                index
              )}

              {" "}

              {player.name}

              {" - "}

              {player.points}

              pts
            </h3>
          </div>
        )
      )}
    </div>
  )
}

export default Leaderboard