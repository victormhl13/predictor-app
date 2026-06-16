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

function FinalScoreForm({
  matchId,

  currentHomeScore,

  currentAwayScore,

  onSave,
}: Props) {
  const [homeScore, setHomeScore] =
    useState(
      currentHomeScore ?? ""
    )

  const [awayScore, setAwayScore] =
    useState(
      currentAwayScore ?? ""
    )

  function handleSubmit() {
    if (
      homeScore === "" ||

      awayScore === ""
    ) {
      return
    }

    onSave(
      matchId,

      Number(homeScore),

      Number(awayScore)
    )
  }

  return (
    <div
      style={{
        marginTop: "12px",

        padding: "12px",

        border:
          "1px solid #2A2A2A",

        borderRadius: "10px",
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent:
            "center",

          gap: "12px",

          marginBottom:
            "12px",
        }}
      >
        <input
          type="number"

          min="0"

          value={homeScore}

          onChange={(e) =>
            setHomeScore(
              e.target.value
            )
          }

          style={{
            width: "60px",

            textAlign:
              "center",
          }}
        />

        <span>
          -
        </span>

        <input
          type="number"

          min="0"

          value={awayScore}

          onChange={(e) =>
            setAwayScore(
              e.target.value
            )
          }

          style={{
            width: "60px",

            textAlign:
              "center",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
      >
        💾 Save Final Score
      </button>
    </div>
  )
}

export default FinalScoreForm