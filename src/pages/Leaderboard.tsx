import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Crown } from "lucide-react"

import { supabase } from "../lib/supabase"
import {
  getAllPredictionsForAdmin,
  getFinishedPredictions,
  listPublicUsers,
} from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
import {
  predictionPoints,
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
  | "overall"
  | "regular"
  | "playoff"
  | "matchday"

function isPlayoffMatchday(
  matchday?: Matchday
) {
  if (!matchday) return false
  const name =
    matchday.name.toLowerCase()
  return (
    name.includes("play-off") ||
    name.includes("playoff")
  )
}

function Leaderboard() {
  const { currentUser } = useAuth()
  const [phase, setPhase] =
    useState<Phase>("overall")
  const [users, setUsers] =
    useState<User[]>([])
  const [predictions, setPredictions] =
    useState<Prediction[]>([])
  const [matches, setMatches] =
    useState<Match[]>([])
  const [matchdays, setMatchdays] =
    useState<Matchday[]>([])
  const [loading, setLoading] =
    useState(true)
  const [
    selectedMatchdayId,
    setSelectedMatchdayId,
  ] = useState("")

  const loadRankingPredictions =
    useCallback(async () => {
    if (currentUser) {
      try {
        return await getAllPredictionsForAdmin()
      } catch {
        return await getFinishedPredictions()
      }
    }

    return getFinishedPredictions()
  }, [currentUser])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [
        loadedUsers,
        loadedPredictions,
        matchesResult,
        matchdaysResult,
      ] = await Promise.all([
        listPublicUsers(),
        loadRankingPredictions(),
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
      setLoading(false)
    }
    load().catch(() => {
      setUsers([])
      setPredictions([])
      setMatches([])
      setMatchdays([])
      setLoading(false)
    })
  }, [
    currentUser,
    loadRankingPredictions,
  ])

  const players = useMemo<
    Player[]
  >(() => {
    const matchdayById =
      new Map(
        matchdays.map(
          (matchday) => [
            matchday.id,
            matchday,
          ]
        )
      )
    const matchBelongsToPhase =
      (match: Match) => {
        if (phase === "overall") {
          return true
        }

        if (phase === "matchday") {
          return selectedMatchdayId
            ? match.matchday_id ===
                selectedMatchdayId
            : false
        }

        const matchday =
          matchdayById.get(
            match.matchday_id
          )
        const playoff =
          isPlayoffMatchday(
            matchday
          )

        return phase ===
          "playoff"
          ? playoff
          : !playoff
      }
    const phaseMatches =
      matches.filter(
        (match) =>
          matchBelongsToPhase(
            match
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
    selectedMatchdayId,
    users,
    predictions,
    matches,
    matchdays,
  ])

  const hasPhaseResults =
    useMemo(() => {
      const matchdayById =
        new Map(
          matchdays.map(
            (matchday) => [
              matchday.id,
              matchday,
            ]
          )
        )
      const matchBelongsToPhase =
        (match: Match) => {
          if (phase === "overall") {
            return true
          }

          if (
            phase === "matchday"
          ) {
            return selectedMatchdayId
              ? match.matchday_id ===
                  selectedMatchdayId
              : false
          }

          const matchday =
            matchdayById.get(
              match.matchday_id
            )
          const playoff =
            isPlayoffMatchday(
              matchday
            )

          return phase ===
            "playoff"
            ? playoff
            : !playoff
        }

      return matches.some(
        (match) =>
          matchBelongsToPhase(
            match
          ) &&
          match.home_score !==
            null &&
          match.away_score !== null
      )
    }, [
      phase,
      selectedMatchdayId,
      matches,
      matchdays,
    ])

  const leadGap =
    players.length >= 2
      ? players[0].points -
        players[1].points
      : 0

  const finishedMatchdays =
    useMemo(
      () =>
        matchdays
          .filter((matchday) =>
            matches.some(
              (match) =>
                match.matchday_id ===
                  matchday.id &&
                match.home_score !==
                  null &&
                match.away_score !==
                  null
            )
          )
          .sort((a, b) =>
            b.name.localeCompare(
              a.name,
              undefined,
              { numeric: true }
            )
          ),
      [matchdays, matches]
    )

  useEffect(() => {
    if (
      phase === "matchday" &&
      !selectedMatchdayId &&
      finishedMatchdays[0]
    ) {
      setSelectedMatchdayId(
        finishedMatchdays[0].id
      )
    }
  }, [
    phase,
    selectedMatchdayId,
    finishedMatchdays,
  ])

  const latestMatchdaySummary =
    useMemo(() => {
      const scoredMatches = matches
        .filter(
          (match) =>
            match.home_score !==
              null &&
            match.away_score !== null
        )
        .sort(
          (a, b) =>
            new Date(
              b.kickoff
            ).getTime() -
            new Date(
              a.kickoff
            ).getTime()
        )
      const latestMatchdayId =
        scoredMatches[0]
          ?.matchday_id

      if (!latestMatchdayId) {
        return null
      }

      const latestMatches =
        scoredMatches.filter(
          (match) =>
            match.matchday_id ===
            latestMatchdayId
        )
      const latestIds = new Set(
        latestMatches.map(
          (match) => match.id
        )
      )
      const roundPlayers =
        rankedPlayers(
          users,
          predictions,
          matches,
          latestIds
        )
      const winner =
        roundPlayers[0]
      const runnerUp =
        roundPlayers[1]
      const matchday =
        matchdays.find(
          (item) =>
            item.id ===
            latestMatchdayId
        )

      if (!winner) {
        return null
      }

      const winnerExact =
        predictions.filter(
          (prediction) => {
            if (
              prediction.user_id !==
              winner.id ||
              !latestIds.has(
                prediction.match_id
              )
            ) {
              return false
            }
            const match =
              matches.find(
                (item) =>
                  item.id ===
                  prediction.match_id
              )
            return (
              match &&
              predictionPoints(
                prediction,
                match
              ) === 3
            )
          }
        ).length

      return {
        matchday:
          matchday?.name ||
          "Latest matchday",
        winner,
        runnerUp,
        winnerExact,
        matches:
          latestMatches.length,
      }
    }, [
      users,
      predictions,
      matches,
      matchdays,
    ])

  return (
    <div className="page">
      <PageHeader
        title="Ranking"
        subtitle="Overall, regular season and play-off standings."
      />

      <div className="segmented">
        <button
          type="button"
          className={`segment ${
            phase === "overall"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setPhase("overall")
          }
        >
          Overall
        </button>
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
        <button
          type="button"
          className={`segment ${
            phase === "matchday"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setPhase("matchday")
          }
        >
          By matchday
        </button>
      </div>

      {phase === "matchday" && (
        <select
          value={selectedMatchdayId}
          onChange={(event) =>
            setSelectedMatchdayId(
              event.target.value
            )
          }
          className="compact-select"
        >
          {finishedMatchdays.map(
            (matchday) => (
              <option
                key={matchday.id}
                value={matchday.id}
              >
                {matchday.name}
              </option>
            )
          )}
        </select>
      )}

      {loading ? (
        <div className="surface empty-state">
          Loading ranking...
        </div>
      ) : players.length === 0 ? (
        <div className="surface empty-state">
          No ranking yet for this
          phase.
        </div>
      ) : (
        <>
          {latestMatchdaySummary && (
            <div className="surface-soft matchday-summary-card">
              <span className="section-label">
                Latest matchday
              </span>
              <strong>
                {
                  latestMatchdaySummary.matchday
                }
              </strong>
              <div className="recap-chip-grid">
                <span>
                  <b>Winner</b>
                  {
                    latestMatchdaySummary
                      .winner.name
                  }
                </span>
                <span>
                  <b>Points</b>
                  {
                    latestMatchdaySummary
                      .winner.points
                  }
                </span>
                <span>
                  <b>Exact</b>
                  {
                    latestMatchdaySummary.winnerExact
                  }
                </span>
                <span>
                  <b>Gap</b>
                  {latestMatchdaySummary.runnerUp
                    ? latestMatchdaySummary.winner.points -
                        latestMatchdaySummary.runnerUp.points >
                      0
                      ? `+${latestMatchdaySummary.winner.points - latestMatchdaySummary.runnerUp.points}`
                      : "Level"
                    : `${latestMatchdaySummary.matches} games`}
                </span>
              </div>
            </div>
          )}
          {players[0] && (
            <div className="surface-soft lead-gap-card">
              <span className="section-label">
                Leader gap
              </span>
              <strong>
                {players[0].name}
                {players.length >= 2
                  ? leadGap > 0
                    ? ` leads by ${leadGap} pts`
                    : " is level at the top"
                  : " leads the table"}
              </strong>
            </div>
          )}
          {!hasPhaseResults && (
            <div className="surface-soft empty-state">
              No final scores yet for this
              phase. Players are shown
              with 0 pts.
            </div>
          )}
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
