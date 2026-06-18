const SUPERLIGA_ID = 283

function json(data, status = 200) {
  return Response.json(data, { status })
}

function hasApiErrors(errors) {
  if (Array.isArray(errors)) {
    return errors.length > 0
  }

  return Boolean(
    errors &&
      typeof errors === "object" &&
      Object.keys(errors).length > 0
  )
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json(
        { error: "Method not allowed" },
        405
      )
    }

    const apiUrl =
      process.env.API_FOOTBALL_URL
    const apiKey =
      process.env.API_FOOTBALL_KEY

    if (!apiUrl || !apiKey) {
      return json(
        {
          error:
            "API-Football is not configured on the server.",
        },
        500
      )
    }

    const url = new URL(request.url)
    const season =
      url.searchParams.get("season") ||
      "2025"
    const round =
      url.searchParams.get("round") ||
      "Regular Season - 1"

    if (!/^\d{4}$/.test(season)) {
      return json(
        { error: "Invalid season." },
        400
      )
    }

    if (
      round.length < 1 ||
      round.length > 80
    ) {
      return json(
        { error: "Invalid round." },
        400
      )
    }

    const endpoint = new URL(
      `${apiUrl.replace(/\/$/, "")}/fixtures`
    )

    endpoint.searchParams.set(
      "league",
      String(SUPERLIGA_ID)
    )
    endpoint.searchParams.set(
      "season",
      season
    )
    endpoint.searchParams.set(
      "round",
      round
    )

    try {
      const response = await fetch(endpoint, {
        headers: {
          "x-apisports-key": apiKey,
        },
      })

      const data = await response.json()

      if (
        !response.ok ||
        hasApiErrors(data.errors)
      ) {
        console.error(
          "API-Football request failed",
          response.status,
          data.errors
        )

        return json(
          {
            error:
              "API-Football could not load this round.",
          },
          502
        )
      }

      const fixtures = (
        Array.isArray(data.response)
          ? data.response
          : []
      )
        .map((item) => ({
          id: item.fixture?.id,
          kickoff: item.fixture?.date,
          homeTeam: item.teams?.home?.name,
          awayTeam: item.teams?.away?.name,
          homeLogo: item.teams?.home?.logo,
          awayLogo: item.teams?.away?.logo,
        }))
        .filter(
          (fixture) =>
            Number.isInteger(fixture.id) &&
            fixture.kickoff &&
            fixture.homeTeam &&
            fixture.awayTeam
        )
        .sort(
          (a, b) =>
            new Date(a.kickoff).getTime() -
            new Date(b.kickoff).getTime()
        )

      return json({ fixtures })
    } catch (error) {
      console.error(
        "Could not load fixtures",
        error
      )

      return json(
        {
          error:
            "Could not connect to API-Football.",
        },
        502
      )
    }
  },
}
