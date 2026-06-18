import {
  useEffect,
  useState,
} from "react"
import {
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import PageHeader from "../components/PageHeader"
import type {
  Match,
  Prediction,
} from "../types"

function Profile() {
  const navigate = useNavigate()
  const {
    currentUser,
    setCurrentUser,
  } = useAuth()
  const [points, setPoints] =
    useState(0)
  const [
    predictionCount,
    setPredictionCount,
  ] = useState(0)

  useEffect(() => {
    async function load() {
      if (!currentUser) return

      const [
        predictionsResult,
        matchesResult,
      ] = await Promise.all([
        supabase
          .from("predictions")
          .select("*")
          .eq(
            "user_id",
            currentUser.id
          ),
        supabase
          .from("matches")
          .select("*"),
      ])

      const predictions =
        (predictionsResult.data ||
          []) as Prediction[]
      const matches =
        (matchesResult.data ||
          []) as Match[]

      setPredictionCount(
        predictions.length
      )

      let total = 0
      predictions.forEach(
        (prediction) => {
          const match = matches.find(
            (item) =>
              item.id ===
              prediction.match_id
          )
          if (
            !match ||
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
            total += 3
          } else if (
            Math.sign(
              prediction.home_prediction -
                prediction.away_prediction
            ) ===
            Math.sign(
              match.home_score -
                match.away_score
            )
          ) {
            total += 1
          }
        }
      )
      setPoints(total)
    }

    load()
  }, [currentUser])

  function logout() {
    localStorage.removeItem(
      "goalpredict_user"
    )
    setCurrentUser(null)
    navigate("/")
  }

  return (
    <div className="page">
      <PageHeader
        title="Profile"
        subtitle="Your account and performance."
      />

      <div
        className="surface"
        style={{
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "13px",
          }}
        >
          <div
            style={{
              width: "54px",
              height: "54px",
              display: "grid",
              placeItems: "center",
              border:
                "1px solid rgba(109,255,78,0.22)",
              borderRadius: "50%",
              background:
                "rgba(109,255,78,0.09)",
              color: "#B7FFA7",
              fontSize: "20px",
              fontWeight: 900,
            }}
          >
            {currentUser?.name
              ?.charAt(0)
              .toUpperCase()}
          </div>
          <div
            style={{
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 850,
              }}
            >
              {currentUser?.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginTop: "4px",
                color: "#9CA3AF",
                fontSize: "10px",
                textTransform:
                  "capitalize",
              }}
            >
              <ShieldCheck
                size={13}
              />
              {currentUser?.role}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            marginTop: "15px",
            borderTop:
              "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              padding:
                "13px 10px 0 0",
              borderRight:
                "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="section-label">
              Points
            </div>
            <strong
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "20px",
              }}
            >
              {points}
            </strong>
          </div>
          <div
            style={{
              padding:
                "13px 0 0 13px",
            }}
          >
            <div className="section-label">
              Predictions
            </div>
            <strong
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "20px",
              }}
            >
              {predictionCount}
            </strong>
          </div>
        </div>
      </div>

      <div
        className="surface-soft"
        style={{
          overflow: "hidden",
        }}
      >
        {currentUser?.role ===
          "admin" && (
          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="compact-row"
            style={{
              width: "100%",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              background:
                "transparent",
              color: "#FFFFFF",
              textAlign: "left",
            }}
          >
            <Users
              size={17}
              color="#9CF989"
            />
            <span
              style={{
                flex: 1,
                fontSize: "12px",
                fontWeight: 750,
              }}
            >
              Manage users
            </span>
            <span
              style={{
                color: "#6B7280",
              }}
            >
              ›
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className="compact-row"
          style={{
            width: "100%",
            border: "none",
            background:
              "transparent",
            color: "#FF8585",
            textAlign: "left",
          }}
        >
          <LogOut size={17} />
          <span
            style={{
              flex: 1,
              fontSize: "12px",
              fontWeight: 750,
            }}
          >
            Sign out
          </span>
        </button>
      </div>
    </div>
  )
}

export default Profile
