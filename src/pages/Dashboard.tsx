import { useEffect, useState } from "react"

import { Link } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

import type {
  Match,
  Prediction,
  User,
} from "../types"

function Dashboard() {
  const { currentUser } =
    useAuth()

  const [
    currentMatchday,

    setCurrentMatchday,
  ] = useState("-")

  const [
    upcomingMatch,

    setUpcomingMatch,
  ] = useState(
    "No matches"
  )

  const [
    myPredictions,

    setMyPredictions,
  ] = useState(0)

  const [
    leader,

    setLeader,
  ] = useState("No leader yet")

  useEffect(() => {
    loadDashboard()
  }, [currentUser])

  async function loadDashboard() {
    await loadCurrentMatchday()

    await loadUpcomingMatch()

    await loadMyPredictions()

    await loadLeaderboard()
  }

  async function loadCurrentMatchday() {
    const { data } =
      await supabase

        .from("matchdays")

        .select("*")

        .eq(
          "is_open",

          true
        )

        .order("name")

        .limit(1)

        .maybeSingle()

    if (data) {
      setCurrentMatchday(
        data.name
      )
    }
  }

  async function loadUpcomingMatch() {
    const { data } =
      await supabase

        .from("matches")

        .select("*")

        .order("kickoff")

        .limit(1)

        .maybeSingle()

    if (data) {
      setUpcomingMatch(
        `${data.home_team} vs ${data.away_team}`
      )
    }
  }

  async function loadMyPredictions() {
    if (!currentUser)
      return

    const { data } =
      await supabase

        .from("predictions")

        .select("*")

        .eq(
          "user_id",

          currentUser.id
        )

    setMyPredictions(
      data?.length ?? 0
    )
  }

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

    const typedUsers =
      users as User[]

    const typedPredictions =
      predictions as Prediction[]

    const typedMatches =
      matches as Match[]

    const leaderboard =
      typedUsers.map(
        (user) => {
          let points = 0

          typedPredictions

            .filter(
              (
                prediction
              ) =>
                prediction.user_id ===
                user.id
            )

            .forEach(
              (
                prediction
              ) => {
                const match =
                  typedMatches.find(
                    (
                      m
                    ) =>
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
        }
      )

    leaderboard.sort(
      (a, b) =>
        b.points - a.points
    )

    const top =
      leaderboard[0]

    if (
      !top ||

      top.points === 0
    ) {
      setLeader(
        "No leader yet"
      )

      return
    }

    setLeader(
      `${top.name}\n${top.points} pts`
    )
  }

  function DashboardCard({
    title,

    value,

    big = false,
  }: any) {
    return (
      <div
        style={{
          background:
            "rgba(255,255,255,0.05)",

          border:
            "1px solid rgba(255,255,255,0.10)",

          borderRadius:
            "24px",

          padding:
            big
              ? "22px"
              : "18px",

          minHeight:
            big
              ? "118px"
              : "98px",

          display:
            "flex",

          flexDirection:
            "column",

          justifyContent:
            "center",

          alignItems:
            "center",

          textAlign:
            "center",

          backdropFilter:
            "blur(22px)",

          WebkitBackdropFilter:
            "blur(22px)",

          boxShadow:
            "0 12px 34px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            color:
              "#9CA3AF",

            fontSize:
              "11px",

            fontWeight:
              700,

            letterSpacing:
              "1.4px",

            textTransform:
              "uppercase",

            marginBottom:
              "12px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize:
              big
                ? "22px"
                : "20px",

            fontWeight:
              800,

            lineHeight:
              1.35,

            whiteSpace:
              "pre-line",
          }}
        >
          {value}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: "-85px",
      }}
    >
      <div
        style={{
          marginBottom:
            "14px",
        }}
      >
        <DashboardCard
          title="Upcoming Match"

          value={
            upcomingMatch
          }

          big
        />
      </div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap: "12px",

          marginBottom:
            "12px",
        }}
      >
        <DashboardCard
          title="Matchday"

          value={
            currentMatchday
          }
        />

        <DashboardCard
          title="Leader"

          value={leader}
        />
      </div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap: "12px",
        }}
      >
        <DashboardCard
          title="Predictions"

          value={
            myPredictions
          }
        />

        <Link
          to="/statistics"

          style={{
            color:
              "inherit",

            textDecoration:
              "none",
          }}
        >
          <DashboardCard
            title="Statistics"

            value="Open →"
          />
        </Link>
      </div>
    </div>
  )
}

export default Dashboard