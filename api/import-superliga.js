import {
  fetchLpfPage,
  parsePlayoffEdition,
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
    const phase =
      url.searchParams.get("phase") ||
      "regular"

    if (
      !Number.isInteger(round) ||
      round < 1 ||
      round >
        (phase === "playoff"
          ? 10
          : 30)
    ) {
      return json(
        { error: "Invalid matchday." },
        400
      )
    }

    if (
      phase !== "regular" &&
      phase !== "playoff"
    ) {
      return json(
        { error: "Invalid phase." },
        400
      )
    }

    try {
      const leagueHtml =
        await fetchLpfPage(
          "/liga-1"
        )
      const season =
        parseSeason(leagueHtml)

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

      let fixturesHtml
      if (phase === "playoff") {
        const edition =
          parsePlayoffEdition(
            leagueHtml
          )
        if (!edition) {
          return json(
            {
              error:
                "LPF has not published the play-off fixtures yet.",
              season,
            },
            404
          )
        }
        fixturesHtml =
          await fetchLpfPage(
            `/ajax/rezultate-etapa.php?editie=${edition}&etapa=${round}`
          )
      } else {
        fixturesHtml =
          await fetchLpfPage(
            `/etape-liga-1/${round}`
          )
      }

      return json({
        fixtures:
          parseRound(fixturesHtml),
        season,
        phase,
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
