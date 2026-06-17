import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

function Statistics() {
  const [stats, setStats] =
    useState<any>({
      leader: "-",

      players: 0,

      openMatchdays: 0,

      finishedMatches: 0,
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
      data: matchdays,
    } = await supabase

      .from("matchdays")

      .select("*")

    const { data: matches } =
      await supabase

        .from("matches")

        .select("*")

    const {
      data: predictions,
    } = await supabase

      .from("predictions")

      .select("*")

    if (
      !users ||

      !matchdays ||

      !matches ||

      !predictions
    ) {
      return
    }

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

    const finishedMatches =
      matches.filter(
        (match) =>
          match.home_score !==
            null &&

          match.away_score !==
            null
      ).length

    const openMatchdays =
      matchdays.filter(
        (matchday) =>
          matchday.is_open
      ).length

    setStats({
      leader:
        leaderboard[0]
          ?.name ?? "-",

      players:
        users.length,

      openMatchdays,

      finishedMatches,
    })
  }

  function StatCard({
    title,

    value,
  }: any) {
    return (
      <div
        style={{
          background:
            "rgba(255,255,255,0.05)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          borderRadius:
            "18px",

          padding:
            "16px",

          marginBottom:
            "10px",

          minHeight:
            "82px",

          display:
            "flex",

          flexDirection:
            "column",

          justifyContent:
            "center",

          alignItems:
            "center",
        }}
      >
        <div
          style={{
            color:
              "#9CA3AF",

            fontSize:
              "12px",

            fontWeight:
              600,

            marginBottom:
              "6px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize:
              "22px",

            fontWeight:
              800,

            textAlign:
              "center",
          }}
        >
          {value}
        </div>
      </div>
    )
  }

  return (
    <div>
      <StatCard
        title="Leader"

        value={
          stats.leader
        }
      />

      <StatCard
        title="Players"

        value={
          stats.players
        }
      />

      <StatCard
        title="Open Matchdays"

        value={
          stats.openMatchdays
        }
      />

      <StatCard
        title="Finished Matches"

        value={
          stats.finishedMatches
        }
      />
    </div>
  )
}

export default Statistics