import { useState } from "react"

function TestApi() {
  const [result, setResult] =
    useState("")

  async function testApi() {
    try {
      const params =
        new URLSearchParams({
          season: "2025",
          round:
            "Regular Season - 1",
        })

      const response = await fetch(
        `/api/import-superliga?${params.toString()}`
      )

      const data =
        await response.json()

      setResult(
        response.ok
          ? `Success: ${
              data.fixtures?.length ||
              0
            } matches found`
          : data.error ||
              "API error"
      )

      console.log(data)
    } catch (error) {
      console.log(error)

      setResult("API error")
    }
  }

  return (
    <div>
      <button
        onClick={testApi}
      >
        Test API
      </button>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        {result}
      </div>
    </div>
  )
}

export default TestApi
