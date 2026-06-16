import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function MyPredictions() {
  const { currentUser } = useAuth()

  const [matches, setMatches] =
    useState<any[]>([])

  const [predictions, setPredictions] =
    useState<any>({})

  useEffect(() => {
    loadMatches()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadExistingPredictions()
    }
  }, [currentUser])

  async function loadMatches() {
    const { data, error } =
      await supabase

        .from("matches")

        .select("*")

        .order("kickoff")

    if (error) {
      console.log(error)

      return
    }

    if (data) {
      setMatches(data)
    }
  }

  async function loadExistingPredictions() {
    if (!currentUser) return

    const { data, error } =
      await supabase

        .from("predictions")

        .select("*")

        .eq(
          "user_id",

          currentUser.id
        )

    if (error) {
      console.log(error)

      return
    }

    if (!data) return

    const saved: any = {}

    data.forEach(
      (prediction) => {
        saved[
          prediction.match_id
        ] = {
          home:
            prediction.home_prediction,

          away:
            prediction.away_prediction,
        }
      }
    )

    setPredictions(saved)
  }

  function updatePrediction(
    matchId: string,

    side: string,

    value: string
  ) {
    setPredictions(
      (previous: any) => ({
        ...previous,

        [matchId]: {
          ...previous[matchId],

          [side]:
            value === ""
              ? ""
              : Number(value),
        },
      })
    )
  }

  async function savePredictions() {
    if (!currentUser) return

    for (const match of matches) {
      const prediction =
        predictions[match.id]

      if (!prediction) continue

      const { data: existing } =
        await supabase

          .from("predictions")

          .select("*")

          .eq(
            "user_id",

            currentUser.id
          )

          .eq(
            "match_id",

            match.id
          )

          .maybeSingle()

      if (existing) {
        const { error } =
          await supabase

            .from("predictions")

            .update({
              home_prediction:
                prediction.home,

              away_prediction:
                prediction.away,
            })

            .eq(
              "id",

              existing.id
            )

        if (error) {
          console.log(error)

          alert(
            "Could not update prediction"
          )

          return
        }

        continue
      }

      const { error } =
        await supabase

          .from("predictions")

          .insert([
            {
              user_id:
                currentUser.id,

              match_id:
                match.id,

              home_prediction:
                prediction.home,

              away_prediction:
                prediction.away,
            },
          ])

      if (error) {
        console.log(error)

        alert(
          "Could not save prediction"
        )

        return
      }
    }

    alert(
      "Predictions saved ✅"
    )

    await loadExistingPredictions()
  }

  return (
    <div>
      <h2>
        📝 My Predictions
      </h2>

      {matches.length === 0 && (
        <p>
          No matches available
        </p>
      )}

      {matches.map(
        (match) => (
          <div
            key={match.id}
            style={{
              backgroundColor:
                "#1E1E1E",

              border:
                "1px solid #2A2A2A",

              borderRadius:
                "12px",

              padding:
                "16px",

              marginBottom:
                "16px",
            }}
          >
            <h3>
              {match.home_team}

              {" - "}

              {match.away_team}
            </h3>

            <div
              style={{
                display: "flex",

                justifyContent:
                  "center",

                gap: "12px",

                marginTop:
                  "12px",
              }}
            >
              <input
                type="number"

                min="0"

                value={
                  predictions[
                    match.id
                  ]?.home ?? ""
                }

                style={{
                  width: "60px",

                  textAlign:
                    "center",
                }}

                onChange={(
                  e
                ) =>
                  updatePrediction(
                    match.id,

                    "home",

                    e.target.value
                  )
                }
              />

              <span>
                -
              </span>

              <input
                type="number"

                min="0"

                value={
                  predictions[
                    match.id
                  ]?.away ?? ""
                }

                style={{
                  width: "60px",

                  textAlign:
                    "center",
                }}

                onChange={(
                  e
                ) =>
                  updatePrediction(
                    match.id,

                    "away",

                    e.target.value
                  )
                }
              />
            </div>
          </div>
        )
      )}

      {matches.length >
        0 && (
        <button
          onClick={
            savePredictions
          }
        >
          💾 Save Predictions
        </button>
      )}
    </div>
  )
}

export default MyPredictions