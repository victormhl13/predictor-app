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

    try {
      const lpfSettled =
        await Promise.allSettled(
          lpfIds.map((id) =>
            fetchLpfResult(id)
          )
        )

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
