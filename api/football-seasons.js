import {
  fetchLpfPage,
  parseSeason,
} from "./_lpf.js"

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control":
        "public, s-maxage=3600, stale-while-revalidate=86400",
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

    try {
      const html = await fetchLpfPage(
        "/liga-1"
      )
      const season = parseSeason(html)
      if (!season) {
        throw new Error(
          "Season not found"
        )
      }

      return json({
        seasons: [season],
        source: "LPF",
      })
    } catch (error) {
      console.error(error)
      return json(
        {
          error:
            "Could not load the current LPF season.",
        },
        502
      )
    }
  },
}
