const API_URL =
  import.meta.env
    .VITE_API_FOOTBALL_URL

const API_KEY =
  import.meta.env
    .VITE_API_FOOTBALL_KEY

async function apiRequest(
  endpoint: string
) {
  try {
    const response =
      await fetch(
        `${API_URL}${endpoint}`,
        {
          headers: {
            "x-apisports-key":
              API_KEY,
          },
        }
      )

    const data =
      await response.json()

    return data.response
  } catch (error) {
    console.log(error)

    return []
  }
}

export async function getLeagues() {
  return apiRequest("/leagues")
}

export async function getFixtures(
  league: number,
  season: number
) {
  return apiRequest(
    `/fixtures?league=${league}&season=${season}`
  )
}