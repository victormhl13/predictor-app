import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "../lib/supabase"
import {
  getMyPredictions,
  getLockedPredictions,
  listPublicUsers,
  saveMyPredictions,
} from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
import PageHeader from "../components/PageHeader"
import ScorePairControl from "../components/ScorePairControl"
import TeamBadge from "../components/TeamBadge"
import Countdown from "../components/Countdown"
import SkeletonList from "../components/SkeletonList"
import type {
  Match,
  Matchday,
  Prediction,
  User,
} from "../types"
import {
  formatDualKickoffTime,
} from "../utils/time"

type Draft = {
  home: number | ""
  away: number | ""
  saved: boolean
}

function buildDrafts(
  matches: Match[],
  predictions: Prediction[]
) {
  const loaded: Record<
    string,
    Draft
  > = {}

  matches.forEach((match) => {
    loaded[match.id] = {
      home: "",
      away: "",
      saved: false,
    }
  })

  predictions.forEach(
    (prediction) => {
      loaded[prediction.match_id] = {
        home:
          prediction.home_prediction,
        away:
          prediction.away_prediction,
        saved: true,
      }
    }
  )

  return loaded
}

function isLikelyTbaKickoff(
  kickoff: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/Bucharest",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).formatToParts(
      new Date(kickoff)
    )
  const hour =
    parts.find(
      (part) =>
        part.type === "hour"
    )?.value
  const minute =
    parts.find(
      (part) =>
        part.type === "minute"
    )?.value

  return (
    hour === "12" &&
    minute === "00"
  )
}

function isFinished(
  match: Match
) {
  return (
    match.home_score !== null &&
    match.away_score !== null
  )
}

function isMatchLocked(
  match: Match
) {
  if (isFinished(match)) {
    return true
  }

  const lockDate = new Date(
    match.kickoff
  )

  if (
    isLikelyTbaKickoff(
      match.kickoff
    )
  ) {
    lockDate.setHours(
      23,
      59,
      59,
      999
    )
  }

  return (
    lockDate <= new Date()
  )
}

function MyPredictions() {
  const { currentUser } = useAuth()
  const [matches, setMatches] =
    useState<Match[]>([])
  const [
    matchdays,
    setMatchdays,
  ] = useState<Matchday[]>([])
  const [drafts, setDrafts] =
    useState<Record<string, Draft>>(
      {}
    )
  const [filter, setFilter] =
    useState<
      | "open"
      | "locked"
      | "others"
    >("open")
  const [saving, setSaving] =
    useState(false)
  const [notice, setNotice] =
    useState("")
  const [loading, setLoading] =
    useState(true)
  const [
    lockedPredictions,
    setLockedPredictions,
  ] = useState<Prediction[]>([])
  const [players, setPlayers] =
    useState<User[]>([])
  const [dirtyIds, setDirtyIds] =
    useState<Set<string>>(
      () => new Set()
    )
  const [
    editingIds,
    setEditingIds,
  ] = useState<Set<string>>(
    () => new Set()
  )
  const [
    expandedMatchdayIds,
    setExpandedMatchdayIds,
  ] = useState<Set<string>>(
    () => new Set()
  )

  useEffect(() => {
    if (!currentUser) return
    const refreshLocked =
      async () => {
        const data =
          await getLockedPredictions()
        setLockedPredictions(
          data
        )
      }
    const interval =
      window.setInterval(
        () => {
          refreshLocked().catch(
            () => undefined
          )
        },
        60_000
      )
    return () =>
      window.clearInterval(
        interval
      )
  }, [currentUser])

  useEffect(() => {
    async function load() {
      const [
        matchesResult,
        matchdaysResult,
      ] = await Promise.all([
        supabase
          .from("matches")
          .select("*")
          .order("kickoff"),
        supabase
          .from("matchdays")
          .select("*")
          .order("name"),
      ])

      const loadedMatches =
        (matchesResult.data ||
          []) as Match[]

      setMatches(
        loadedMatches
      )
      setMatchdays(
        (matchdaysResult.data ||
          []) as Matchday[]
      )

      if (!currentUser) return

      const [
        predictionData,
        publicPredictions,
        publicUsers,
      ] = await Promise.all([
        getMyPredictions(),
        getLockedPredictions(),
        listPublicUsers(),
      ])
      setLockedPredictions(
        publicPredictions
      )
      setPlayers(publicUsers)

      setDrafts(
        buildDrafts(
          loadedMatches,
          predictionData as Prediction[]
        )
      )
      setLoading(false)
    }

    load().catch(() =>
      setLoading(false)
    )
  }, [currentUser])

  function update(
    matchId: string,
    side: "home" | "away",
    value: number
  ) {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        home:
          current[matchId]?.home ??
          0,
        away:
          current[matchId]?.away ??
          0,
        saved: false,
        [side]: value,
      },
    }))
    setDirtyIds((current) => {
      const next = new Set(
        current
      )
      next.add(matchId)
      return next
    })
  }

  function applyQuickScore(
    matchId: string,
    home: number,
    away: number
  ) {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        home,
        away,
        saved: false,
      },
    }))
    setDirtyIds((current) => {
      const next = new Set(
        current
      )
      next.add(matchId)
      return next
    })
  }

  async function savePredictions() {
    if (!currentUser) return

    const changed = matches.filter(
      (match) => {
        const draft =
          drafts[match.id]
        return (
          !isMatchLocked(match) &&
          dirtyIds.has(match.id) &&
          typeof draft?.home ===
            "number" &&
          typeof draft?.away ===
            "number"
        )
      }
    )

    if (changed.length === 0) {
      setNotice(
        "Nothing new to save."
      )
      return
    }

    setSaving(true)

    try {
      await saveMyPredictions(
        changed.map((match) => {
          const draft =
            drafts[match.id]
          return {
            match_id: match.id,
            home: Number(
              draft?.home ?? 0
            ),
            away: Number(
              draft?.away ?? 0
            ),
          }
        })
      )
      const refreshedPredictions =
        (await getMyPredictions()) as Prediction[]
      setDrafts(
        buildDrafts(
          matches,
          refreshedPredictions
        )
      )
      setDirtyIds(new Set())
      setEditingIds(new Set())
    } catch (error) {
      setSaving(false)
      const message =
        error &&
        typeof error === "object" &&
        "message" in error
          ? String(
              (
                error as {
                  message?: unknown
                }
              ).message
            )
          : "Could not save predictions."
      setNotice(
        message.includes(
          "locked"
        ) ||
          message.includes(
            "invalid"
          )
          ? "This match is already locked. Refresh matches and try another open match."
          : message
      )
      return
    }

    setSaving(false)
    setNotice(
      `${changed.length} prediction${
        changed.length === 1
          ? ""
          : "s"
      } saved.`
    )
    window.setTimeout(
      () => setNotice(""),
      2400
    )
  }

  const visibleMatches = useMemo(
    () =>
      matches.filter((match) =>
        filter === "locked"
          ? isMatchLocked(match)
          : !isMatchLocked(match)
      ),
    [matches, filter]
  )
  const openMatches = matches.filter(
    (match) =>
      !isMatchLocked(match)
  )
  const completed = openMatches.filter(
    (match) => {
      const draft = drafts[match.id]
      return (
        draft?.saved &&
        typeof draft?.home ===
          "number" &&
        typeof draft?.away ===
          "number"
      )
    }
  ).length
  const otherPredictionsByMatchId =
    useMemo(() => {
      const grouped = new Map<
        string,
        Prediction[]
      >()

      lockedPredictions
        .filter(
          (prediction) =>
            prediction.user_id !==
            currentUser?.id
        )
        .forEach(
          (prediction) => {
            const existing =
              grouped.get(
                prediction.match_id
              ) || []
            grouped.set(
              prediction.match_id,
              [
                ...existing,
                prediction,
              ]
            )
          }
        )

      return grouped
    }, [
      lockedPredictions,
      currentUser?.id,
    ])
  const matchdayPredictionGroups =
    useMemo(
      () =>
        matchdays
          .map((matchday) => {
            const groupMatches =
              matches.filter(
                (match) =>
                  match.matchday_id ===
                  matchday.id
              )
            const predictionCount =
              groupMatches.reduce(
                (total, match) =>
                  total +
                  (
                    otherPredictionsByMatchId.get(
                      match.id
                    ) || []
                  ).length,
                0
              )

            return {
              matchday,
              matches: groupMatches,
              predictionCount,
            }
          })
          .filter(
            (group) =>
              group.matches.length > 0
          ),
      [
        matchdays,
        matches,
        otherPredictionsByMatchId,
      ]
    )
  const hasUnsavedChanges =
    dirtyIds.size > 0

  function toggleMatchday(
    matchdayId: string
  ) {
    setExpandedMatchdayIds(
      (current) => {
        const next = new Set(
          current
        )
        if (next.has(matchdayId)) {
          next.delete(matchdayId)
        } else {
          next.add(matchdayId)
        }
        return next
      }
    )
  }

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return
    }

    const beforeUnload = (
      event: BeforeUnloadEvent
    ) => {
      event.preventDefault()
      event.returnValue = ""
    }
    const confirmNavigation = (
      event: MouseEvent
    ) => {
      const target =
        event.target as
          | HTMLElement
          | null
      const link =
        target?.closest("a[href]")
      if (!link) return
      const href =
        link.getAttribute("href")
      if (
        !href ||
        href ===
          window.location.pathname
      ) {
        return
      }
      if (
        !window.confirm(
          "You have unsaved predictions. Leave this page anyway?"
        )
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const confirmBack = () => {
      if (
        !window.confirm(
          "You have unsaved predictions. Leave this page anyway?"
        )
      ) {
        window.history.forward()
      }
    }

    window.addEventListener(
      "beforeunload",
      beforeUnload
    )
    document.addEventListener(
      "click",
      confirmNavigation,
      true
    )
    window.addEventListener(
      "popstate",
      confirmBack
    )
    return () => {
      window.removeEventListener(
        "beforeunload",
        beforeUnload
      )
      document.removeEventListener(
        "click",
        confirmNavigation,
        true
      )
      window.removeEventListener(
        "popstate",
        confirmBack
      )
    }
  }, [hasUnsavedChanges])

  function formatKickoff(
    kickoff: string
  ) {
    return formatDualKickoffTime(
      kickoff,
      {
        timeTba:
          isLikelyTbaKickoff(
            kickoff
          ),
      }
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="Predictions"
        subtitle="Set your score before kickoff."
      />

      <div className="segmented">
        <button
          type="button"
          className={`segment ${
            filter === "open"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setFilter("open")
          }
        >
          Open
        </button>
        <button
          type="button"
          className={`segment ${
            filter === "locked"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setFilter("locked")
          }
        >
          Locked
        </button>
        <button
          type="button"
          className={`segment ${
            filter === "others"
              ? "segment-active"
              : ""
          }`}
          onClick={() =>
            setFilter("others")
          }
        >
          Others
        </button>
      </div>

      {filter === "open" && (
        <div
          className="surface-soft"
          style={{
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              color: "#9CA3AF",
              fontSize: "10px",
            }}
          >
            <span>
              Predictions completed
            </span>
            <strong
              style={{
                color: "#FFFFFF",
              }}
            >
              {completed}/
              {openMatches.length}
            </strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${
                  openMatches.length
                    ? (completed /
                        openMatches.length) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {filter === "others" ? (
        loading ? (
          <SkeletonList rows={4} />
        ) : matchdayPredictionGroups
            .length === 0 ? (
          <div className="surface empty-state">
            No matchdays yet.
          </div>
        ) : (
          <div
            className="surface"
            style={{
              overflow: "hidden",
            }}
          >
            {matchdayPredictionGroups.map(
              ({
                matchday,
                matches:
                  groupMatches,
                predictionCount,
              }) => {
                const expanded =
                  expandedMatchdayIds.has(
                    matchday.id
                  )

                return (
                  <div
                    key={matchday.id}
                    style={{
                      borderBottom:
                        "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleMatchday(
                          matchday.id
                        )
                      }
                      style={{
                        width: "100%",
                        border: 0,
                        background:
                          "transparent",
                        color:
                          "#FFFFFF",
                        padding:
                          "14px 12px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        textAlign:
                          "left",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "13px",
                            letterSpacing:
                              "0.2px",
                          }}
                        >
                          {
                            matchday.name
                          }
                        </strong>
                        <span
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            color:
                              "#9CA3AF",
                            fontSize:
                              "10px",
                          }}
                        >
                          {
                            predictionCount
                          } visible prediction
                          {predictionCount ===
                          1
                            ? ""
                            : "s"}
                        </span>
                      </div>
                      <span
                        style={{
                          color:
                            "#9CF989",
                          fontSize:
                            "18px",
                          lineHeight: 1,
                          transform:
                            expanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition:
                            "transform 160ms ease",
                        }}
                      >
                        ⌄
                      </span>
                    </button>

                    {expanded && (
                      <div
                        style={{
                          padding:
                            "0 12px 13px",
                          display:
                            "grid",
                          gap: "10px",
                        }}
                      >
                        {predictionCount ===
                        0 ? (
                          <div
                            style={{
                              color:
                                "#9CA3AF",
                              fontSize:
                                "11px",
                              padding:
                                "10px 0 2px",
                            }}
                          >
                            No visible predictions
                            yet. They appear after
                            the match is locked.
                          </div>
                        ) : (
                          groupMatches.map(
                            (match) => {
                              const predictions =
                                otherPredictionsByMatchId.get(
                                  match.id
                                ) || []

                              if (
                                predictions.length ===
                                0
                              ) {
                                return null
                              }

                              return (
                                <div
                                  key={
                                    match.id
                                  }
                                  style={{
                                    border:
                                      "1px solid rgba(255,255,255,0.075)",
                                    borderRadius:
                                      "18px",
                                    background:
                                      "rgba(5, 11, 20, 0.38)",
                                    padding:
                                      "11px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "grid",
                                      gridTemplateColumns:
                                        "1fr auto 1fr",
                                      alignItems:
                                        "center",
                                      gap: "8px",
                                      color:
                                        "#FFFFFF",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        850,
                                      lineHeight:
                                        1.25,
                                    }}
                                  >
                                    <span
                                      style={{
                                        minWidth: 0,
                                        overflowWrap:
                                          "anywhere",
                                      }}
                                    >
                                      {
                                        match.home_team
                                      }
                                    </span>
                                    <span
                                      style={{
                                        color:
                                          "#6B7280",
                                        fontSize:
                                          "9px",
                                      }}
                                    >
                                      VS
                                    </span>
                                    <span
                                      style={{
                                        minWidth: 0,
                                        textAlign:
                                          "right",
                                        overflowWrap:
                                          "anywhere",
                                      }}
                                    >
                                      {
                                        match.away_team
                                      }
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      marginTop:
                                        "9px",
                                      display:
                                        "grid",
                                      gap: "7px",
                                    }}
                                  >
                                    {predictions.map(
                                      (
                                        prediction
                                      ) => (
                                        <div
                                          key={
                                            prediction.id
                                          }
                                          className="community-prediction-row"
                                        >
                                          <span>
                                            {players.find(
                                              (
                                                player
                                              ) =>
                                                player.id ===
                                                prediction.user_id
                                            )
                                              ?.name ||
                                              "Player"}
                                          </span>
                                          <strong>
                                            {
                                              prediction.home_prediction
                                            }
                                            –
                                            {
                                              prediction.away_prediction
                                            }
                                          </strong>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )
                            }
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>
        )
      ) : loading ? (
        <SkeletonList rows={4} />
      ) : visibleMatches.length ===
      0 ? (
        <div className="surface empty-state">
          {filter === "open"
            ? "No open matches. Matches with a final score move to Locked."
            : "No matches in this view."}
        </div>
      ) : (
        <div
          className="surface"
          style={{
            overflow: "hidden",
          }}
        >
          {visibleMatches.map(
            (match) => {
              const locked =
                isMatchLocked(match)
              const draft =
                drafts[match.id]
              const missing =
                !locked &&
                !draft?.saved
              const isEditing =
                editingIds.has(
                  match.id
                )
              const canSave =
                dirtyIds.has(
                  match.id
                ) &&
                typeof draft?.home ===
                  "number" &&
                typeof draft?.away ===
                  "number"

              return (
                <div
                  key={match.id}
                  style={{
                    padding:
                      "13px 12px",
                    borderBottom:
                      "1px solid rgba(255,255,255,0.055)",
                    background: missing
                      ? "linear-gradient(90deg, rgba(248,212,119,0.08), transparent)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr auto 1fr",
                      alignItems:
                        "center",
                      gap: "7px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "7px",
                        minWidth: 0,
                      }}
                    >
                      <TeamBadge
                        name={
                          match.home_team
                        }
                        logo={
                          match.home_team_logo
                        }
                        size={30}
                      />
                      <strong
                        style={{
                          minWidth: 0,
                          fontSize:
                            "11px",
                          lineHeight:
                            1.25,
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {
                          match.home_team
                        }
                      </strong>
                    </div>
                    <div
                      style={{
                        color:
                          "#9CA3AF",
                        fontSize: "9px",
                        fontWeight: 750,
                        textAlign:
                          "center",
                      }}
                    >
                      {formatKickoff(
                        match.kickoff
                      )}
                      <div
                        style={{
                          marginTop:
                            "3px",
                        }}
                      >
                        <Countdown
                          kickoff={
                            match.kickoff
                          }
                        />
                      </div>
                      {match.rescheduled_at && (
                        <div
                          style={{
                            marginTop:
                              "3px",
                            color:
                              "#F8D477",
                            fontSize:
                              "7px",
                            fontWeight:
                              850,
                          }}
                        >
                          RESCHEDULED
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "flex-end",
                        gap: "7px",
                        minWidth: 0,
                        textAlign:
                          "right",
                      }}
                    >
                      <strong
                        style={{
                          minWidth: 0,
                          fontSize:
                            "11px",
                          lineHeight:
                            1.25,
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {
                          match.away_team
                        }
                      </strong>
                      <TeamBadge
                        name={
                          match.away_team
                        }
                        logo={
                          match.away_team_logo
                        }
                        size={30}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "13px",
                    }}
                  >
                    {locked ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            isFinished(match)
                              ? "1fr 1fr"
                              : "1fr",
                          gap: "9px",
                        }}
                      >
                        <div
                          style={{
                            padding:
                              "10px 11px",
                            border:
                              "1px solid rgba(255,255,255,0.07)",
                            borderRadius:
                              "15px",
                            background:
                              "rgba(255,255,255,0.045)",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "block",
                              color:
                                "#9CA3AF",
                              fontSize:
                                "8px",
                              fontWeight:
                                850,
                              letterSpacing:
                                "0.7px",
                              textTransform:
                                "uppercase",
                            }}
                          >
                            Your prediction
                          </span>
                          <strong
                            style={{
                              display:
                                "block",
                              marginTop:
                                "4px",
                              color:
                                draft?.saved
                                  ? "#FFFFFF"
                                  : "#9CA3AF",
                              fontSize:
                                "18px",
                              fontWeight:
                                850,
                            }}
                          >
                            {draft?.saved
                              ? `${draft.home} – ${draft.away}`
                              : "No prediction"}
                          </strong>
                        </div>

                        {isFinished(match) && (
                          <div
                            style={{
                              padding:
                                "10px 11px",
                              border:
                                "1px solid rgba(156,249,137,0.16)",
                              borderRadius:
                                "15px",
                              background:
                                "rgba(109,255,78,0.07)",
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "block",
                                color:
                                  "#9CF989",
                                fontSize:
                                  "8px",
                                fontWeight:
                                  850,
                                letterSpacing:
                                  "0.7px",
                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Final score
                            </span>
                            <strong
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "4px",
                                color:
                                  "#FFFFFF",
                                fontSize:
                                  "18px",
                                fontWeight:
                                  850,
                              }}
                            >
                              {match.home_score} –{" "}
                              {match.away_score}
                            </strong>
                          </div>
                        )}
                      </div>
                    ) : draft?.saved &&
                      !isEditing ? (
                      <div className="saved-prediction-summary">
                        <div>
                          <span>
                            Your prediction
                          </span>
                          <strong>
                            {draft.home} –{" "}
                            {draft.away}
                          </strong>
                        </div>
                        <button
                          type="button"
                          className="glass-button"
                          onClick={() =>
                            setEditingIds(
                              (
                                current
                              ) => {
                                const next =
                                  new Set(
                                    current
                                  )
                                next.add(
                                  match.id
                                )
                                return next
                              }
                            )
                          }
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <>
                      <ScorePairControl
                        home={Number(
                          draft?.home ??
                            0
                        )}
                        away={Number(
                          draft?.away ??
                            0
                        )}
                        onChange={(
                          side,
                          value
                        ) =>
                          update(
                            match.id,
                            side,
                            value
                          )
                        }
                      />
                      <div className="quick-scores">
                        {[
                          [0, 0],
                          [1, 0],
                          [1, 1],
                          [2, 1],
                          [2, 0],
                        ].map(
                          ([
                            home,
                            away,
                          ]) => (
                            <button
                              key={`${home}-${away}`}
                              type="button"
                              onClick={() =>
                                applyQuickScore(
                                  match.id,
                                  home,
                                  away
                                )
                              }
                              className={
                                Number(
                                  draft?.home ??
                                    0
                                ) === home &&
                                Number(
                                  draft?.away ??
                                    0
                                ) === away
                                  ? "quick-score-active"
                                  : ""
                              }
                            >
                              {home}–{away}
                            </button>
                          )
                        )}
                      </div>
                      </>
                    )}
                  </div>

                  {!locked &&
                    draft?.saved &&
                    !isEditing && (
                      <div
                        style={{
                          marginTop:
                            "7px",
                          color:
                            "#9CF989",
                          fontSize:
                            "9px",
                          fontWeight:
                            800,
                          textAlign:
                            "center",
                        }}
                      >
                        SAVED
                      </div>
                    )}
                  {missing && (
                    <div
                      style={{
                        marginTop:
                          "7px",
                        color:
                          "#F8D477",
                        fontSize:
                          "9px",
                        fontWeight:
                          800,
                        textAlign:
                          "center",
                      }}
                    >
                      {canSave
                        ? "UNSAVED CHANGES"
                        : "NO PREDICTION YET"}
                    </div>
                  )}
                  {locked && (
                    <div className="community-predictions">
                      <div className="section-label">
                        Everyone's predictions
                      </div>
                      {lockedPredictions
                        .filter(
                          (prediction) =>
                            prediction.match_id ===
                            match.id
                        )
                        .map(
                          (prediction) => (
                            <div
                              key={
                                prediction.id
                              }
                              className="community-prediction-row"
                            >
                              <span>
                                {players.find(
                                  (player) =>
                                    player.id ===
                                    prediction.user_id
                                )?.name ||
                                  "Player"}
                              </span>
                              <strong>
                                {
                                  prediction.home_prediction
                                }
                                –
                                {
                                  prediction.away_prediction
                                }
                              </strong>
                            </div>
                          )
                        )}
                      {lockedPredictions.filter(
                        (prediction) =>
                          prediction.match_id ===
                          match.id
                      ).length === 0 && (
                        <div
                          style={{
                            marginTop:
                              "7px",
                            color:
                              "#6B7280",
                            fontSize:
                              "9px",
                          }}
                        >
                          No predictions submitted.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }
          )}
        </div>
      )}

      {filter === "open" &&
        visibleMatches.length > 0 && (
          <button
            type="button"
            onClick={savePredictions}
            disabled={
              saving ||
              dirtyIds.size === 0
            }
            className="primary-button"
            style={{
              width: "100%",
              opacity:
                dirtyIds.size === 0
                  ? 0.6
                  : 1,
            }}
          >
            {saving
              ? "Saving..."
              : dirtyIds.size > 0
                ? `Save changes · ${dirtyIds.size}`
                : `Saved · ${completed}/${openMatches.length}`}
          </button>
        )}

      {notice && (
        <div className="toast">
          {notice}
        </div>
      )}
    </div>
  )
}

export default MyPredictions
