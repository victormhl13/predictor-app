import { useState } from "react"

type Props = {
  onCreate: (name: string) => void
}

function CreateMatchdayForm({
  onCreate,
}: Props) {
  const [name, setName] =
    useState("")

  function handleSubmit() {
    if (!name.trim()) return

    onCreate(name)

    setName("")
  }

  return (
    <div
      style={{
        marginBottom: "24px",
      }}
    >
      <h3>
        ➕ Create Matchday
      </h3>

      <input
        placeholder="Matchday name"

        value={name}

        onChange={(e) =>
          setName(e.target.value)
        }

        style={{
          width: "220px",

          padding: "10px",

          borderRadius: "8px",

          border:
            "1px solid #2A2A2A",

          marginRight: "12px",
        }}
      />

      <button
        onClick={handleSubmit}
      >
        Create
      </button>
    </div>
  )
}

export default CreateMatchdayForm