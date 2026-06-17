import { useState } from "react"

type Props = {
  matchId: string

  currentHomeScore:
    | number
    | null

  currentAwayScore:
    | number
    | null

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
  const [
    homeScore,

    setHomeScore,
  ] = useState(
    currentHomeScore ??
      ""
  )

  const [
    awayScore,

    setAwayScore,
  ] = useState(
    currentAwayScore ??
      ""
  )

  function handleSubmit() {
    if (
      homeScore ===
        "" ||

      awayScore === ""
    ) {
      return
    }

    onSave(
      matchId,

      Number(
        homeScore
      ),

      Number(
        awayScore
      )
    )
  }

  return (
    <div
      style={{
        marginTop:
          "16px",

        padding:
          "16px",

        background:
          "rgba(255,255,255,0.04)",

        border:
          "1px solid rgba(255,255,255,0.08)",

        borderRadius:
          "18px",
      }}
    >
      <div
        style={{
          fontSize:
            "13px",

          color:
            "#9CA3AF",

          marginBottom:
            "14px",

          textAlign:
            "center",

          fontWeight:
            600,
        }}
      >
        Final score
      </div>

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          gap: "16px",

          marginBottom:
            "18px",
        }}
      >
        <input
          type="number"

          min="0"

          value={
            homeScore
          }

          onChange={(
            e
          ) =>
            setHomeScore(
              e.target.value
            )
          }

          style={{
            width:
              "72px",

            height:
              "56px",

            textAlign:
              "center",

            fontSize:
              "22px",

            fontWeight:
              700,

            border:
              "1px solid rgba(255,255,255,0.10)",

            borderRadius:
              "16px",

            background:
              "rgba(255,255,255,0.05)",

            color:
              "#FFFFFF",

            outline:
              "none",
          }}
        />

        <div
          style={{
            fontSize:
              "28px",

            color:
              "#9CA3AF",

            fontWeight:
              700,
          }}
        >
          -
        </div>

        <input
          type="number"

          min="0"

          value={
            awayScore
          }

          onChange={(
            e
          ) =>
            setAwayScore(
              e.target.value
            )
          }

          style={{
            width:
              "72px",

            height:
              "56px",

            textAlign:
              "center",

            fontSize:
              "22px",

            fontWeight:
              700,

            border:
              "1px solid rgba(255,255,255,0.10)",

            borderRadius:
              "16px",

            background:
              "rgba(255,255,255,0.05)",

            color:
              "#FFFFFF",

            outline:
              "none",
          }}
        />
      </div>

      <button
        onClick={
          handleSubmit
        }

        style={{
          width:
            "100%",

          height:
            "48px",

          border:
            "none",

          borderRadius:
            "14px",

          background:
            "#6DFF4E",

          color:
            "#05080F",

          fontWeight:
            700,

          fontSize:
            "15px",

          cursor:
            "pointer",
        }}
      >
        Save Score
      </button>
    </div>
  )
}

export default FinalScoreForm