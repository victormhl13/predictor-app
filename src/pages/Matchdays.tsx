import {
  useEffect,
  useState,
} from "react"
import {
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Settings2,
  X,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import {
  addManualMatch,
  deleteMatch,
  setFinalScore,
  setMatchdayOpen,
  updateMatch,
} from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
import AddMatchdayFlow from "../components/AddMatchdayFlow"
import PageHeader from "../components/PageHeader"
import AddMatchForm from "../components/AddMatchForm"
import FinalScoreForm from "../components/FinalScoreForm"
import ImportMatchesForm from "../components/ImportMatchesForm"
import TeamBadge from "../components/TeamBadge"
import SkeletonList from "../components/SkeletonList"
import EditMatchForm from "../components/EditMatchForm"
import type {
  Match,
  Matchday,
} from "../types"

const glassButton = {
  border:
    "1px solid rgba(255,255,255,0.10)",
  borderRadius: "999px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035))",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontWeight: 700,
} as const

function Matchdays() {
  const { currentUser } = useAuth()
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
  const [
    managedMatchday,
    setManagedMatchday,
  ] = useState<string | null>(null)
  const [
    importMatchday,
    setImportMatchday,
  ] = useState<string | null>(null)
  const [
    scoreEditor,
    setScoreEditor,
  ] = useState<string | null>(null)
  const [
    matchFilter,
    setMatchFilter,
  ] = useState<
    "all" | "upcoming" | "finished"
  >("all")
  const [notice, setNotice] =
    useState("")
  const [syncing, setSyncing] =
    useState(false)
  const [loading, setLoading] =
    useState(true)
  const [
    matchDetailsEditor,
    setMatchDetailsEditor,
  ] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      loadMatchdays(),
      loadMatches(),
    ]).finally(() =>
      setLoading(false)
    )
  }, [])

  async function loadMatchdays() {
    const { data, error } =
      await supabase
        .from("matchdays")
        .select("*")
        .order("name")

    if (error) {
      console.error(error)
      return
    }

    setMatchdays(
      (data || []) as Matchday[]
    )
  }

  async function loadMatches() {
    const { data, error } =
      await supabase
        .from("matches")
        .select("*")
        .order("kickoff")

    if (error) {
      console.error(error)
      return
    }

    setMatches(
      (data || []) as Match[]
    )
  }

  async function addMatch(
    matchdayId: string,
    homeTeam: string,
    awayTeam: string,
    kickoff: string
  ) {
    try {
      await addManualMatch(
        matchdayId,
        homeTeam,
        awayTeam,
        kickoff
      )
    } catch (error) {
      console.error(error)
      return
    }

    await loadMatches()
  }

  async function saveFinalScore(
    matchId: string,
    homeScore: number,
    awayScore: number
  ) {
    try {
      await setFinalScore(
        matchId,
        homeScore,
        awayScore
      )
    } catch (error) {
      console.error(error)
      return
    }

    setScoreEditor(null)
    await loadMatches()
    setNotice("Score saved.")
    window.setTimeout(
      () => setNotice(""),
      2200
    )
  }

  async function closeMatchday(
    matchdayId: string
  ) {
    const confirmed =
      window.confirm(
        "Close this matchday? Predictions and results will remain visible."
      )

    if (!confirmed) return

    try {
      await setMatchdayOpen(
        matchdayId,
        false
      )
    } catch (error) {
      console.error(error)
      return
    }

    setManagedMatchday(null)
    await loadMatchdays()
  }

  async function reopenMatchday(
    matchdayId: string
  ) {
    try {
      await setMatchdayOpen(
        matchdayId,
        true
      )
      await loadMatchdays()
      setNotice(
        "Matchday reopened."
      )
    } catch (error) {
      console.error(error)
    }
  }

  async function removeMatch(
    matchId: string
  ) {
    if (
      !window.confirm(
        "Delete this match and its predictions?"
      )
    ) {
      return
    }

    try {
      await deleteMatch(matchId)
      await loadMatches()
      setNotice("Match deleted.")
    } catch (error) {
      console.error(error)
    }
  }

  async function saveMatchDetails(
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    kickoff: string
  ) {
    try {
      await updateMatch(
        matchId,
        homeTeam,
        awayTeam,
        kickoff
      )
      setMatchDetailsEditor(
        null
      )
      await loadMatches()
      setNotice(
        "Match updated."
      )
    } catch (error) {
      console.error(error)
      setNotice(
        "Could not update match."
      )
    }
  }

  async function syncResults(
    silent = false
  ) {
    const apiMatches =
      matches.filter(
        (match) =>
          match.api_fixture_id !==
          null
      )

    if (apiMatches.length === 0) {
      if (!silent) {
        setNotice(
          "No API matches to sync."
        )
      }
      return
    }

    setSyncing(true)
    try {
      const params =
        new URLSearchParams({
          ids: apiMatches
            .map(
              (match) =>
                match.api_fixture_id
            )
            .join(","),
        })
      const response = await fetch(
        `/api/sync-results?${params.toString()}`
      )
      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Sync failed."
        )
      }

      const finishedStatuses =
        new Set([
          "FT",
          "AET",
          "PEN",
          "AWD",
          "WO",
        ])
      const finished =
        (data.fixtures || []).filter(
          (fixture: {
            status: string
            homeScore:
              | number
              | null
            awayScore:
              | number
              | null
          }) =>
            finishedStatuses.has(
              fixture.status
            ) &&
            fixture.homeScore !==
              null &&
            fixture.awayScore !== null
        )

      await Promise.all(
        finished.map(
          (fixture: {
            id: number
            homeScore: number
            awayScore: number
          }) => {
            const match =
              apiMatches.find(
                (item) =>
                  item.api_fixture_id ===
                  fixture.id
              )
            if (!match) return
            return setFinalScore(
              match.id,
              fixture.homeScore,
              fixture.awayScore
            )
          }
        )
      )

      await loadMatches()
      if (!silent) {
        setNotice(
          finished.length > 0
            ? `${finished.length} result${
                finished.length === 1
                  ? ""
                  : "s"
              } synchronized.`
            : "No new final results."
        )
      }
    } catch (error) {
      if (!silent) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Could not sync results."
        )
      }
    } finally {
      setSyncing(false)
      if (!silent) {
        window.setTimeout(
          () => setNotice(""),
          2600
        )
      }
    }
  }

  useEffect(() => {
    if (
      currentUser?.role !==
        "admin" ||
      loading
    ) {
      return
    }

    const firstSync =
      window.setTimeout(
        () => syncResults(true),
        1200
      )
    const interval =
      window.setInterval(
        () => syncResults(true),
        5 * 60 * 1000
      )

    return () => {
      window.clearTimeout(
        firstSync
      )
      window.clearInterval(
        interval
      )
    }
    // Sync uses the latest loaded API fixtures for this page session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, loading])

  function toggleMatchday(
    id: string
  ) {
    setExpandedMatchdays(
      (current) => ({
        ...current,
        [id]: !current[id],
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

  return (
    <div>
      <PageHeader
        title="Matchdays"
        subtitle="Fixtures, results and matchday management"
        action={
          currentUser?.role ===
          "admin" ? (
            <div
              style={{
                display: "flex",
                gap: "6px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  syncResults(false)
                }
                disabled={syncing}
                className="glass-button"
                aria-label="Sync results"
                style={{
                  width: "40px",
                  minHeight: "40px",
                  padding: 0,
                }}
              >
                <RefreshCw
                  size={15}
                />
              </button>
              <AddMatchdayFlow
                onCreated={async () => {
                  await loadMatchdays()
                  await loadMatches()
                }}
              />
            </div>
          ) : undefined
        }
      />

      {loading && (
        <SkeletonList rows={4} />
      )}

      {!loading &&
      matchdays.map((matchday) => {
        const allMatchdayMatches =
          matches.filter(
            (match) =>
              match.matchday_id ===
              matchday.id
          )
        const matchdayMatches =
          allMatchdayMatches.filter(
            (match) => {
              const finished =
                match.home_score !==
                  null &&
                match.away_score !==
                  null

              if (
                matchFilter ===
                "finished"
              ) {
                return finished
              }
              if (
                matchFilter ===
                "upcoming"
              ) {
                return !finished
              }
              return true
            }
          )
        const expanded =
          expandedMatchdays[
            matchday.id
          ]
        const showMatches =
          matchday.is_open || expanded
        const isManaged =
          managedMatchday ===
          matchday.id

        return (
          <section
            key={matchday.id}
            style={{
              marginBottom: "14px",
              padding: "16px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius: "22px",
              background:
                "rgba(255,255,255,0.025)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "19px",
                    fontWeight: 800,
                  }}
                >
                  {matchday.name}
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    color: "#9CA3AF",
                    fontSize: "11px",
                  }}
                >
                  {allMatchdayMatches.length}{" "}
                  matches
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    color:
                      matchday.is_open
                        ? "#9CF989"
                        : "#FF8A8A",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing:
                      "0.8px",
                  }}
                >
                  {matchday.is_open
                    ? "OPEN"
                    : "CLOSED"}
                </span>

                {currentUser?.role ===
                  "admin" && (
                    <button
                      type="button"
                      aria-label="Manage matchday"
                      onClick={() =>
                        setManagedMatchday(
                          isManaged
                            ? null
                            : matchday.id
                        )
                      }
                      style={{
                        ...glassButton,
                        width: "36px",
                        height: "36px",
                        padding: 0,
                        display: "grid",
                        placeItems:
                          "center",
                      }}
                    >
                      {isManaged ? (
                        <X size={16} />
                      ) : (
                        <Settings2
                          size={16}
                        />
                      )}
                    </button>
                  )}
              </div>
            </div>

            {!matchday.is_open && (
              <button
                type="button"
                onClick={() =>
                  toggleMatchday(
                    matchday.id
                  )
                }
                style={{
                  marginTop: "10px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "none",
                  background:
                    "transparent",
                  color: "#9CA3AF",
                  fontSize: "12px",
                }}
              >
                {expanded ? (
                  <ChevronUp
                    size={15}
                  />
                ) : (
                  <ChevronDown
                    size={15}
                  />
                )}
                {expanded
                  ? "Hide results"
                  : "View results"}
              </button>
            )}

            {isManaged && (
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "14px",
                  borderTop:
                    "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {matchday.is_open ? (
                  <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setImportMatchday(
                        matchday.id
                      )
                      setManagedMatchday(
                        null
                      )
                    }}
                    style={{
                      ...glassButton,
                      height: "42px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap: "7px",
                      fontSize: "12px",
                    }}
                  >
                    <Download size={15} />
                    Import
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      closeMatchday(
                        matchday.id
                      )
                    }
                    style={{
                      height: "42px",
                      border:
                        "1px solid rgba(255,92,92,0.24)",
                      borderRadius:
                        "999px",
                      background:
                        "linear-gradient(145deg, rgba(255,92,92,0.16), rgba(255,92,92,0.05))",
                      color: "#FF8A8A",
                      fontSize: "12px",
                      fontWeight: 750,
                    }}
                  >
                    Close Matchday
                  </button>
                </div>

                <AddMatchForm
                  matchdayId={
                    matchday.id
                  }
                  onCreate={addMatch}
                />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      reopenMatchday(
                        matchday.id
                      )
                    }
                    className="primary-button"
                    style={{
                      width: "100%",
                    }}
                  >
                    Reopen Matchday
                  </button>
                )}
              </div>
            )}

            {showMatches && (
              <div
                style={{
                  marginTop: "12px",
                  borderTop:
                    "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {matchdayMatches.map(
                  (match) => {
                    const finished =
                      match.home_score !==
                        null &&
                      match.away_score !==
                        null
                    const editing =
                      scoreEditor ===
                      match.id

                    return (
                      <article
                        key={match.id}
                        style={{
                          padding:
                            "12px 0",
                          borderBottom:
                            "1px solid rgba(255,255,255,0.055)",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "minmax(0, 1fr) 70px minmax(0, 1fr)",
                            alignItems:
                              "center",
                            gap: "5px",
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "7px",
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
                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize:
                                  "11px",
                                fontWeight:
                                  700,
                                lineHeight:
                                  1.25,
                                overflow:
                                  "hidden",
                                overflowWrap:
                                  "anywhere",
                                display:
                                  "-webkit-box",
                                WebkitLineClamp:
                                  2,
                                WebkitBoxOrient:
                                  "vertical",
                              }}
                            >
                              {
                                match.home_team
                              }
                            </span>
                          </div>

                          <div
                            style={{
                              textAlign:
                                "center",
                            }}
                          >
                            {finished ? (
                              <div
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  minWidth:
                                    "58px",
                                  height:
                                    "30px",
                                  border:
                                    "1px solid rgba(255,255,255,0.09)",
                                  borderRadius:
                                    "11px",
                                  background:
                                    "rgba(255,255,255,0.055)",
                                  fontSize:
                                    "16px",
                                  fontWeight:
                                    850,
                                }}
                              >
                                {
                                  match.home_score
                                }
                                {" – "}
                                {
                                  match.away_score
                                }
                              </div>
                            ) : (
                              <>
                                <div
                                  style={{
                                    color:
                                      "#DDE3EA",
                                    fontSize:
                                      "10px",
                                    fontWeight:
                                      750,
                                    lineHeight:
                                      1.35,
                                  }}
                                >
                                  {formatKickoff(
                                    match.kickoff
                                  )}
                                </div>
                                <div
                                  style={{
                                    marginTop:
                                      "2px",
                                    color:
                                      "#60A5FA",
                                    fontSize:
                                      "8px",
                                    fontWeight:
                                      800,
                                    letterSpacing:
                                      "0.5px",
                                  }}
                                >
                                  UPCOMING
                                </div>
                              </>
                            )}
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "flex-end",
                              gap: "7px",
                              textAlign:
                                "right",
                            }}
                          >
                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize:
                                  "11px",
                                fontWeight:
                                  700,
                                lineHeight:
                                  1.25,
                                overflow:
                                  "hidden",
                                overflowWrap:
                                  "anywhere",
                                display:
                                  "-webkit-box",
                                WebkitLineClamp:
                                  2,
                                WebkitBoxOrient:
                                  "vertical",
                              }}
                            >
                              {
                                match.away_team
                              }
                            </span>
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

                        {currentUser?.role ===
                          "admin" &&
                          (!finished ||
                            isManaged) && (
                            <>
                              {!editing &&
                                !finished && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScoreEditor(
                                      match.id
                                    )
                                  }
                                  style={{
                                    ...glassButton,
                                    display:
                                      "block",
                                    height:
                                      "28px",
                                    margin:
                                      "9px auto 0",
                                    padding:
                                      "0 13px",
                                    color:
                                      "#B8C0CC",
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  Set score
                                </button>
                              )}

                              {!editing &&
                                isManaged &&
                                finished && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setScoreEditor(
                                        match.id
                                      )
                                    }
                                    className="glass-button"
                                    style={{
                                      display:
                                        "block",
                                      minHeight:
                                        "28px",
                                      margin:
                                        "9px auto 0",
                                      padding:
                                        "0 13px",
                                      color:
                                        "#B8C0CC",
                                      fontSize:
                                        "10px",
                                    }}
                                  >
                                    Edit score
                                  </button>
                                )}

                              {!editing &&
                                isManaged && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMatchDetailsEditor(
                                        match.id
                                      )
                                    }
                                    style={{
                                      display:
                                        "block",
                                      margin:
                                        "7px auto 0",
                                      padding:
                                        "3px 8px",
                                      border:
                                        "none",
                                      background:
                                        "transparent",
                                      color:
                                        "#9CA3AF",
                                      fontSize:
                                        "9px",
                                      fontWeight:
                                        750,
                                    }}
                                  >
                                    Edit match
                                  </button>
                                )}

                              {!editing &&
                                isManaged && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeMatch(
                                        match.id
                                      )
                                    }
                                    style={{
                                      display:
                                        "block",
                                      margin:
                                        "7px auto 0",
                                      padding:
                                        "3px 8px",
                                      border:
                                        "none",
                                      background:
                                        "transparent",
                                      color:
                                        "#FF8585",
                                      fontSize:
                                        "9px",
                                      fontWeight:
                                        750,
                                    }}
                                  >
                                    Delete match
                                  </button>
                                )}

                              {matchDetailsEditor ===
                                match.id && (
                                <EditMatchForm
                                  match={match}
                                  onCancel={() =>
                                    setMatchDetailsEditor(
                                      null
                                    )
                                  }
                                  onSave={(
                                    homeTeam,
                                    awayTeam,
                                    kickoff
                                  ) =>
                                    saveMatchDetails(
                                      match.id,
                                      homeTeam,
                                      awayTeam,
                                      kickoff
                                    )
                                  }
                                />
                              )}

                              {editing && (
                                <div
                                  style={{
                                    position:
                                      "relative",
                                  }}
                                >
                                  <button
                                    type="button"
                                    aria-label="Close score editor"
                                    onClick={() =>
                                      setScoreEditor(
                                        null
                                      )
                                    }
                                    style={{
                                      position:
                                        "absolute",
                                      zIndex: 1,
                                      top: "20px",
                                      right: "9px",
                                      width:
                                        "28px",
                                      height:
                                        "28px",
                                      padding: 0,
                                      display:
                                        "grid",
                                      placeItems:
                                        "center",
                                      border:
                                        "none",
                                      borderRadius:
                                        "50%",
                                      background:
                                        "rgba(255,255,255,0.07)",
                                      color:
                                        "#9CA3AF",
                                    }}
                                  >
                                    <X
                                      size={14}
                                    />
                                  </button>

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
                            </>
                          )}
                      </article>
                    )
                  }
                )}
              </div>
            )}
          </section>
        )
      })}

      {matchdays.length > 0 && (
        <div
          className="segmented"
          style={{
            position: "fixed",
            zIndex: 20,
            left: "50%",
            bottom: "86px",
            width:
              "calc(100% - 112px)",
            maxWidth: "318px",
            transform:
              "translateX(-50%)",
            background:
              "rgba(10,15,24,0.92)",
            backdropFilter:
              "blur(18px)",
          }}
        >
          {(
            [
              "all",
              "upcoming",
              "finished",
            ] as const
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setMatchFilter(item)
              }
              className={`segment ${
                matchFilter === item
                  ? "segment-active"
                  : ""
              }`}
              style={{
                textTransform:
                  "capitalize",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {importMatchday && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            zIndex: 100,
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "18px",
            background:
              "rgba(3,6,12,0.72)",
            backdropFilter:
              "blur(8px)",
            WebkitBackdropFilter:
              "blur(8px)",
          }}
          onClick={() =>
            setImportMatchday(null)
          }
        >
          <div
            style={{
              width: "100%",
              maxWidth: "390px",
              maxHeight: "86vh",
              overflowY: "auto",
              padding:
                "10px 14px 20px",
              border:
                "1px solid rgba(255,255,255,0.11)",
              borderRadius:
                "24px 24px 18px 18px",
              background:
                "rgba(10,15,24,0.94)",
              boxShadow:
                "0 -18px 60px rgba(0,0,0,0.45)",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                width: "42px",
                height: "4px",
                margin: "0 auto 2px",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,0.20)",
              }}
            />

            <button
              type="button"
              aria-label="Close import"
              onClick={() =>
                setImportMatchday(null)
              }
              style={{
                display: "grid",
                placeItems: "center",
                width: "34px",
                height: "34px",
                marginLeft: "auto",
                padding: 0,
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "50%",
                background:
                  "rgba(255,255,255,0.05)",
                color: "#FFFFFF",
              }}
            >
              <X size={16} />
            </button>

            <ImportMatchesForm
              matchdayId={
                importMatchday
              }
              onImported={async () => {
                await loadMatches()
                setImportMatchday(
                  null
                )
              }}
            />
          </div>
        </div>
      )}

      {notice && (
        <div className="toast">
          {notice}
        </div>
      )}
    </div>
  )
}

export default Matchdays
