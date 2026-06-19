import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { Crown } from "lucide-react"

import { supabase } from "../lib/supabase"
import {
  getFinishedPredictions,
  listPublicUsers,
} from "../lib/appApi"
import {
  rankedPlayers,
} from "../utils/scoring"
import PageHeader from "../components/PageHeader"
import type {
  Match,
  Matchday,
  Prediction,
  User,
} from "../types"

type Player = User & {
  points: number
  roundPoints: number
  movement: number
}

type Phase =
  | "regular"
  | "playoff"

function Leaderboard() {
  const [phase, setPhase] =
    useState<Phase>("regular")
  const [users, setUsers] =
    useState<User[]>([])
  const [predictions, setPredictions] =
    useState<Prediction[]>([])
  const [matches, setMatches] =
    useState<Match[]>([])
  const [matchdays, setMatchdays] =
    useState<Matchday[]>([])

  useEffect(() => {
    async function load() {
      const [
        loadedUsers,
        loadedPredictions,
        matchesResult,
        matchdaysResult,
      ] = await Promise.all([
        listPublicUsers(),
        getFinishedPredictions(),
        supabase
          .from("matches")
          .select("*"),
        supabase
          .from("matchdays")
          .select("*"),
      ])
      setUsers(loadedUsers)
      setPredictions(
        loadedPredictions
      )
      setMatches(
        (matchesResult.data ||
          []) as Match[]
      )
      setMatchdays(
        (matchdaysResult.data ||
          []) as Matchday[]
      )
    }
    load()
  }, [])

  const players = useMemo<
    Player[]
  >(() => {
    const phaseMatchdayIds =
      new Set(
        matchdays
          .filter((matchday) => {
            const playoff =
              matchday.name
                .toLowerCase()
                .includes(
                  "play-off"
                )
            return phase ===
              "playoff"
              ? playoff
              : !playoff
          })
          .map(
            (matchday) =>
              matchday.id
          )
      )
    const phaseMatches =
      matches.filter(
        (match) =>
          phaseMatchdayIds.has(
            match.matchday_id
          ) &&
          match.home_score !==
            null &&
          match.away_score !== null
      )
    const allIds = new Set(
      phaseMatches.map(
        (match) => match.id
      )
    )
    const latestMatchday =
      [...phaseMatches].sort(
        (a, b) =>
          new Date(
            b.kickoff
          ).getTime() -
          new Date(
            a.kickoff
          ).getTime()
      )[0]?.matchday_id
    const latestIds = new Set(
      phaseMatches
        .filter(
          (match) =>
            match.matchday_id ===
            latestMatchday
        )
        .map(
          (match) => match.id
        )
    )
    const previousIds = new Set(
      phaseMatches
        .filter(
          (match) =>
            !latestIds.has(
              match.id
            )
        )
        .map(
          (match) => match.id
        )
    )
    const total = rankedPlayers(
      users,
      predictions,
      matches,
      allIds
    )
    const round = rankedPlayers(
      users,
      predictions,
      matches,
      latestIds
    )
    const previous = rankedPlayers(
      users,
      predictions,
      matches,
      previousIds
    )

    return total.map(
      (player, index) => {
        const previousIndex =
          previous.findIndex(
            (item) =>
              item.id === player.id
          )
        return {
          ...player,
          roundPoints:
            round.find(
              (item) =>
                item.id ===
                player.id
            )?.points || 0,
          movement:
            previousIds.size === 0 ||
            previousIndex < 0
              ? 0
              : previousIndex -
                index,
        }
      }
    )
  }, [
    phase,
    users,
    predictions,
    matches,
    matchdays,
  ])

  const hasPhaseResults =
    useMemo(() => {
      const phaseIds = new Set(
        matchdays
          .filter((matchday) => {
            const playoff =
              matchday.name
                .toLowerCase()
                .includes(
                  "play-off"
                )
            return phase ===
              "playoff"
              ? playoff
              : !playoff
          })
          .map(
            (matchday) =>
              matchday.id
          )
      )
      return matches.some(
        (match) =>
          phaseIds.has(
            match.matchday_id
          ) &&
          match.home_score !==
            null &&
          match.away_score !== null
      )
    }, [
      phase,
      matches,
      matchdays,
    ])

  return (
    <div className="page">
      <PageHeader
        title="Ranking"
        subtitle="Separate standings for the regular season and play-off."
      />

      <div className="segmented">
        <button
          type="button"
          className={`segment ${
            phase === "regular"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setPhase("regular")
          }
        >
          Regular season
        </button>
        <button
          type="button"
          className={`segment ${
            phase === "playoff"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setPhase("playoff")
          }
        >
          Play-off
        </button>
      </div>

      {!hasPhaseResults ||
      players.length === 0 ? (
        <div className="surface empty-state">
          No ranking yet for this
          phase.
        </div>
      ) : (
        <>
          <div className="podium-grid">
            {players
              .slice(0, 3)
              .map(
                (
                  player,
                  index
                ) => (
                  <div
                    key={player.id}
                    className={`podium-card podium-${index + 1}`}
                  >
                    <span>
                      {index === 0
                        ? "👑"
                        : index === 1
                          ? "🥈"
                          : "🥉"}
                    </span>
                    <strong>
                      {player.name}
                    </strong>
                    <small>
                      {player.points}{" "}
                      pts
                    </small>
                  </div>
                )
              )}
          </div>

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
                        fontWeight:
                          850,
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
                          fontWeight:
                            800,
                        }}
                      >
                        {player.name}
                      </div>
                      <div
                        style={{
                          marginTop:
                            "2px",
                          color:
                            "#6B7280",
                          fontSize:
                            "9px",
                        }}
                      >
                        +
                        {
                          player.roundPoints
                        }{" "}
                        this matchday
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
                          marginLeft:
                            "4px",
                          color:
                            "#9CA3AF",
                          fontSize:
                            "9px",
                        }}
                      >
                        pts
                      </span>
                      <div
                        style={{
                          marginTop:
                            "2px",
                          color:
                            player.movement >
                            0
                              ? "#9CF989"
                              : player.movement <
                                  0
                                ? "#FF8585"
                                : "#6B7280",
                          fontSize:
                            "9px",
                          fontWeight:
                            800,
                        }}
                      >
                        {player.movement >
                        0
                          ? `↑ ${player.movement}`
                          : player.movement <
                              0
                            ? `↓ ${Math.abs(
                                player.movement
                              )}`
                            : "—"}
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Leaderboard
