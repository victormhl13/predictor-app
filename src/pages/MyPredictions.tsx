import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "../lib/supabase"
import {
  getMyPredictions,
  saveMyPredictions,
} from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
import PageHeader from "../components/PageHeader"
import ScoreStepper from "../components/ScoreStepper"
import TeamBadge from "../components/TeamBadge"
import Countdown from "../components/Countdown"
import SkeletonList from "../components/SkeletonList"
import type {
  Match,
  Prediction,
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

  useEffect(() => {
    async function load() {
      const { data: matchData } =
        await supabase
          .from("matches")
          .select("*")
          .is("home_score", null)
          .order("kickoff")

      setMatches(
        (matchData || []) as Match[]
      )

      if (!currentUser) return

      const predictionData =
        await getMyPredictions()

      const loaded: Record<
        string,
        Draft
      > = {}
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
    return (
      new Date(kickoff) <=
      new Date()
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
          draft &&
          !draft.saved &&
          draft.home !== "" &&
          draft.away !== ""
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
              draft.home
            ),
            away: Number(
              draft.away
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
          ...next[match.id],
          saved: true,
        }
      })
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
        draft?.home !== "" &&
        draft?.away !== ""
      )
    }
  ).length

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
                (draft?.home ===
                  undefined ||
                  draft?.home === "" ||
                  draft?.away ===
                    undefined ||
                  draft?.away === "")

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
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap: "14px",
                      marginTop: "11px",
                    }}
                  >
                    {locked ? (
                      <div
                        style={{
                          color:
                            draft
                              ? "#FFFFFF"
                              : "#9CA3AF",
                          fontSize:
                            draft
                              ? "19px"
                              : "11px",
                          fontWeight:
                            draft
                              ? 850
                              : 650,
                        }}
                      >
                        {draft
                          ? `${draft.home} – ${draft.away}`
                          : "No prediction"}
                      </div>
                    ) : (
                      <>
                        <ScoreStepper
                          compact
                          value={
                            draft?.home ??
                            ""
                          }
                          onChange={(
                            value
                          ) =>
                            update(
                              match.id,
                              "home",
                              value
                            )
                          }
                        />
                        <span
                          style={{
                            color:
                              "#6B7280",
                            fontWeight:
                              800,
                          }}
                        >
                          –
                        </span>
                        <ScoreStepper
                          compact
                          value={
                            draft?.away ??
                            ""
                          }
                          onChange={(
                            value
                          ) =>
                            update(
                              match.id,
                              "away",
                              value
                            )
                          }
                        />
                      </>
                    )}
                  </div>

                  {!locked &&
                    draft?.saved && (
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
                      PREDICTION NEEDED
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
