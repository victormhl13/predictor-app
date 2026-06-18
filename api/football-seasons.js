const SUPERLIGA_ID = 283

function json(data, status = 200) {
  return Response.json(data, { status })
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
            "API-Football is not configured.",
        },
        500
      )
    }

    const endpoint = new URL(
      `${apiUrl.replace(/\/$/, "")}/leagues`
    )
    endpoint.searchParams.set(
      "id",
      String(SUPERLIGA_ID)
    )

    try {
      const response = await fetch(endpoint, {
        headers: {
          "x-apisports-key": apiKey,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        return json(
          {
            error:
              "Could not load seasons.",
          },
          502
        )
      }

      const seasons = (
        data.response?.[0]
          ?.seasons || []
      )
        .map((item) => ({
          year: item.year,
          current:
            Boolean(item.current),
          start: item.start,
          end: item.end,
        }))
        .filter(
          (item) =>
            Number.isInteger(item.year)
        )
        .sort(
          (a, b) =>
            b.year - a.year
        )

      return json({ seasons })
    } catch (error) {
      console.error(error)
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
