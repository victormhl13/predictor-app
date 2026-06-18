import { useState } from "react"

import { supabase } from "../lib/supabase"

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
}

type FixturesResponse = {
  fixtures?: ApiFixture[]
  error?: string
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
    useState("2024")
  const [round, setRound] =
    useState("Regular Season - 1")
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
          round: round.trim(),
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
      setSelectedIds(
        loadedFixtures.map(
          (fixture) => fixture.id
        )
      )

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
      const fixtureIds =
        selectedFixtures.map(
          (fixture) => fixture.id
        )

      const {
        data: existingMatches,
        error: existingError,
      } = await supabase
        .from("matches")
        .select("api_fixture_id")
        .in(
          "api_fixture_id",
          fixtureIds
        )

      if (existingError) {
        throw existingError
      }

      const existingIds = new Set(
        (
          existingMatches as {
            api_fixture_id:
              | number
              | null
          }[]
        )
          .map(
            (match) =>
              match.api_fixture_id
          )
          .filter(
            (id): id is number =>
              id !== null
          )
      )

      const matchesToInsert =
        selectedFixtures
          .filter(
            (fixture) =>
              !existingIds.has(
                fixture.id
              )
          )
          .map((fixture) => ({
            matchday_id: matchdayId,
            home_team:
              fixture.homeTeam,
            away_team:
              fixture.awayTeam,
            kickoff:
              fixture.kickoff,
            api_fixture_id:
              fixture.id,
          }))

      if (matchesToInsert.length === 0) {
        setMessage(
          "The selected matches were already imported."
        )
        return
      }

      const { error: insertError } =
        await supabase
          .from("matches")
          .insert(matchesToInsert)

      if (insertError) {
        throw insertError
      }

      const skippedCount =
        selectedFixtures.length -
        matchesToInsert.length

      setMessage(
        `${matchesToInsert.length} match${
          matchesToInsert.length === 1
            ? ""
            : "es"
        } imported${
          skippedCount > 0
            ? `, ${skippedCount} already existed`
            : ""
        }.`
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
            "110px minmax(0, 1fr)",
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
            <option value="2024">
              2024
            </option>
            <option value="2026">
              2026
            </option>
          </select>
        </label>

        <label
          style={{
            color: "#9CA3AF",
            fontSize: "12px",
          }}
        >
          Round
          <input
            value={round}
            onChange={(event) =>
              setRound(
                event.target.value
              )
            }
            style={{
              ...fieldStyle,
              marginTop: "6px",
            }}
          />
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
                  "22px minmax(0, 1fr)",
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
