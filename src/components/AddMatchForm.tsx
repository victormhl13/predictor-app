import { useState } from "react"

type Props = {
  matchdayId: string

  onCreate: (
    matchdayId: string,

    homeTeam: string,

    awayTeam: string,

    kickoff: string
  ) => void
}

function AddMatchForm({
  matchdayId,

  onCreate,
}: Props) {
  const [homeTeam, setHomeTeam] =
    useState("")

  const [awayTeam, setAwayTeam] =
    useState("")

  const [kickoff, setKickoff] =
    useState("")

  function handleSubmit() {
    if (
      !homeTeam.trim() ||

      !awayTeam.trim() ||

      !kickoff.trim()
    ) {
      return
    }

    onCreate(
      matchdayId,

      homeTeam,

      awayTeam,

      kickoff
    )

    setHomeTeam("")

    setAwayTeam("")

    setKickoff("")
  }

  return (
    <div
      style={{
        marginTop: "16px",

        marginBottom: "16px",

        padding: "16px",

        border:
          "1px solid #2A2A2A",

        borderRadius: "10px",
      }}
    >
      <h4>➕ Add Match</h4>

      <input
        placeholder="Home team"

        value={homeTeam}

        onChange={(e) =>
          setHomeTeam(
            e.target.value
          )
        }

        style={{
          width: "220px",

          padding: "10px",

          marginBottom: "10px",
        }}
      />

      <br />

      <input
        placeholder="Away team"

        value={awayTeam}

        onChange={(e) =>
          setAwayTeam(
            e.target.value
          )
        }

        style={{
          width: "220px",

          padding: "10px",

          marginBottom: "10px",
        }}
      />

      <br />

      <input
        type="datetime-local"

        value={kickoff}

        onChange={(e) =>
          setKickoff(
            e.target.value
          )
        }

        style={{
          width: "220px",

          padding: "10px",

          marginBottom: "10px",
        }}
      />

      <br />

      <button
        onClick={handleSubmit}
      >
        Add Match
      </button>
    </div>
  )
}

export default AddMatchForm