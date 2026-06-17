import { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function Profile() {
  const navigate = useNavigate()

  const {
    currentUser,

    setCurrentUser,
  } = useAuth()

  const [points, setPoints] =
    useState(0)

  useEffect(() => {
    loadPoints()
  }, [])

  async function loadPoints() {
    if (!currentUser)
      return

    const {
      data: predictions,
    } = await supabase

      .from("predictions")

      .select("*")

      .eq(
        "user_id",

        currentUser.id
      )

    const { data: matches } =
      await supabase

        .from("matches")

        .select("*")

    if (
      !predictions ||

      !matches
    ) {
      return
    }

    let total = 0

    predictions.forEach(
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
          total += 3

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
          total += 1
        }
      }
    )

    setPoints(total)
  }

  function logout() {
    localStorage.removeItem(
      "goalpredict_user"
    )

    setCurrentUser(null)

    navigate("/login")
  }

  function ProfileCard({
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
            "18px",

          marginBottom:
            "12px",

          minHeight:
            "90px",

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
              "8px",
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
          }}
        >
          {value}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          marginBottom:
            "18px",
        }}
      >
        <div
          style={{
            width:
              "92px",

            height:
              "92px",

            borderRadius:
              "50%",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              "rgba(109,255,78,0.10)",

            border:
              "1px solid rgba(109,255,78,0.20)",

            boxShadow:
              "0 0 24px rgba(109,255,78,0.12)",

            fontSize:
              "34px",

            fontWeight:
              800,
          }}
        >
          {currentUser?.name?.charAt(0)}
        </div>

        <div
          style={{
            fontSize:
              "24px",

            fontWeight:
              800,

            marginTop:
              "14px",
          }}
        >
          {currentUser?.name}
        </div>
      </div>

      <ProfileCard
        title="Role"

        value={
          currentUser?.role ===
          "admin"

            ? "👑 Admin"

            : "⚽ Player"
        }
      />

      <ProfileCard
        title="Points"

        value={points}
      />

      {currentUser?.role ===
        "admin" && (
        <button
          onClick={() =>
            navigate("/admin")
          }
          style={{
            width:
              "100%",

            height:
              "56px",

            border:
              "1px solid rgba(109,255,78,0.25)",

            borderRadius:
              "18px",

            background:
              "rgba(109,255,78,0.10)",

            color:
              "#FFFFFF",

            fontSize:
              "16px",

            fontWeight:
              800,

            cursor:
              "pointer",

            marginTop:
              "8px",

            marginBottom:
              "18px",

            boxShadow:
              "0 6px 18px rgba(109,255,78,0.12)",
          }}
        >
          👥 Manage Users
        </button>
      )}

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "center",

          marginTop:
            "22px",
        }}
      >
        <button
          onClick={logout}

          style={{
            width:
              "220px",

            height:
              "48px",

            border:
              "1px solid rgba(255,92,92,0.25)",

            borderRadius:
              "999px",

            background:
              "rgba(255,92,92,0.10)",

            backdropFilter:
              "blur(18px)",

            WebkitBackdropFilter:
              "blur(18px)",

            boxShadow:
              "0 6px 18px rgba(255,92,92,0.12)",

            color:
              "#FF6B6B",

            fontSize:
              "14px",

            fontWeight:
              700,

            cursor:
              "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Profile