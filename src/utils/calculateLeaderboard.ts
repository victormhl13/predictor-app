import type {
  Match,

  Prediction,

  User,
} from "../types"

export function calculateLeaderboard(
  users: User[],

  predictions: Prediction[],

  matches: Match[]
) {
  const leaderboard =
    users.map((user) => {
      let points = 0

      predictions

        .filter(
          (prediction) =>
            prediction.user_id ===
            user.id
        )

        .forEach(
          (prediction) => {
            const match =
              matches.find(
                (m) =>
                  m.id ===
                  prediction.match_id
              )

            if (!match)
              return

            if (
              match.home_score ===
                null ||

              match.away_score ===
                null
            ) {
              return
            }

            if (
              prediction.home_prediction ===
                match.home_score &&

              prediction.away_prediction ===
                match.away_score
            ) {
              points += 3

              return
            }

            const predicted =
              Math.sign(
                prediction.home_prediction -

                  prediction.away_prediction
              )

            const result =
              Math.sign(
                match.home_score -

                  match.away_score
              )

            if (
              predicted ===
              result
            ) {
              points += 1
            }
          }
        )

      return {
        ...user,

        points,
      }
    })

  leaderboard.sort(
    (a, b) =>
      b.points - a.points
  )

  return leaderboard
}