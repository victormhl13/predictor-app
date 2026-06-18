import {
  useEffect,
  useState,
} from "react"

import {
  importMatches as importMatchesSecure,
} from "../lib/appApi"
import TeamBadge from "./TeamBadge"

type Props = {
  matchdayId: string
  onImported?: () =>
    void | Promise<void>
}

type ApiFixture = {
  id: number
  kickoff: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string | null
  awayLogo?: string | null
}

type FixturesResponse = {
  fixtures?: ApiFixture[]
  error?: string
}

type Season = {
  year: number
  current: boolean
}

const fieldStyle = {
  width: "100%",
  height: "48px",
  padding: "0 16px",
  boxSizing: "border-box",
  borderRadius: "16px",
  border:
    "1px solid rgba(255,255,255,0.08)",
  background:
    "rgba(255,255,255,0.05)",
  color: "#FFFFFF",
} as const

function ImportMatchesForm({
  matchdayId,
  onImported,
}: Props) {
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
  const [fixtures, setFixtures] =
    useState<ApiFixture[]>([])
  const [selectedIds, setSelectedIds] =
    useState<number[]>([])
  const [loading, setLoading] =
    useState(false)
  const [importing, setImporting] =
    useState(false)
  const [message, setMessage] =
    useState("")
  const [error, setError] =
    useState("")

  useEffect(() => {
    fetch("/api/football-seasons")
      .then((response) =>
        response.json()
      )
      .then((data) => {
        const currentYear =
          new Date().getFullYear()
        const loaded: Season[] =
          data.seasons || []
        const normalized = [
          {
            year: currentYear,
            current: true,
          },
          ...loaded,
        ].filter(
          (item, index, items) =>
            items.findIndex(
              (candidate) =>
                candidate.year ===
                item.year
            ) === index
        )
        setSeasons(normalized)
        setSeason(
          String(
            normalized[0]?.year ||
              currentYear
          )
        )
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
  }, [])

  async function loadMatches() {
    setLoading(true)
    setError("")
    setMessage("")
    setFixtures([])
    setSelectedIds([])

    try {
      const params =
        new URLSearchParams({
          season,
          round:
            `Regular Season - ${matchday}`,
        })

      const response = await fetch(
        `/api/import-superliga?${params.toString()}`
      )
      const data =
        (await response.json()) as FixturesResponse

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load matches."
        )
      }

      const loadedFixtures =
        data.fixtures || []

      setFixtures(loadedFixtures)
      setSelectedIds([])

      if (loadedFixtures.length === 0) {
        setMessage(
          "No matches were found for this season and round."
        )
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load matches."
      )
    } finally {
      setLoading(false)
    }
  }

  function toggleFixture(
    fixtureId: number
  ) {
    setSelectedIds((current) =>
      current.includes(fixtureId)
        ? current.filter(
            (id) => id !== fixtureId
          )
        : [...current, fixtureId]
    )
  }

  async function importMatches() {
    const selectedFixtures =
      fixtures.filter((fixture) =>
        selectedIds.includes(fixture.id)
      )

    if (selectedFixtures.length === 0) {
      setError(
        "Select at least one match."
      )
      return
    }

    setImporting(true)
    setError("")
    setMessage("")

    try {
      const matchesToImport =
        selectedFixtures.map(
          (fixture) => ({
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
          })
        )

      await importMatchesSecure(
        matchdayId,
        matchesToImport
      )

      setMessage(
        `${selectedFixtures.length} match${
          selectedFixtures.length === 1
            ? ""
            : "es"
        } imported or updated.`
      )

      setFixtures([])
      setSelectedIds([])
      await onImported?.()
    } catch (importError) {
      console.error(importError)
      setError(
        "Could not save the selected matches in Supabase."
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      style={{
        marginTop: "12px",
        background:
          "rgba(255,255,255,0.05)",
        border:
          "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "18px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          marginBottom: "16px",
        }}
      >
        Import Matches
      </div>

      <div
        style={{
          color: "#9CA3AF",
          fontSize: "12px",
          marginBottom: "6px",
        }}
      >
        League
      </div>

      <input
        value="SuperLiga Romania"
        disabled
        style={{
          ...fieldStyle,
          marginBottom: "14px",
          background:
            "rgba(255,255,255,0.04)",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        <label
          style={{
            color: "#9CA3AF",
            fontSize: "12px",
          }}
        >
          Season
          <select
            value={season}
            onChange={(event) =>
              setSeason(
                event.target.value
              )
            }
            style={{
              ...fieldStyle,
              marginTop: "6px",
              background: "#1C1C1C",
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
                {item.year}
                {item.current
                  ? " · Current"
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            color: "#9CA3AF",
            fontSize: "12px",
          }}
        >
          Matchday
          <select
            value={matchday}
            onChange={(event) =>
              setMatchday(
                event.target.value
              )
            }
            style={{
              ...fieldStyle,
              marginTop: "6px",
              background: "#1C1C1C",
            }}
          >
            {Array.from(
              { length: 30 },
              (_, index) =>
                index + 1
            ).map((number) => (
              <option
                key={number}
                value={number}
              >
                Matchday {number}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={loadMatches}
        disabled={
          loading || importing
        }
        style={{
          width: "100%",
          height: "52px",
          borderRadius: "999px",
          border:
            "1px solid rgba(109,255,78,0.25)",
          background:
            "rgba(109,255,78,0.12)",
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "14px",
          cursor:
            loading || importing
              ? "wait"
              : "pointer",
          opacity:
            loading || importing
              ? 0.65
              : 1,
        }}
      >
        {loading
          ? "Loading..."
          : "Load Matches"}
      </button>

      {fixtures.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            display: "grid",
            gap: "8px",
          }}
        >
          {fixtures.map((fixture) => (
            <label
              key={fixture.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "22px 30px minmax(0, 1fr) 30px",
                gap: "10px",
                alignItems: "center",
                padding: "11px 12px",
                borderRadius: "14px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                background:
                  "rgba(255,255,255,0.035)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(
                  fixture.id
                )}
                onChange={() =>
                  toggleFixture(
                    fixture.id
                  )
                }
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor:
                    "#6DFF4E",
                }}
              />

              <TeamBadge
                name={fixture.homeTeam}
                logo={fixture.homeLogo}
                size={30}
              />

              <span
                style={{
                  minWidth: 0,
                  fontSize: "13px",
                  fontWeight: 650,
                }}
              >
                {fixture.homeTeam}
                <span
                  style={{
                    color: "#9CA3AF",
                    margin: "0 7px",
                  }}
                >
                  vs
                </span>
                {fixture.awayTeam}
              </span>

              <TeamBadge
                name={fixture.awayTeam}
                logo={fixture.awayLogo}
                size={30}
              />
            </label>
          ))}

          <button
            type="button"
            onClick={importMatches}
            disabled={
              importing ||
              selectedIds.length === 0
            }
            style={{
              width: "100%",
              height: "52px",
              marginTop: "6px",
              borderRadius: "999px",
              border:
                "1px solid rgba(109,255,78,0.36)",
              background:
                "linear-gradient(135deg, rgba(109,255,78,0.26), rgba(109,255,78,0.10))",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              cursor: importing
                ? "wait"
                : "pointer",
              opacity:
                selectedIds.length === 0
                  ? 0.5
                  : 1,
            }}
          >
            {importing
              ? "Importing..."
              : `Import Selected (${selectedIds.length})`}
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "12px",
            color: "#FF7B7B",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "12px",
            color: "#9CF989",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default ImportMatchesForm
