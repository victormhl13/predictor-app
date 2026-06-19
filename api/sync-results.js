import {
  fetchLpfResult,
} from "./_lpf.js"

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control":
        "no-store",
    },
  })
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

async function syncLegacyApiFootball(
  ids
) {
  const apiUrl =
    process.env.API_FOOTBALL_URL
  const apiKey =
    process.env.API_FOOTBALL_KEY

  if (
    ids.length === 0 ||
    !apiUrl ||
    !apiKey
  ) {
    return []
  }

  const responses = await Promise.all(
    chunks(ids, 20).map(
      async (group) => {
        const endpoint = new URL(
          `${apiUrl.replace(
            /\/$/,
            ""
          )}/fixtures`
        )
        endpoint.searchParams.set(
          "ids",
          group.join("-")
        )
        const response = await fetch(
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
            "Legacy API-Football sync failed"
          )
        }
        return data.response || []
      }
    )
  )

  return responses
    .flat()
    .map((item) => ({
      id: item.fixture?.id,
      status:
        item.fixture?.status?.short,
      homeScore:
        item.goals?.home,
      awayScore:
        item.goals?.away,
    }))
    .filter((item) =>
      Number.isInteger(item.id)
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

    const url = new URL(request.url)
    const ids = (
      url.searchParams.get("ids") ||
      ""
    )
      .split(",")
      .map(Number)
      .filter(Number.isInteger)
      .slice(0, 100)

    if (ids.length === 0) {
      return json({ fixtures: [] })
    }

    const lpfIds = ids.filter(
      (id) => id < 0
    )
    const legacyIds = ids.filter(
      (id) => id > 0
    )

    try {
      const [
        lpfSettled,
        legacyFixtures,
      ] = await Promise.all([
        Promise.allSettled(
          lpfIds.map((id) =>
            fetchLpfResult(id)
          )
        ),
        syncLegacyApiFootball(
          legacyIds
        ),
      ])

      const lpfFixtures =
        lpfSettled
          .filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
          .map(
            (result) =>
              result.value
          )

      return json({
        fixtures: [
          ...lpfFixtures,
          ...legacyFixtures,
        ],
        source: "LPF",
      })
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
