import { useEffect, useState } from "react"

import {
  ChevronDown,

  ChevronUp,
} from "lucide-react"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

import CreateMatchdayForm from "../components/CreateMatchdayForm"

import AddMatchForm from "../components/AddMatchForm"

import FinalScoreForm from "../components/FinalScoreForm"

import ImportMatchesForm from "../components/ImportMatchesForm"

import type {
  Match,

  Matchday,
} from "../types"

function Matchdays() {
  const { currentUser } =
    useAuth()

  const [matchdays, setMatchdays] =
    useState<Matchday[]>([])

  const [matches, setMatches] =
    useState<Match[]>([])

  const [
    expandedMatchdays,

    setExpandedMatchdays,
  ] = useState<

  
    Record<string, boolean>
  >({})

  useEffect(() => {
    loadMatchdays()

    loadMatches()
  }, [])

  async function loadMatchdays() {
    const { data } =
      await supabase

        .from("matchdays")

        .select("*")

        .order("name")

    if (data)
      setMatchdays(
        data as Matchday[]
      )
  }

  async function loadMatches() {
    const { data } =
      await supabase

        .from("matches")

        .select("*")

        .order("kickoff")

    if (data)
      setMatches(
        data as Match[]
      )
  }

  async function addMatchday(
    name: string
  ) {
    const {error}=
    await supabase

      .from("matchdays")

      .insert([
        { 
          name,
        
          is_open:true,
        },
      ])
    if (error) {
      console.log(error)
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

    loadMatches()
  }

  async function saveFinalScore(
    matchId: string,

    homeScore: number,

    awayScore: number
  ) {
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

    loadMatches()
  }

  async function closeMatchday(
    matchdayId: string
  ) {
    await supabase

      .from("matchdays")

      .update({
        is_open: false,
      })

      .eq(
        "id",

        matchdayId
      )

    loadMatchdays()
  }

  function toggleMatchday(
    id: string
  ) {
    setExpandedMatchdays(
      (prev) => ({
        ...prev,

        [id]:
          !prev[id],
      })
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

        hour: "2-digit",

        minute: "2-digit",
      }
    )
  }

  function getMatchCount(
    id: string
  ) {
    return matches.filter(
      (match) =>
        match.matchday_id ===
        id
    ).length
  }

  return (
        <div>
      {currentUser?.role ===
        "admin" && (
        <CreateMatchdayForm
          onCreate={
            addMatchday
          }
        />
      )}

      {matchdays.map(
        (matchday) => {
          const expanded =
            expandedMatchdays[
              matchday.id
            ]

          return (
            <div
              key={
                matchday.id
              }

              style={{
                background:
                  "rgba(255,255,255,0.05)",

                border:
                  "1px solid rgba(255,255,255,0.08)",

                borderRadius:
                  "22px",

                padding:
                  "18px",

                marginBottom:
                  "14px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize:
                        "20px",

                      fontWeight:
                        700,
                    }}
                  >
                    {
                      matchday.name
                    }
                  </div>

                  <div
                    style={{
                      color:
                        "#9CA3AF",

                      fontSize:
                        "12px",

                      marginTop:
                        "4px",
                    }}
                  >
                    {getMatchCount(
                      matchday.id
                    )}{" "}

                    matches
                  </div>
                </div>

                <div
                  style={{
                    background:
                      matchday.is_open

                        ? "#6DFF4E"

                        : "#FF5C5C",

                    color:
                      "#05080F",

                    padding:
                      "6px 12px",

                    borderRadius:
                      "999px",

                    fontSize:
                      "11px",

                    fontWeight:
                      700,
                  }}
                >
                  {matchday.is_open

                    ? "OPEN"

                    : "CLOSED"}
                </div>
              </div>

              {!matchday.is_open && (
                <button
                  onClick={() =>
                    toggleMatchday(
                      matchday.id
                    )
                  }

                  style={{
                    marginTop:
                      "14px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap: "8px",

                    border:
                      "none",

                    background:
                      "transparent",

                    color:
                      "#9CA3AF",

                    padding: 0,

                    fontSize:
                      "13px",
                  }}
                >
                  {expanded ? (
                    <>
                      <ChevronUp
                        size={16}
                      />

                      Hide results
                    </>
                  ) : (
                    <>
                      <ChevronDown
                        size={16}
                      />

                      View results
                    </>
                  )}
                </button>
              )}

              {currentUser?.role ===
                "admin" &&

                matchday.is_open && (
                  <>
                    <button
                      onClick={() =>
                        closeMatchday(
                          matchday.id
                        )
                      }

                      style={{
                        width:
                          "100%",

                        height:
                          "44px",

                        border:
                          "none",

                        borderRadius:
                          "14px",

                        background:
                          "#FF5C5C",

                        color:
                          "white",

                        fontWeight:
                          700,

                        fontSize:
                          "14px",

                        margin:
                          "16px 0",
                      }}
                    >
                      Close Matchday
                    </button>

                    <AddMatchForm
                      matchdayId={
                        matchday.id
                      }

                      onCreate={
                        addMatch
                      }
                    />
                    <ImportMatchesForm
                      matchdayId={
                        matchday.id
                      }

                      onImported={
                        loadMatches
                      }
                    />
                  </>
                )}

              {(matchday.is_open ||

                expanded) &&

                matches

                  .filter(
                    (match) =>
                      match.matchday_id ===
                      matchday.id
                  )

                  .map(
                    (match) => {
                      const finished =
                        match.home_score !==
                          null &&

                        match.away_score !==
                          null

                      return (
                                                <div
                          key={
                            match.id
                          }

                          style={{
                            borderTop:
                              "1px solid rgba(255,255,255,0.08)",

                            padding:
                              "12px 0",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "space-between",

                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,

                                fontSize:
                                  "15px",

                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                match.home_team
                              }
                            </div>

                            <div
                              style={{
                                width:
                                  "90px",

                                display:
                                  "flex",

                                flexDirection:
                                  "column",

                                alignItems:
                                  "center",
                              }}
                            >
                              {finished && (
                                <div
                                  style={{
                                    minWidth:
                                      "74px",

                                    height:
                                      "34px",

                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    justifyContent:
                                      "center",

                                    border:
                                      "1px solid rgba(255,255,255,0.08)",

                                    borderRadius:
                                      "12px",

                                    fontSize:
                                      "18px",

                                    fontWeight:
                                      700,

                                    background:
                                      "rgba(255,255,255,0.03)",
                                  }}
                                >
                                  {
                                    match.home_score
                                  }

                                  {" - "}

                                  {
                                    match.away_score
                                  }
                                </div>
                              )}

                              {!finished && (
                                <>
                                  <div
                                    style={{
                                      fontSize:
                                        "11px",

                                      color:
                                        "#9CA3AF",

                                      marginTop:
                                        "6px",
                                    }}
                                  >
                                    {formatKickoff(
                                      match.kickoff
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        "#60A5FA",

                                      fontSize:
                                        "10px",

                                      fontWeight:
                                        700,

                                      marginTop:
                                        "4px",
                                    }}
                                  >
                                    UPCOMING
                                  </div>
                                </>
                              )}
                            </div>

                            <div
                              style={{
                                flex: 1,

                                textAlign:
                                  "right",

                                fontSize:
                                  "15px",

                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                match.away_team
                              }
                            </div>
                          </div>

                          {currentUser?.role ===
                            "admin" &&

                            !finished && (
                              <div
                                style={{
                                  marginTop:
                                    "12px",
                                }}
                              >
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
                              </div>
                            )}
                        </div>
                      )
                    }
                  )}
            </div>
          )
        }
      )}
    </div>
  )
}

export default Matchdays
