export type ApiFixture = {
  id: number
  kickoff: string
  homeTeam: string
  awayTeam: string
}

type FixturesResponse = {
  fixtures?: ApiFixture[]
  error?: string
}

export async function getFixtures(
  season: number,
  round: string
) {
  const params = new URLSearchParams({
    season: String(season),
    round,
  })

  const response = await fetch(
    `/api/import-superliga?${params.toString()}`
  )
  const data =
    (await response.json()) as FixturesResponse

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Could not load fixtures."
    )
  }

  return data.fixtures || []
}
