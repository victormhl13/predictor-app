import { useState } from "react"
import { Plus, X } from "lucide-react"

import { supabase } from "../lib/supabase"
import TeamBadge from "./TeamBadge"

type Fixture = {
  id: number
  kickoff: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string | null
  awayLogo?: string | null
}

type Props = {
  onCreated: () =>
    void | Promise<void>
}

function AddMatchdayFlow({
  onCreated,
}: Props) {
  const [open, setOpen] =
    useState(false)
  const [matchday, setMatchday] =
    useState("1")
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
      const params =
        new URLSearchParams({
          season: "2024",
          round:
            `Regular Season - ${matchday}`,
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
      const name =
        `Matchday ${matchday}`
      const {
        data: existingMatchday,
      } = await supabase
        .from("matchdays")
        .select("id")
        .eq("name", name)
        .maybeSingle()

      let matchdayId =
        existingMatchday?.id

      if (!matchdayId) {
        const {
          data: created,
          error: createError,
        } = await supabase
          .from("matchdays")
          .insert([
            {
              name,
              is_open: true,
            },
          ])
          .select("id")
          .single()

        if (
          createError ||
          !created
        ) {
          throw createError
        }

        matchdayId = created.id
      }

      const fixtureIds =
        chosen.map(
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
        (existingMatches || [])
          .map(
            (match) =>
              match.api_fixture_id
          )
          .filter(
            (id): id is number =>
              id !== null
          )
      )

      const toInsert = chosen
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
          home_team_logo:
            fixture.homeLogo || null,
          away_team_logo:
            fixture.awayLogo || null,
        }))

      if (toInsert.length > 0) {
        const { error: insertError } =
          await supabase
            .from("matches")
            .insert(toInsert)

        if (insertError) {
          throw insertError
        }
      }

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

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="primary-button"
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
            zIndex: 120,
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "18px",
            background:
              "rgba(3,6,12,0.74)",
            backdropFilter:
              "blur(8px)",
          }}
          onClick={close}
        >
          <div
            className="surface"
            style={{
              width: "100%",
              maxWidth: "390px",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "16px",
              borderRadius:
                "24px 24px 18px 18px",
              background:
                "rgba(10,15,24,0.97)",
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

            <label className="section-label">
              SuperLiga 2024
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

            <button
              type="button"
              onClick={loadFixtures}
              disabled={loading}
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
