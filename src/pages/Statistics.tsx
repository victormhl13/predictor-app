import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

function Statistics() {
  const [stats, setStats] =
    useState<any>({
      leader: "-",

      leaderPoints: 0,

      exactScores: 0,

      totalPredictions: 0,

      successRate: 0,
    })

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    const { data: users } =
      await supabase
        .from("users")
        .select("*")

    const {
      data: predictions,
    } = await supabase
      .from("predictions")
      .select("*")

    const { data: matches } =
      await supabase
        .from("matches")
        .select("*")

    if (
      !users ||

      !predictions ||

      !matches
    ) {
      return
    }

    let exactScores = 0

    let correctResults = 0

    const leaderboard =
      users.map((user) => {
        let points = 0

        predictions

          .filter(
            (prediction) =>
              prediction.user_id ===
              user.id
          )

          .forEach(
            (prediction) => {
              const match =
                matches.find(
                  (m) =>
                    m.id ===
                    prediction.match_id
                )

              if (!match)
                return

              if (
                match.home_score ===
                  null ||

                match.away_score ===
                  null
              ) {
                return
              }

              if (
                prediction.home_prediction ===
                  match.home_score &&

                prediction.away_prediction ===
                  match.away_score
              ) {
                points += 3

                exactScores += 1

                correctResults += 1

                return
              }

              const predicted =
                Math.sign(
                  prediction.home_prediction -

                    prediction.away_prediction
                )

              const result =
                Math.sign(
                  match.home_score -

                    match.away_score
                )

              if (
                predicted ===
                result
              ) {
                points += 1

                correctResults += 1
              }
            }
          )

        return {
          ...user,

          points,
        }
      })

    leaderboard.sort(
      (a, b) =>
        b.points - a.points
    )

    const totalPredictions =
      predictions.length

    const successRate =
      totalPredictions === 0

        ? 0

        : Math.round(
            (correctResults /
              totalPredictions) *

              100
          )

    setStats({
      leader:
        leaderboard[0]
          ?.name ?? "-",

      leaderPoints:
        leaderboard[0]
          ?.points ?? 0,

      exactScores,

      totalPredictions,

      successRate,
    })
  }

  return (
    <div>
      <h2>
        📊 Statistics
      </h2>

      <div
        style={{
          backgroundColor:
            "#1E1E1E",

          border:
            "1px solid #2A2A2A",

          borderRadius:
            "12px",

          padding:
            "20px",
        }}
      >
        <p>
          👑 Leader:

          {" "}

          {stats.leader}
        </p>

        <p>
          🏆 Leader Points:

          {" "}

          {stats.leaderPoints}
        </p>

        <p>
          🎯 Exact Scores:

          {" "}

          {stats.exactScores}
        </p>

        <p>
          ⚽ Total Predictions:

          {" "}

          {stats.totalPredictions}
        </p>

        <p>
          📈 Success Rate:

          {" "}

          {stats.successRate}%
        </p>
      </div>
    </div>
  )
}

export default Statistics