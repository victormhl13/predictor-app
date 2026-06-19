import type {
  Match,
  Prediction,
  User,
} from "../types"

export function predictionPoints(
  prediction: Prediction,
  match: Match
) {
  if (
    match.home_score === null ||
    match.away_score === null
  ) {
    return 0
  }
  if (
    prediction.home_prediction ===
      match.home_score &&
    prediction.away_prediction ===
      match.away_score
  ) {
    return 3
  }
  return Math.sign(
    prediction.home_prediction -
      prediction.away_prediction
  ) ===
    Math.sign(
      match.home_score -
        match.away_score
    )
    ? 1
    : 0
}

export function rankedPlayers(
  users: User[],
  predictions: Prediction[],
  matches: Match[],
  allowedMatchIds?: Set<string>
) {
  return users
    .map((user) => ({
      ...user,
      points: predictions
        .filter(
          (prediction) =>
            prediction.user_id ===
              user.id &&
            (!allowedMatchIds ||
              allowedMatchIds.has(
                prediction.match_id
              ))
        )
        .reduce((total, prediction) => {
          const match = matches.find(
            (item) =>
              item.id ===
              prediction.match_id
          )
          return (
            total +
            (match
              ? predictionPoints(
                  prediction,
                  match
                )
              : 0)
          )
        }, 0),
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.name.localeCompare(b.name)
    )
}

export function personalStats(
  predictions: Prediction[],
  matches: Match[]
) {
  let exact = 0
  let outcomes = 0
  let scored = 0
  let points = 0
  const byMatchday =
    new Map<string, number>()

  predictions.forEach(
    (prediction) => {
      const match = matches.find(
        (item) =>
          item.id ===
          prediction.match_id
      )
      if (
        !match ||
        match.home_score === null ||
        match.away_score === null
      ) {
        return
      }
      scored += 1
      const earned =
        predictionPoints(
          prediction,
          match
        )
      points += earned
      if (earned === 3) exact += 1
      if (earned > 0) outcomes += 1
      byMatchday.set(
        match.matchday_id,
        (byMatchday.get(
          match.matchday_id
        ) || 0) + earned
      )
    }
  )

  return {
    points,
    exact,
    outcomes,
    scored,
    accuracy:
      scored > 0
        ? Math.round(
            (outcomes / scored) * 100
          )
        : 0,
    bestMatchday:
      Math.max(
        0,
        ...byMatchday.values()
      ),
  }
}
