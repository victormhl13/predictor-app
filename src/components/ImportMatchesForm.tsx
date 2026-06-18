import { useState } from "react"

type Props = {
  matchdayId: string
}

function ImportMatchesForm({
  matchdayId,
}: Props) {
  const [season, setSeason] =
    useState("2025")

  const [round, setRound] =
    useState("Regular Season - 1")

  async function loadMatches() {
    console.log(
      "Load matches",
      matchdayId,
      season,
      round
    )
  }

  return (
    <div
      style={{
        marginTop: "12px",

        background:
          "rgba(255,255,255,0.05)",

        border:
          "1px solid rgba(255,255,255,0.08)",

        borderRadius:
          "18px",

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
          width: "100%",

          height: "48px",

          marginBottom: "14px",

          padding: "0 16px",

          boxSizing:
            "border-box",

          borderRadius:
            "16px",

          border:
            "1px solid rgba(255,255,255,0.08)",

          background:
            "rgba(255,255,255,0.04)",

          color:
            "#FFFFFF",
        }}
      />

      <div
        style={{
          color: "#9CA3AF",

          fontSize: "12px",

          marginBottom: "6px",
        }}
      >
        Season
      </div>

      <select
        value={season}

        onChange={(e) =>
          setSeason(
            e.target.value
          )
        }

        style={{
          width: "100%",

          height: "48px",

          marginBottom: "14px",

          padding: "0 16px",

          borderRadius:
            "16px",

          border:
            "1px solid rgba(255,255,255,0.08)",

          background:
            "#1C1C1C",

          color:
            "#FFFFFF",
        }}
      >
        <option value="2025">
          2025
        </option>

        <option value="2026">
          2026
        </option>
      </select>

      <div
        style={{
          color: "#9CA3AF",

          fontSize: "12px",

          marginBottom: "6px",
        }}
      >
        Round
      </div>

      <input
        value={round}

        onChange={(e) =>
          setRound(
            e.target.value
          )
        }

        style={{
          width: "100%",

          height: "48px",

          marginBottom: "18px",

          padding: "0 16px",

          boxSizing:
            "border-box",

          borderRadius:
            "16px",

          border:
            "1px solid rgba(255,255,255,0.08)",

          background:
            "rgba(255,255,255,0.05)",

          color:
            "#FFFFFF",
        }}
      />

      <button
        onClick={loadMatches}

        style={{
          width: "100%",

          height: "52px",

          borderRadius:
            "999px",

          border:
            "1px solid rgba(109,255,78,0.25)",

          background:
            "rgba(109,255,78,0.12)",

          color:
            "#FFFFFF",

          fontWeight:
            700,

          fontSize:
            "14px",

          cursor:
            "pointer",
        }}
      >
        Load Matches
      </button>
    </div>
  )
}

export default ImportMatchesForm