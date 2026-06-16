import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

import CreateMatchdayForm from "../components/CreateMatchdayForm"

import AddMatchForm from "../components/AddMatchForm"

import FinalScoreForm from "../components/FinalScoreForm"

import type {
  Match,

  Matchday,
} from "../types"

function Matchdays() {
  const { currentUser } = useAuth()

  const [matchdays, setMatchdays] =
    useState<Matchday[]>([])

  const [matches, setMatches] =
    useState<Match[]>([])

  useEffect(() => {
    loadMatchdays()

    loadMatches()
  }, [])

  async function loadMatchdays() {
    const { data, error } =
      await supabase

        .from("matchdays")

        .select("*")

        .order("name")

    if (error) {
      console.log(error)

      return
    }

    if (data) {
      setMatchdays(
        data as Matchday[]
      )
    }
  }

  async function loadMatches() {
    const { data, error } =
      await supabase

        .from("matches")

        .select("*")

        .order("kickoff")

    if (error) {
      console.log(error)

      return
    }

    if (data) {
      setMatches(
        data as Match[]
      )
    }
  }

  async function addMatchday(
    name: string
  ) {
    const { error } =
      await supabase

        .from("matchdays")

        .insert([
          {
            name,
          },
        ])

    if (error) {
      console.log(error)

      alert(
        "Could not create Matchday"
      )

      return
    }

    await loadMatchdays()
  }

  async function addMatch(
    matchdayId: string,

    homeTeam: string,

    awayTeam: string,

    kickoff: string
  ) {
    const { error } =
      await supabase

        .from("matches")

        .insert([
          {
            matchday_id:
              matchdayId,

            home_team:
              homeTeam,

            away_team:
              awayTeam,

            kickoff,
          },
        ])

    if (error) {
      console.log(error)

      alert(
        "Could not create match"
      )

      return
    }

    await loadMatches()
  }

  async function saveFinalScore(
    matchId: string,

    homeScore: number,

    awayScore: number
  ) {
    const { error } =
      await supabase

        .from("matches")

        .update({
          home_score:
            homeScore,

          away_score:
            awayScore,
        })

        .eq(
          "id",

          matchId
        )

    if (error) {
      console.log(error)

      alert(
        "Could not save score"
      )

      return
    }

    await loadMatches()

    alert(
      "Final score saved ✅"
    )
  }

  async function closeMatchday(
    matchdayId: string
  ) {
    const { error } =
      await supabase

        .from("matchdays")

        .update({
          is_open: false,
        })

        .eq(
          "id",

          matchdayId
        )

    if (error) {
      console.log(error)

      alert(
        "Could not close Matchday"
      )

      return
    }

    await loadMatchdays()

    alert(
      "Matchday closed 🔒"
    )
  }

  function formatKickoff(
    kickoff: string
  ) {
    return new Date(
      kickoff
    ).toLocaleString(
      "ro-RO",

      {
        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",
      }
    )
  }

  function getMatchStatus(
    match: Match
  ) {
    if (
      match.home_score !==
        null &&

      match.away_score !==
        null
    ) {
      return "🟢 Finished"
    }

    return "🟡 Upcoming"
  }

  function getMatchCount(
    matchdayId: string
  ) {
    return matches.filter(
      (match) =>
        match.matchday_id ===
        matchdayId
    ).length
  }

  return (
    <div>
      <h2>
        ⚽ Matchdays
      </h2>

      {currentUser?.role ===
        "admin" && (
        <CreateMatchdayForm
          onCreate={
            addMatchday
          }
        />
      )}

      <div
        style={{
          marginTop:
            "20px",
        }}
      >
        {matchdays.map(
          (matchday) => (
            <div
              key={
                matchday.id
              }
              style={{
                backgroundColor:
                  "#1E1E1E",

                border:
                  "1px solid #2A2A2A",

                borderRadius:
                  "12px",

                padding:
                  "16px",

                marginBottom:
                  "16px",
              }}
            >
              <h3>
                ⚽{" "}

                {
                  matchday.name
                }
              </h3>

              <div>
                {matchday.is_open
                  ? "🟢 Open"

                  : "🔴 Closed"}
              </div>

              <div
                style={{
                  marginTop:
                    "6px",

                  color:
                    "#AAAAAA",

                  fontSize:
                    "14px",
                }}
              >
                ⚽{" "}

                {getMatchCount(
                  matchday.id
                )}{" "}

                matches
              </div>

              {currentUser?.role ===
                "admin" &&

                matchday.is_open && (
                  <button
                    style={{
                      marginTop:
                        "12px",

                      marginBottom:
                        "12px",
                    }}

                    onClick={() =>
                      closeMatchday(
                        matchday.id
                      )
                    }
                  >
                    🔒 Close Matchday
                  </button>
                )}

              {currentUser?.role ===
                "admin" &&

                matchday.is_open && (
                  <AddMatchForm
                    matchdayId={
                      matchday.id
                    }

                    onCreate={
                      addMatch
                    }
                  />
                )}

              <div
                style={{
                  marginTop:
                    "16px",
                }}
              >
                {matches

                  .filter(
                    (match) =>
                      match.matchday_id ===
                      matchday.id
                  )

                  .map(
                    (match) => (
                      <div
                        key={
                          match.id
                        }
                        style={{
                          backgroundColor:
                            "#121212",

                          padding:
                            "12px",

                          borderRadius:
                            "10px",

                          marginBottom:
                            "12px",
                        }}
                      >
                        <div>
                          ⚽{" "}

                          {
                            match.home_team
                          }

                          {" - "}

                          {
                            match.away_team
                          }
                        </div>

                        <div
                          style={{
                            marginTop:
                              "6px",

                            fontSize:
                              "14px",

                            color:
                              "#AAAAAA",
                          }}
                        >
                          {getMatchStatus(
                            match
                          )}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "6px",

                            fontSize:
                              "14px",

                            color:
                              "#AAAAAA",
                          }}
                        >
                          🕒{" "}

                          {formatKickoff(
                            match.kickoff
                          )}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "8px",
                          }}
                        >
                          Final score:

                          {" "}

                          {match.home_score ??
                            "-"}

                          {" - "}

                          {match.away_score ??
                            "-"}
                        </div>

                        {currentUser?.role ===
                          "admin" && (
                          <FinalScoreForm
                            matchId={
                              match.id
                            }

                            currentHomeScore={
                              match.home_score
                            }

                            currentAwayScore={
                              match.away_score
                            }

                            onSave={
                              saveFinalScore
                            }
                          />
                        )}
                      </div>
                    )
                  )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default Matchdays