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

            border:
              "1px solid rgba(255,255,255,0.08)",

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

              boxSizing:
                "border-box",
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
                  "1px solid rgba(109,255,78,0.25)",

                borderRadius:
                  "999px",

                background:
                  "rgba(109,255,78,0.12)",

                backdropFilter:
                  "blur(18px)",

                WebkitBackdropFilter:
                  "blur(18px)",

                boxShadow:
                  "0 6px 18px rgba(109,255,78,0.12)",

                color:
                  "#FFFFFF",

                fontSize:
                  "14px",

                fontWeight:
                  700,

                cursor:
                  "pointer",
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
                  "1px solid rgba(255,92,92,0.25)",

                borderRadius:
                  "999px",

                background:
                  "rgba(255,92,92,0.10)",

                backdropFilter:
                  "blur(18px)",

                WebkitBackdropFilter:
                  "blur(18px)",

                boxShadow:
                  "0 6px 18px rgba(255,92,92,0.12)",

                color:
                  "#FF6B6B",

                fontSize:
                  "14px",

                fontWeight:
                  700,

                cursor:
                  "pointer",
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