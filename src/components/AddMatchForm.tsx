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
        marginTop: "12px",
        marginBottom: "14px",
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() =>
            setIsOpen(true)
          }
          className="glass-button"
          style={{ width: "100%" }}
        >
          + Add Match
        </button>
      ) : (
        <div
          className="surface-soft"
          style={{
            padding: "13px",
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
            className="field"
            style={{ marginBottom: "9px" }}
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
            className="field"
            style={{ marginBottom: "9px" }}
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
            className="field"
            style={{ marginBottom: "11px" }}
          />

          <div
            style={{
              display:
                "flex",

              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={
                handleSubmit
              }
              className="primary-button"
              style={{ flex: 1 }}
            >
              Add Match
            </button>

            <button
              type="button"
              onClick={() =>
                setIsOpen(
                  false
                )
              }
              className="glass-button"
              style={{ flex: 1 }}
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
