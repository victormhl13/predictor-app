export default async function handler(req, res) {
  try {
    const season =
      req.query.season || "2025"

    const round =
      req.query.round ||
      "Regular Season - 1"

    const response =
      await fetch(
        `${process.env.API_FOOTBALL_URL}/fixtures?league=283&season=${season}&round=${encodeURIComponent(round)}`,
        {
          headers: {
            "x-apisports-key":
              process.env.API_FOOTBALL_KEY,
          },
        }
      )

    const data =
      await response.json()

    return res
      .status(200)
      .json(data)
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          "Could not load fixtures",
      })
  }
}