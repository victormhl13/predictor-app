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
  recordSync,
  setFinalScore,
  setMatchdayOpen,
  syncMatch,
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
  const [syncStatus, setSyncStatus] =
    useState<{
      synced_at: string | null
      schedule_updates: number
      result_updates: number
      status: string
      message: string | null
    } | null>(null)

  useEffect(() => {
    Promise.all([
      loadMatchdays(),
      loadMatches(),
      loadSyncStatus(),
    ]).finally(() =>
      setLoading(false)
    )
  }, [])

  useEffect(() => {
    if (
      matchdays.length === 0 ||
      Object.keys(
        expandedMatchdays
      ).length > 0
    ) {
      return
    }

    const now = Date.now()
    const nextMatch = matches
      .filter(
        (match) =>
          new Date(
            match.kickoff
          ).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(
            a.kickoff
          ).getTime() -
          new Date(
            b.kickoff
          ).getTime()
      )[0]
    const target =
      nextMatch?.matchday_id ||
      matchdays.find(
        (matchday) =>
          matchday.is_open
      )?.id ||
      matchdays[0]?.id

    if (target) {
      const timeout =
        window.setTimeout(() => {
          setExpandedMatchdays(
            (current) =>
              Object.keys(
                current
              ).length > 0
                ? current
                : {
                    [target]:
                      true,
                  }
          )
        }, 0)
      return () =>
        window.clearTimeout(
          timeout
        )
    }
  }, [
    expandedMatchdays,
    matchdays,
    matches,
  ])

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

  async function loadSyncStatus() {
    const { data } = await supabase
      .from("sync_status")
      .select("*")
      .eq("id", true)
      .maybeSingle()
    if (data) setSyncStatus(data)
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
      type SyncedFixture = {
        id: number
        status: string
        homeScore: number | null
        awayScore: number | null
        kickoff: string | null
        homeTeam: string | null
        awayTeam: string | null
        homeLogo: string | null
        awayLogo: string | null
      }
      const synchronized =
        (data.fixtures ||
          []) as SyncedFixture[]
      let scheduleChanges = 0
      let resultChanges = 0

      await Promise.all(
        synchronized.map(
          async (fixture) => {
            const match =
              apiMatches.find(
                (item) =>
                  item.api_fixture_id ===
                  fixture.id
              )
            if (
              !match ||
              !fixture.kickoff ||
              !fixture.homeTeam ||
              !fixture.awayTeam
            ) {
              return
            }

            const isFinal =
              finishedStatuses.has(
                fixture.status
              ) &&
              fixture.homeScore !==
                null &&
              fixture.awayScore !== null
            const scheduleChanged =
              new Date(
                match.kickoff
              ).getTime() !==
                new Date(
                  fixture.kickoff
                ).getTime() ||
              match.home_team !==
                fixture.homeTeam ||
              match.away_team !==
                fixture.awayTeam ||
              (fixture.homeLogo &&
                match.home_team_logo !==
                  fixture.homeLogo) ||
              (fixture.awayLogo &&
                match.away_team_logo !==
                  fixture.awayLogo)
            const resultChanged =
              isFinal &&
              (match.home_score !==
                fixture.homeScore ||
                match.away_score !==
                  fixture.awayScore)

            await syncMatch(
              match.id,
              {
                homeTeam:
                  fixture.homeTeam,
                awayTeam:
                  fixture.awayTeam,
                kickoff:
                  fixture.kickoff,
                homeLogo:
                  fixture.homeLogo,
                awayLogo:
                  fixture.awayLogo,
                homeScore: isFinal
                  ? fixture.homeScore
                  : null,
                awayScore: isFinal
                  ? fixture.awayScore
                  : null,
              }
            )

            if (scheduleChanged) {
              scheduleChanges += 1
            }
            if (resultChanged) {
              resultChanges += 1
            }
          }
        )
      )

      const finalFixtureIds =
        new Set(
          synchronized
            .filter(
              (fixture) =>
                finishedStatuses.has(
                  fixture.status
                ) &&
                fixture.homeScore !==
                  null &&
                fixture.awayScore !==
                  null
            )
            .map(
              (fixture) =>
                fixture.id
            )
        )
      const completedMatchdays =
        matchdays.filter(
          (matchday) => {
            if (!matchday.is_open) {
              return false
            }
            const items =
              matches.filter(
                (match) =>
                  match.matchday_id ===
                  matchday.id
              )
            return (
              items.length > 0 &&
              items.every(
                (match) =>
                  (match.home_score !==
                    null &&
                    match.away_score !==
                      null) ||
                  (match.api_fixture_id !==
                    null &&
                    finalFixtureIds.has(
                      match.api_fixture_id
                    ))
              )
            )
          }
        )
      await Promise.all(
        completedMatchdays.map(
          (matchday) =>
            setMatchdayOpen(
              matchday.id,
              false
            )
        )
      )

      const syncMessage =
        completedMatchdays.length > 0
          ? `${completedMatchdays.length} matchday closed automatically.`
          : "Synchronization completed."
      await recordSync(
        scheduleChanges,
        resultChanges,
        "success",
        syncMessage
      )

      await Promise.all([
        loadMatches(),
        loadMatchdays(),
        loadSyncStatus(),
      ])
      if (!silent) {
        const changes = [
          scheduleChanges > 0
            ? `${scheduleChanges} schedule update${
                scheduleChanges === 1
                  ? ""
                  : "s"
              }`
            : "",
          resultChanges > 0
            ? `${resultChanges} result${
                resultChanges === 1
                  ? ""
                  : "s"
              }`
            : "",
        ].filter(Boolean)
        setNotice(
          changes.length > 0
            ? `${changes.join(
                " and "
              )} synchronized.`
            : "Everything is up to date."
        )
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not sync results."
      try {
        await recordSync(
          0,
          0,
          "error",
          message
        )
        await loadSyncStatus()
      } catch {
        // The visible sync error remains the primary feedback.
      }
      if (!silent) {
        setNotice(message)
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

  const visibleMatchdays = [
    ...matchdays,
  ]
    .filter((matchday) => {
      if (
        matchFilter ===
        "upcoming"
      ) {
        return matchday.is_open
      }
      if (
        matchFilter ===
        "finished"
      ) {
        return !matchday.is_open
      }
      return true
    })
    .sort((a, b) => {
      if (
        a.is_open !== b.is_open
      ) {
        return a.is_open ? -1 : 1
      }

      const matchdayTime = (
        id: string,
        mode: "first" | "last"
      ) => {
        const times = matches
          .filter(
            (match) =>
              match.matchday_id ===
              id
          )
          .map((match) =>
            new Date(
              match.kickoff
            ).getTime()
          )
        if (times.length === 0) {
          return 0
        }
        return mode === "first"
          ? Math.min(...times)
          : Math.max(...times)
      }

      return a.is_open
        ? matchdayTime(
            a.id,
            "first"
          ) -
            matchdayTime(
              b.id,
              "first"
            )
        : matchdayTime(
            a.id,
            "last"
          ) -
            matchdayTime(
              b.id,
              "last"
            )
    })

  return (
    <div>
      <PageHeader
        title="Matchdays"
        subtitle="Fixtures, results and matchday management"
      />

      {currentUser?.role ===
        "admin" && (
        <div className="matchday-actions">
          <button
            type="button"
            onClick={() =>
              syncResults(false)
            }
            disabled={syncing}
            className="glass-button matchday-refresh"
            aria-label="Sync fixtures and results"
            title="Sync fixtures and results"
          >
            <RefreshCw
              size={16}
              className={
                syncing
                  ? "spin"
                  : undefined
              }
            />
          </button>
          <div className="matchday-add-action">
              <AddMatchdayFlow
                onCreated={async () => {
                  await loadMatchdays()
                  await loadMatches()
                }}
              />
          </div>
        </div>
      )}

      {syncStatus && (
        <div className="sync-status">
          <span
            className={
              syncStatus.status ===
              "error"
                ? "sync-dot sync-dot-error"
                : "sync-dot"
            }
          />
          <span>
            {syncStatus.synced_at
              ? `Last sync ${new Date(
                  syncStatus.synced_at
                ).toLocaleString(
                  "ro-RO",
                  {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}`
              : "Not synchronized yet"}
          </span>
          {(syncStatus.schedule_updates >
            0 ||
            syncStatus.result_updates >
              0) && (
            <strong>
              {
                syncStatus.schedule_updates
              }{" "}
              schedule ·{" "}
              {
                syncStatus.result_updates
              }{" "}
              results
            </strong>
          )}
        </div>
      )}

      {matchdays.length > 0 && (
        <div className="segmented">
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

      {loading && (
        <SkeletonList rows={4} />
      )}

      {!loading &&
      visibleMatchdays.map(
        (matchday) => {
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
        const expanded = Boolean(
          expandedMatchdays[
            matchday.id
          ]
        )
        const showMatches = expanded
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
                "rgba(9,15,24,0.55)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.045), 0 12px 28px rgba(0,0,0,0.14)",
              backdropFilter:
                "blur(11px)",
              WebkitBackdropFilter:
                "blur(11px)",
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
                <button
                  type="button"
                  aria-label={
                    expanded
                      ? "Collapse matchday"
                      : "Expand matchday"
                  }
                  onClick={() =>
                    toggleMatchday(
                      matchday.id
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
                  {expanded ? (
                    <ChevronUp
                      size={16}
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                    />
                  )}
                </button>
              </div>
            </div>

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
                                {match.rescheduled_at && (
                                  <div
                                    style={{
                                      marginTop:
                                        "2px",
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
        }
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
