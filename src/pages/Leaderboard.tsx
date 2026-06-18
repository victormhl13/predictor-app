import {
  useEffect,
  useState,
} from "react"
import { Crown } from "lucide-react"

import { supabase } from "../lib/supabase"
import {
  getFinishedPredictions,
  listPublicUsers,
} from "../lib/appApi"
import { calculateLeaderboard } from "../utils/calculateLeaderboard"
import PageHeader from "../components/PageHeader"
import type {
  Match,
  Prediction,
  User,
} from "../types"

type Player = User & {
  points: number
}

function Leaderboard() {
  const [players, setPlayers] =
    useState<Player[]>([])

  useEffect(() => {
    async function load() {
      const [
        usersResult,
        predictionsResult,
        matchesResult,
      ] = await Promise.all([
        listPublicUsers().then(
          (data) => ({ data })
        ),
        getFinishedPredictions().then(
          (data) => ({ data })
        ),
        supabase
          .from("matches")
          .select("*"),
      ])

      if (
        !usersResult.data ||
        !predictionsResult.data ||
        !matchesResult.data
      ) {
        return
      }

      setPlayers(
        calculateLeaderboard(
          usersResult.data as User[],
          predictionsResult.data as Prediction[],
          matchesResult.data as Match[]
        )
      )
    }

    load()
  }, [])

  return (
    <div className="page">
      <PageHeader
        title="Ranking"
        subtitle="3 points for the exact score, 1 for the correct outcome."
      />

      {players.length === 0 ? (
        <div className="surface empty-state">
          No ranking yet.
        </div>
      ) : (
        <div
          className="surface"
          style={{
            overflow: "hidden",
          }}
        >
          {players.map(
            (player, index) => {
              const podium =
                index < 3
              const colors = [
                "#F8D477",
                "#C9CFD8",
                "#D99A68",
              ]

              return (
                <div
                  key={player.id}
                  className="compact-row"
                  style={{
                    minHeight:
                      index === 0
                        ? "62px"
                        : "54px",
                    background:
                      index === 0
                        ? "linear-gradient(90deg, rgba(248,212,119,0.10), transparent)"
                        : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      color: podium
                        ? colors[index]
                        : "#6B7280",
                      fontSize:
                        podium
                          ? "17px"
                          : "11px",
                      fontWeight: 850,
                      textAlign:
                        "center",
                    }}
                  >
                    {index === 0 ? (
                      <Crown
                        size={18}
                      />
                    ) : (
                      `#${index + 1}`
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          index === 0
                            ? "14px"
                            : "12px",
                        fontWeight: 800,
                      }}
                    >
                      {player.name}
                    </div>
                    <div
                      style={{
                        marginTop: "2px",
                        color:
                          "#6B7280",
                        fontSize: "9px",
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {player.role}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          index === 0
                            ? "20px"
                            : "17px",
                      }}
                    >
                      {player.points}
                    </strong>
                    <span
                      style={{
                        marginLeft: "4px",
                        color:
                          "#9CA3AF",
                        fontSize: "9px",
                      }}
                    >
                      pts
                    </span>
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}

export default Leaderboard
