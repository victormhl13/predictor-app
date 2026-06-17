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

  const [
    isOpen,

    setIsOpen,
  ] = useState(false)

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

    setIsOpen(false)
  }

  return (
    <div
      style={{
        marginTop: "16px",

        marginBottom:
          "20px",
      }}
    >
      {!isOpen ? (
        <button
          onClick={() =>
            setIsOpen(true)
          }

          style={{
            width: "100%",

            height: "48px",

            border: "none",

            borderRadius:
              "16px",

            background:
              "rgba(255,255,255,0.06)",

            color:
              "#FFFFFF",

            fontSize:
              "15px",

            fontWeight:
              600,
          }}
        >
          + Add Match
        </button>
      ) : (
        <div
          style={{
            background:
              "rgba(255,255,255,0.05)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "20px",

            padding:
              "18px",
          }}
        >
          <input
            placeholder="Home team"

            value={homeTeam}

            onChange={(
              e
            ) =>
              setHomeTeam(
                e.target.value
              )
            }

            style={{
              width:
                "100%",

              height:
                "48px",

              padding:
                "0 16px",

              border:
                "1px solid rgba(255,255,255,0.10)",

              borderRadius:
                "14px",

              background:
                "rgba(255,255,255,0.05)",

              color:
                "#FFFFFF",

              marginBottom:
                "12px",

              outline:
                "none",
            }}
          />

          <input
            placeholder="Away team"

            value={awayTeam}

            onChange={(
              e
            ) =>
              setAwayTeam(
                e.target.value
              )
            }

            style={{
              width:
                "100%",

              height:
                "48px",

              padding:
                "0 16px",

              border:
                "1px solid rgba(255,255,255,0.10)",

              borderRadius:
                "14px",

              background:
                "rgba(255,255,255,0.05)",

              color:
                "#FFFFFF",

              marginBottom:
                "12px",

              outline:
                "none",
            }}
          />

          <input
            type="datetime-local"

            value={kickoff}

            onChange={(
              e
            ) =>
              setKickoff(
                e.target.value
              )
            }

            style={{
              width:
                "100%",

              height:
                "48px",

              padding:
                "0 16px",

              border:
                "1px solid rgba(255,255,255,0.10)",

              borderRadius:
                "14px",

              background:
                "rgba(255,255,255,0.05)",

              color:
                "#FFFFFF",

              marginBottom:
                "16px",

              outline:
                "none",
            }}
          />

          <div
            style={{
              display:
                "flex",

              gap: "12px",
            }}
          >
            <button
              onClick={
                handleSubmit
              }

              style={{
                flex: 1,

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
              }}
            >
              Add Match
            </button>

            <button
              onClick={() =>
                setIsOpen(
                  false
                )
              }

              style={{
                flex: 1,

                height:
                  "48px",

                border:
                  "1px solid rgba(255,255,255,0.10)",

                borderRadius:
                  "14px",

                background:
                  "transparent",

                color:
                  "#FFFFFF",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddMatchForm