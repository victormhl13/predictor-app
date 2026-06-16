import { useEffect, useState } from "react"

import { Link } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

import InfoCard from "../components/InfoCard"

import type {
  Match,

  Prediction,

  User,
} from "../types"

function Dashboard() {
  const { currentUser } = useAuth()

  const [currentMatchday, setCurrentMatchday] =
    useState("-")

  const [upcomingMatch, setUpcomingMatch] =
    useState("No matches")

  const [myPredictions, setMyPredictions] =
    useState(0)

  const [leader, setLeader] =
    useState("No data")

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
        `${data.home_team} - ${data.away_team}`
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

    if (
      leaderboard.length > 0
    ) {
      setLeader(
        `${leaderboard[0].name} (${leaderboard[0].points} pts)`
      )
    }
  }

  return (
    <div>
      <InfoCard
        title="⚽ Current Matchday"

        value={
          currentMatchday
        }
      />

      <InfoCard
        title="📅 Upcoming Match"

        value={
          upcomingMatch
        }
      />

      <InfoCard
        title="📝 My Predictions"

        value={`${myPredictions} saved`}
      />

      <InfoCard
        title="🏆 Leaderboard"

        value={leader}
      />

      <Link
        to="/statistics"

        style={{
          textDecoration:
            "none",

          color:
            "inherit",
        }}
      >
        <InfoCard
          title="📊 Statistics"

          value="Open statistics"
        />
      </Link>
    </div>
  )
}

export default Dashboard