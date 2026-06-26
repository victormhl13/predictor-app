import {
  useEffect,
  useState,
} from "react"
import { Plus, X } from "lucide-react"

import { createMatchdayWithMatches } from "../lib/appApi"
import TeamBadge from "./TeamBadge"

type Fixture = {
  id: number
  kickoff: string
  kickoffTimeTba?: boolean
  homeTeam: string
  awayTeam: string
  homeLogo?: string | null
  awayLogo?: string | null
}

type Props = {
  onCreated: () =>
    void | Promise<void>
}

type Season = {
  year: number
  endYear?: number
  label?: string
  current: boolean
}

type CompetitionPhase =
  | "tur"
  | "retur"
  | "playoff"

function apiPhaseFor(
  phase: CompetitionPhase
) {
  return phase === "playoff"
    ? "playoff"
    : "regular"
}

function apiRoundFor(
  phase: CompetitionPhase,
  matchday: string
) {
  const round = Number(matchday)
  return phase === "retur"
    ? round + 15
    : round
}

function phaseLabel(
  phase: CompetitionPhase,
  matchday: string
) {
  if (phase === "playoff") {
    return `Play-off ${matchday}`
  }

  if (phase === "retur") {
    return `Matchday ${apiRoundFor(
      phase,
      matchday
    )}`
  }

  return `Matchday ${matchday}`
}

function AddMatchdayFlow({
  onCreated,
}: Props) {
  const [open, setOpen] =
    useState(false)
  const [season, setSeason] =
    useState(
      String(
        new Date().getFullYear()
      )
    )
  const [seasons, setSeasons] =
    useState<Season[]>([])
  const [matchday, setMatchday] =
    useState("1")
  const [phase, setPhase] =
    useState<CompetitionPhase>(
      "tur"
    )
  const [fixtures, setFixtures] =
    useState<Fixture[]>([])
  const [selected, setSelected] =
    useState<number[]>([])
  const [loading, setLoading] =
    useState(false)
  const [saving, setSaving] =
    useState(false)
  const [error, setError] =
    useState("")

  useEffect(() => {
    if (!open) return

    fetch("/api/football-seasons")
      .then((response) =>
        response.json()
      )
      .then((data) => {
        const loaded: Season[] =
          data.seasons || []
        const normalized = loaded.filter(
          (item, index, items) =>
            items.findIndex(
              (candidate) =>
                candidate.year ===
                item.year
            ) === index
        )
        setSeasons(normalized)
        const current =
          normalized.find(
            (item: Season) =>
              item.current
          )
        if (current) {
          setSeason(
            String(current.year)
          )
        } else if (
          normalized.length > 0
        ) {
          setSeason(
            String(
              normalized[0].year
            )
          )
        }
      })
      .catch(() => {
        const currentYear =
          new Date().getFullYear()
        setSeasons([
          {
            year: currentYear,
            current: true,
          },
        ])
        setSeason(
          String(currentYear)
        )
      })
  }, [open])

  function close() {
    if (saving) return
    setOpen(false)
    setFixtures([])
    setSelected([])
    setError("")
  }

  async function loadFixtures() {
    setLoading(true)
    setError("")
    setFixtures([])
    setSelected([])

    try {
      const apiRound = apiRoundFor(
        phase,
        matchday
      )
      const params =
        new URLSearchParams({
          season,
          phase:
            apiPhaseFor(phase),
          round:
            `Regular Season - ${apiRound}`,
        })
      const response = await fetch(
        `/api/import-superliga?${params.toString()}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load this matchday."
        )
      }

      setFixtures(
        data.fixtures || []
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load this matchday."
      )
    } finally {
      setLoading(false)
    }
  }

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    )
  }

  async function createMatchday() {
    const chosen = fixtures.filter(
      (fixture) =>
        selected.includes(fixture.id)
    )

    if (chosen.length === 0) {
      setError(
        "Select at least one match."
      )
      return
    }

    setSaving(true)
    setError("")

    try {
      await createMatchdayWithMatches(
        `${
          seasons.find(
            (item) =>
              item.year ===
              Number(season)
          )?.label || season
        } · ${
          phase === "playoff"
            ? `Play-off ${matchday}`
            : phaseLabel(
                phase,
                matchday
              )
        }`,
        chosen.map((fixture) => ({
          home_team:
            fixture.homeTeam,
          away_team:
            fixture.awayTeam,
          kickoff:
            fixture.kickoff,
          api_fixture_id:
            fixture.id,
          home_team_logo:
            fixture.homeLogo || null,
          away_team_logo:
            fixture.awayLogo || null,
        }))
      )

      await onCreated()
      close()
    } catch (saveError) {
      console.error(saveError)
      setError(
        "Could not create the matchday."
      )
    } finally {
      setSaving(false)
    }
  }

  async function createEmptyMatchday() {
    setSaving(true)
    setError("")
    try {
      await createMatchdayWithMatches(
        `${
          seasons.find(
            (item) =>
              item.year ===
              Number(season)
          )?.label || season
        } · ${
          phase === "playoff"
            ? `Play-off ${matchday}`
            : phaseLabel(
                phase,
                matchday
              )
        }`,
        []
      )
      await onCreated()
      close()
    } catch {
      setError(
        "Could not create an empty matchday."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="primary-button matchday-create-button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Plus size={15} />
        Add Matchday
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            zIndex: 320,
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding:
              "18px 18px calc(98px + env(safe-area-inset-bottom))",
            background:
              "rgba(3,6,12,0.84)",
            backdropFilter:
              "blur(10px)",
            WebkitBackdropFilter:
              "blur(10px)",
          }}
          onClick={close}
        >
          <div
            className="surface"
            style={{
              width: "100%",
              maxWidth: "390px",
              maxHeight:
                "calc(100dvh - 142px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
              overflowY: "auto",
              overscrollBehavior:
                "contain",
              scrollPaddingBottom:
                "24px",
              padding:
                "16px 16px 30px",
              borderRadius:
                "24px 24px 18px 18px",
              background:
                "rgba(8,13,21,0.96)",
              boxShadow:
                "0 -18px 60px rgba(0,0,0,0.52)",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 850,
                  }}
                >
                  Add Matchday
                </div>
                <div className="page-subtitle">
                  Choose the round, then
                  select its matches.
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="glass-button"
                style={{
                  width: "34px",
                  minHeight: "34px",
                  padding: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>

            <label
              className="section-label"
              style={{
                display: "block",
              }}
            >
              Competition phase
              <select
                className="field"
                value={phase}
                onChange={(event) => {
                  setPhase(
                    event.target
                      .value as CompetitionPhase
                  )
                  setMatchday("1")
                  setFixtures([])
                  setSelected([])
                }}
                style={{
                  marginTop: "7px",
                }}
              >
                <option value="tur">
                  Regular season ·
                  Matchdays 1-15
                </option>
                <option value="retur">
                  Regular season ·
                  Matchdays 16-30
                </option>
                <option value="playoff">
                  Play-off · 10
                  matchdays
                </option>
              </select>
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "9px",
                marginTop: "10px",
              }}
            >
            <label className="section-label">
              Season
              <select
                className="field"
                value={season}
                onChange={(event) => {
                  setSeason(
                    event.target.value
                  )
                  setFixtures([])
                  setSelected([])
                }}
                style={{
                  marginTop: "7px",
                }}
              >
                {(seasons.length > 0
                  ? seasons
                  : [
                      {
                        year: Number(
                          season
                        ),
                        current: true,
                      },
                    ]
                ).map((item) => (
                  <option
                    key={item.year}
                    value={item.year}
                  >
                    {item.label ||
                      item.year}
                    {item.current
                      ? " · Current"
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="section-label">
              Matchday
              <select
                className="field"
                value={matchday}
                onChange={(event) => {
                  setMatchday(
                    event.target.value
                  )
                  setFixtures([])
                  setSelected([])
                }}
                style={{
                  marginTop: "7px",
                }}
              >
                {Array.from(
                  {
                    length:
                      phase ===
                      "playoff"
                        ? 10
                        : 15,
                  },
                  (_, index) =>
                    index + 1
                ).map((number) => (
                  <option
                    key={number}
                    value={number}
                  >
                    {phaseLabel(
                      phase,
                      String(number)
                    )}
                  </option>
                ))}
              </select>
            </label>
            </div>

            <div
              style={{
                marginTop: "10px",
                color: "#8F9AA8",
                fontSize: "10px",
                textAlign: "center",
              }}
            >
              Official fixtures and
              results from LPF.ro
            </div>

            <button
              type="button"
              onClick={loadFixtures}
              disabled={
                loading || saving
              }
              className="glass-button"
              style={{
                width: "100%",
                marginTop: "12px",
              }}
            >
              {loading
                ? "Loading..."
                : "Load matches"}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginTop: "11px",
                color: "#687382",
                fontSize: "9px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "rgba(255,255,255,0.07)",
                }}
              />
              OR
              <span
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "rgba(255,255,255,0.07)",
                }}
              />
            </div>

            <button
              type="button"
              onClick={
                createEmptyMatchday
              }
              disabled={
                saving || loading
              }
              className="glass-button"
              style={{
                width: "100%",
                marginTop: "11px",
              }}
            >
              {saving
                ? "Creating..."
                : "Create empty Matchday"}
            </button>
            <div
              style={{
                marginTop: "6px",
                color: "#8F9AA8",
                fontSize: "9px",
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              Add future test matches
              manually after creating it.
            </div>

            {fixtures.length > 0 && (
              <div
                className="surface-soft"
                style={{
                  marginTop: "12px",
                  overflow: "hidden",
                }}
              >
                {fixtures.map(
                  (fixture) => (
                    <label
                      key={fixture.id}
                      className="compact-row"
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(
                          fixture.id
                        )}
                        onChange={() =>
                          toggle(
                            fixture.id
                          )
                        }
                        style={{
                          accentColor:
                            "#6DFF4E",
                        }}
                      />
                      <TeamBadge
                        name={
                          fixture.homeTeam
                        }
                        logo={
                          fixture.homeLogo
                        }
                        size={28}
                      />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          textAlign:
                            "center",
                        }}
                      >
                        {fixture.homeTeam}
                        <span
                          style={{
                            margin:
                              "0 5px",
                            color:
                              "#6B7280",
                          }}
                        >
                          vs
                        </span>
                        {fixture.awayTeam}
                      </span>
                      <TeamBadge
                        name={
                          fixture.awayTeam
                        }
                        logo={
                          fixture.awayLogo
                        }
                        size={28}
                      />
                    </label>
                  )
                )}
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: "10px",
                  color: "#FF8585",
                  fontSize: "11px",
                }}
              >
                {error}
              </div>
            )}

            {fixtures.length > 0 && (
              <button
                type="button"
                onClick={createMatchday}
                disabled={
                  saving ||
                  selected.length === 0
                }
                className="primary-button"
                style={{
                  width: "100%",
                  marginTop: "14px",
                  opacity:
                    selected.length === 0
                      ? 0.45
                      : 1,
                }}
              >
                {saving
                  ? "Creating..."
                  : `Create with ${selected.length} matches`}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default AddMatchdayFlow
