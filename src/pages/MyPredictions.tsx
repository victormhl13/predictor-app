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
  Prediction,
  User,
} from "../types"

type Draft = {
  home: number | ""
  away: number | ""
  saved: boolean
}

function MyPredictions() {
  const { currentUser } = useAuth()
  const [matches, setMatches] =
    useState<Match[]>([])
  const [drafts, setDrafts] =
    useState<Record<string, Draft>>(
      {}
    )
  const [filter, setFilter] =
    useState<
      "open" | "locked"
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
      const { data: matchData } =
        await supabase
          .from("matches")
          .select("*")
          .order("kickoff")

      setMatches(
        (matchData || []) as Match[]
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

      const loaded: Record<
        string,
        Draft
      > = {}
      ;(
        (matchData || []) as Match[]
      ).forEach((match) => {
        loaded[match.id] = {
          home: 0,
          away: 0,
          saved: false,
        }
      })
      ;(
        predictionData as Prediction[]
      ).forEach((prediction) => {
        loaded[
          prediction.match_id
        ] = {
          home:
            prediction.home_prediction,
          away:
            prediction.away_prediction,
          saved: true,
        }
      })
      setDrafts(loaded)
      setLoading(false)
    }

    load().catch(() =>
      setLoading(false)
    )
  }, [currentUser])

  function isLocked(
    kickoff: string
  ) {
    const lockDate = new Date(
      kickoff
    )

    if (
      isLikelyTbaKickoff(
        kickoff
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
          "",
        away:
          current[matchId]?.away ??
          "",
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
          !isLocked(
            match.kickoff
          ) &&
          !draft?.saved
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
    } catch (error) {
      setSaving(false)
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not save predictions."
      )
      return
    }

    setDrafts((current) => {
      const next = { ...current }
      changed.forEach((match) => {
        next[match.id] = {
          home:
            next[match.id]
              ?.home ?? 0,
          away:
            next[match.id]
              ?.away ?? 0,
          saved: true,
        }
      })
      return next
    })
    setDirtyIds((current) => {
      const next = new Set(
        current
      )
      changed.forEach((match) =>
        next.delete(match.id)
      )
      return next
    })
    setEditingIds((current) => {
      const next = new Set(
        current
      )
      changed.forEach((match) =>
        next.delete(match.id)
      )
      return next
    })
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
          ? isLocked(
              match.kickoff
            )
          : !isLocked(
              match.kickoff
            )
      ),
    [matches, filter]
  )
  const openMatches = matches.filter(
    (match) =>
      !isLocked(match.kickoff)
  )
  const completed = openMatches.filter(
    (match) => {
      const draft = drafts[match.id]
      return (
        typeof draft?.home ===
          "number" &&
        typeof draft?.away ===
          "number"
      )
    }
  ).length
  const hasUnsavedChanges =
    dirtyIds.size > 0

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
    if (
      isLikelyTbaKickoff(
        kickoff
      )
    ) {
      return `${new Date(
        kickoff
      ).toLocaleDateString(
        "ro-RO",
        {
          day: "2-digit",
          month: "short",
          timeZone:
            "Europe/Amsterdam",
        }
      )}, time TBA`
    }

    return new Date(
      kickoff
    ).toLocaleString(
      "ro-RO",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "Europe/Amsterdam",
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

      {loading ? (
        <SkeletonList rows={4} />
      ) : visibleMatches.length ===
      0 ? (
        <div className="surface empty-state">
          No matches in this view.
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
                isLocked(
                  match.kickoff
                )
              const draft =
                drafts[match.id]
              const missing =
                !locked &&
                !draft?.saved
              const isEditing =
                editingIds.has(
                  match.id
                )

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
                          color:
                            draft?.saved
                              ? "#FFFFFF"
                              : "#9CA3AF",
                          fontSize:
                            draft?.saved
                              ? "19px"
                              : "11px",
                          fontWeight:
                            draft?.saved
                              ? 850
                              : 650,
                        }}
                      >
                        {draft?.saved
                          ? `${draft.home} – ${draft.away}`
                          : "No prediction"}
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
                      UNSAVED PREDICTION
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
            disabled={saving}
            className="primary-button"
            style={{
              width: "100%",
            }}
          >
            {saving
              ? "Saving..."
              : `Save all · ${completed}/${openMatches.length}`}
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
