import { useState } from "react"

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

type ScoreControlProps = {
  side: "home" | "away"
  score: number
  onChange: (
    side: "home" | "away",
    difference: number
  ) => void
}

function ScoreControl({
  side,
  score,
  onChange,
}: ScoreControlProps) {
  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "50px",
          display: "grid",
          placeItems: "center",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: "15px",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.16)",
          color: "#FFFFFF",
          fontSize: "22px",
          fontWeight: 800,
        }}
      >
        {score}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          type="button"
          aria-label={`Decrease ${side} score`}
          onClick={() =>
            onChange(side, -1)
          }
          disabled={score === 0}
          style={{
            width: "42px",
            height: "40px",
            padding: 0,
            border:
              "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
            color: "#FFFFFF",
            fontSize: "22px",
            lineHeight: 1,
            cursor:
              score === 0
                ? "default"
                : "pointer",
            opacity:
              score === 0
                ? 0.35
                : 1,
          }}
        >
          −
        </button>

        <button
          type="button"
          aria-label={`Increase ${side} score`}
          onClick={() =>
            onChange(side, 1)
          }
          style={{
            width: "42px",
            height: "40px",
            padding: 0,
            border:
              "1px solid rgba(109,255,78,0.28)",
            borderRadius: "12px",
            background:
              "linear-gradient(145deg, rgba(109,255,78,0.20), rgba(109,255,78,0.06))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.10)",
            color: "#FFFFFF",
            fontSize: "22px",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>
    </div>
  )
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
    difference: number
  ) {
    if (side === "home") {
      setHomeScore((score) =>
        Math.max(
          0,
          score + difference
        )
      )
      return
    }

    setAwayScore((score) =>
      Math.max(
        0,
        score + difference
      )
    )
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

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "start",
          gap: "18px",
        }}
      >
        <ScoreControl
          side="home"
          score={homeScore}
          onChange={updateScore}
        />

        <div
          style={{
            paddingTop: "11px",
            color: "#9CA3AF",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          -
        </div>

        <ScoreControl
          side="away"
          score={awayScore}
          onChange={updateScore}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        style={{
          display: "block",
          minWidth: "92px",
          height: "38px",
          margin: "13px auto 0",
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
