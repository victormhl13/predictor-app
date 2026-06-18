function json(data, status = 200) {
  return Response.json(data, { status })
}

function chunks(items, size) {
  const result = []
  for (
    let index = 0;
    index < items.length;
    index += size
  ) {
    result.push(
      items.slice(
        index,
        index + size
      )
    )
  }
  return result
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
    const url = new URL(request.url)
    const ids = (
      url.searchParams.get("ids") ||
      ""
    )
      .split(",")
      .map(Number)
      .filter(Number.isInteger)
      .slice(0, 100)

    if (!apiUrl || !apiKey) {
      return json(
        {
          error:
            "API-Football is not configured.",
        },
        500
      )
    }

    if (ids.length === 0) {
      return json({ fixtures: [] })
    }

    try {
      const responses =
        await Promise.all(
          chunks(ids, 20).map(
            async (group) => {
              const endpoint =
                new URL(
                  `${apiUrl.replace(/\/$/, "")}/fixtures`
                )
              endpoint.searchParams.set(
                "ids",
                group.join("-")
              )
              const response =
                await fetch(
                  endpoint,
                  {
                    headers: {
                      "x-apisports-key":
                        apiKey,
                    },
                  }
                )
              const data =
                await response.json()
              if (
                !response.ok ||
                Object.keys(
                  data.errors || {}
                ).length > 0
              ) {
                throw new Error(
                  "API-Football sync failed"
                )
              }
              return data.response || []
            }
          )
        )

      const fixtures = responses
        .flat()
        .map((item) => ({
          id: item.fixture?.id,
          status:
            item.fixture?.status
              ?.short,
          homeScore:
            item.goals?.home,
          awayScore:
            item.goals?.away,
        }))
        .filter(
          (item) =>
            Number.isInteger(item.id)
        )

      return json({ fixtures })
    } catch (error) {
      console.error(error)
      return json(
        {
          error:
            "Could not synchronize results.",
        },
        502
      )
    }
  },
}
