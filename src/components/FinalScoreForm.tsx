import { useState } from "react"
import ScorePairControl from "./ScorePairControl"

type Props = {
  matchId: string
  currentHomeScore: number | null
  currentAwayScore: number | null
  onSave: (
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => void
}

function FinalScoreForm({
  matchId,
  currentHomeScore,
  currentAwayScore,
  onSave,
}: Props) {
  const [homeScore, setHomeScore] =
    useState(
      currentHomeScore ?? 0
    )
  const [awayScore, setAwayScore] =
    useState(
      currentAwayScore ?? 0
    )

  function updateScore(
    side: "home" | "away",
    value: number
  ) {
    if (side === "home") {
      setHomeScore(value)
      return
    }

    setAwayScore(value)
  }

  function handleSubmit() {
    onSave(
      matchId,
      homeScore,
      awayScore
    )
  }

  return (
    <div
      style={{
        width: "100%",
        margin: "12px auto 0",
        padding: "14px 12px 13px",
        background:
          "rgba(255,255,255,0.015)",
        border:
          "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
      }}
    >
      <div
        style={{
          color: "#9CA3AF",
          fontSize: "11px",
          fontWeight: 700,
          marginBottom: "12px",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Final score
      </div>

      <ScorePairControl
        home={homeScore}
        away={awayScore}
        onChange={updateScore}
      />

      <button
        type="button"
        onClick={handleSubmit}
        style={{
          display: "block",
          width: "100%",
          height: "44px",
          margin: "12px auto 0",
          padding: "0 22px",
          border:
            "1px solid rgba(109,255,78,0.34)",
          borderRadius: "999px",
          background:
            "linear-gradient(145deg, rgba(109,255,78,0.30), rgba(109,255,78,0.10))",
          color: "#FFFFFF",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.16), 0 7px 18px rgba(109,255,78,0.12)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter:
            "blur(14px)",
          fontSize: "13px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  )
}

export default FinalScoreForm
