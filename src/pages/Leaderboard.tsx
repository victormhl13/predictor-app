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

  function getCardStyle(
    index: number
  ) {
    if (index === 0) {
      return {
        background:
          "rgba(255,215,0,0.12)",

        border:
          "1px solid rgba(255,215,0,0.30)",

        height: "78px",
      }
    }

    if (index === 1) {
      return {
        background:
          "rgba(192,192,192,0.10)",

        border:
          "1px solid rgba(192,192,192,0.22)",

        height: "70px",
      }
    }

    if (index === 2) {
      return {
        background:
          "rgba(205,127,50,0.10)",

        border:
          "1px solid rgba(205,127,50,0.22)",

        height: "70px",
      }
    }

    return {
      background:
        "rgba(255,255,255,0.05)",

      border:
        "1px solid rgba(255,255,255,0.08)",

      height: "66px",
    }
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

    return `#${index + 1}`
  }

  const hasPoints =
    leaderboard.some(
      (
        player
      ) =>
        player.points > 0
    )

  return (
    <div>
      {!hasPoints && (
        <div
          style={{
            background:
              "rgba(255,255,255,0.05)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "20px",

            padding:
              "18px",

            marginBottom:
              "14px",

            textAlign:
              "center",

            color:
              "#9CA3AF",

            fontSize:
              "14px",
          }}
        >
          No leaderboard yet
        </div>
      )}

      {leaderboard.map(
        (
          player,

          index
        ) => {
          const style =
            getCardStyle(
              index
            )

          return (
            <div
              key={
                player.id
              }

              style={{
                ...style,

                borderRadius:
                  "20px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                padding:
                  "0 18px",

                marginBottom:
                  "10px",

                transition:
                  "all .2s ease",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width:
                      "34px",

                    fontSize:
                      "20px",

                    textAlign:
                      "center",
                  }}
                >
                  {getMedal(
                    index
                  )}
                </div>

                <div
                  style={{
                    fontSize:
                      index === 0

                        ? "18px"

                        : "16px",

                    fontWeight:
                      700,
                  }}
                >
                  {
                    player.name
                  }
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize:
                      index === 0

                        ? "24px"

                        : "22px",

                    fontWeight:
                      800,
                  }}
                >
                  {
                    player.points
                  }
                </div>

                <div
                  style={{
                    color:
                      "#9CA3AF",

                    fontSize:
                      "13px",
                  }}
                >
                  pts
                </div>
              </div>
            </div>
          )
        }
      )}
    </div>
  )
}

export default Leaderboard