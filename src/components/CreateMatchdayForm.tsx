import { useState } from "react"

type Props = {
  onCreate: (
    name: string
  ) => void
}

function CreateMatchdayForm({
  onCreate,
}: Props) {
  const [name, setName] =
    useState("")

  const [
    isOpen,

    setIsOpen,
  ] = useState(false)

  function handleSubmit() {
    if (!name.trim())
      return

    onCreate(name)

    setName("")

    setIsOpen(false)
  }

  return (
    <div
      style={{
        marginBottom:
          "24px",
      }}
    >
      {!isOpen ? (
        <button
          onClick={() =>
            setIsOpen(true)
          }

          style={{
            width: "100%",

            height: "52px",

            border: "none",

            borderRadius:
              "18px",

            background:
              "rgba(255,255,255,0.06)",

            color:
              "#FFFFFF",

            fontSize:
              "16px",

            fontWeight:
              600,

            cursor:
              "pointer",
          }}
        >
          + New Matchday
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
            placeholder="Matchday name"

            value={name}

            onChange={(
              e
            ) =>
              setName(
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

              outline:
                "none",

              marginBottom:
                "12px",
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
              Create
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

export default CreateMatchdayForm