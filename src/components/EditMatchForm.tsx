import { useState } from "react"

import type { Match } from "../types"

function toLocalInput(
  kickoff: string
) {
  const date = new Date(kickoff)
  const offset =
    date.getTimezoneOffset() *
    60000
  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16)
}

function EditMatchForm({
  match,
  onSave,
  onCancel,
}: {
  match: Match
  onSave: (
    homeTeam: string,
    awayTeam: string,
    kickoff: string
  ) => void | Promise<void>
  onCancel: () => void
}) {
  const [homeTeam, setHomeTeam] =
    useState(match.home_team)
  const [awayTeam, setAwayTeam] =
    useState(match.away_team)
  const [kickoff, setKickoff] =
    useState(
      toLocalInput(match.kickoff)
    )

  return (
    <div
      className="surface-soft"
      style={{
        marginTop: "10px",
        padding: "10px",
        display: "grid",
        gap: "8px",
      }}
    >
      <input
        className="field"
        value={homeTeam}
        onChange={(event) =>
          setHomeTeam(
            event.target.value
          )
        }
        placeholder="Home team"
      />
      <input
        className="field"
        value={awayTeam}
        onChange={(event) =>
          setAwayTeam(
            event.target.value
          )
        }
        placeholder="Away team"
      />
      <input
        className="field"
        type="datetime-local"
        value={kickoff}
        onChange={(event) =>
          setKickoff(
            event.target.value
          )
        }
      />
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
          className="glass-button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            onSave(
              homeTeam,
              awayTeam,
              kickoff
            )
          }
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

export default EditMatchForm
