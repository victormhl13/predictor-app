import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function MyPredictions() {
  const { currentUser } = useAuth()

  const [matches, setMatches] = useState<any[]>([])

  const [drafts, setDrafts] = useState<any>({})

  const [savedIds, setSavedIds] = useState<string[]>([])

  useEffect(() => {
    loadMatches()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadExistingPredictions()
    }
  }, [currentUser])

  async function loadMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff")

    if (data) setMatches(data)
  }

  async function loadExistingPredictions() {
    if (!currentUser) return

    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", currentUser.id)

    if (!data) return

    const saved: any = {}

    data.forEach((p) => {
      saved[p.match_id] = {
        home: p.home_prediction,
        away: p.away_prediction,
      }
    })

    setDrafts(saved)
  }

  function updatePrediction(
    matchId: string,
    side: string,
    value: string
  ) {
    setDrafts((prev: any) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: value === "" ? "" : Number(value),
      },
    }))
  }

  async function savePredictions() {
    if (!currentUser) return

    for (const match of matches) {
      const prediction = drafts[match.id]

      if (!prediction) continue

      const { data: existing } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("match_id", match.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from("predictions")
          .update({
            home_prediction: prediction.home,
            away_prediction: prediction.away,
          })
          .eq("id", existing.id)
      } else {
        await supabase.from("predictions").insert([
          {
            user_id: currentUser.id,
            match_id: match.id,
            home_prediction: prediction.home,
            away_prediction: prediction.away,
          },
        ])
      }

      setSavedIds((prev) => [...prev, match.id])
    }
  }

  function formatKickoff(kickoff: string) {
    return new Date(kickoff).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openMatches = matches.filter(
    (match) =>
      match.home_score === null &&
      match.away_score === null &&
      !savedIds.includes(match.id)
  )

  return (
    <div>
      {openMatches.length === 0 && (
        <div
          style={{
            color: "#9CA3AF",
            textAlign: "center",
            marginTop: "40px",
          }}
        >
          All predictions completed ⚽
        </div>
      )}

      {openMatches.map((match) => (
        <div
          key={match.id}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "16px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            <div>{match.home_team}</div>
            <div>{match.away_team}</div>
          </div>

          <div
            style={{
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: "12px",
              marginTop: "8px",
            }}
          >
            {formatKickoff(match.kickoff)}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              marginTop: "16px",
            }}
          >
            <input
              type="number"
              min="0"
              value={drafts[match.id]?.home ?? ""}
              onChange={(e) =>
                updatePrediction(match.id, "home", e.target.value)
              }
              style={{
                width: "52px",
                height: "44px",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.05)",
                color: "#FFFFFF",
                fontSize: "18px",
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
              }}
            />

            <div style={{ fontSize: "22px", fontWeight: 700 }}>-</div>

            <input
              type="number"
              min="0"
              value={drafts[match.id]?.away ?? ""}
              onChange={(e) =>
                updatePrediction(match.id, "away", e.target.value)
              }
              style={{
                width: "52px",
                height: "44px",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.05)",
                color: "#FFFFFF",
                fontSize: "18px",
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
              }}
            />
          </div>
        </div>
      ))}

      {openMatches.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "18px",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={savePredictions}
            style={{
              minWidth: "210px",
              height: "44px",
              borderRadius: "999px",
              border: "1px solid rgba(109,255,78,0.25)",
              background: "rgba(109,255,78,0.14)",
              color: "#EFFFF5",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(109,255,78,0.10)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              transition: "all .2s ease",
            }}
          >
            Save Predictions
          </button>
        </div>
      )}
    </div>
  )
}

export default MyPredictions