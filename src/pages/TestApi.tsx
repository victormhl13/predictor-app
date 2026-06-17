import { useState } from "react"

function TestApi() {
  const [result, setResult] =
    useState("")

  async function testApi() {
    try {
      const response =
        await fetch(
          `${import.meta.env.VITE_API_FOOTBALL_URL}/leagues`,
          {
            headers: {
              "x-apisports-key":
                import.meta.env
                  .VITE_API_FOOTBALL_KEY,
            },
          }
        )

      const data =
        await response.json()

      setResult(
        `Success: ${data.results} leagues found`
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