import {
  fetchLpfPage,
  parseRound,
  parseSeason,
} from "./_lpf.js"

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control":
        "public, s-maxage=300, stale-while-revalidate=900",
    },
  })
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json(
        { error: "Method not allowed" },
        405
      )
    }

    const url = new URL(request.url)
    const requestedSeason =
      url.searchParams.get("season")
    const roundValue =
      url.searchParams.get("round") ||
      "1"
    const roundMatch =
      roundValue.match(/(\d+)$/)
    const round = Number(
      roundMatch?.[1] || roundValue
    )

    if (
      !Number.isInteger(round) ||
      round < 1 ||
      round > 30
    ) {
      return json(
        { error: "Invalid matchday." },
        400
      )
    }

    try {
      const html = await fetchLpfPage(
        `/etape-liga-1/${round}`
      )
      const season = parseSeason(html)

      if (
        requestedSeason &&
        season &&
        Number(requestedSeason) !==
          season.year
      ) {
        return json(
          {
            error: `LPF currently publishes season ${season.label}.`,
            season,
          },
          409
        )
      }

      return json({
        fixtures: parseRound(html),
        season,
        source: "LPF",
      })
    } catch (error) {
      console.error(
        "Could not load LPF fixtures",
        error
      )
      return json(
        {
          error:
            "Could not load matches from LPF. You can still create the matchday manually.",
        },
        502
      )
    }
  },
}
