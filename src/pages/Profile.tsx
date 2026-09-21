import {
  useEffect,
  useState,
} from "react"
import {
  BookOpen,
  Download,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"
import {
  getMyPredictions,
  getAllPredictionsForAdmin,
  getFinishedPredictions,
  listPublicUsers,
  logoutSession,
} from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
import PageHeader from "../components/PageHeader"
import type {
  Match,
  Matchday,
  Prediction,
} from "../types"
import {
  personalStats,
  predictionPoints,
  rankedPlayers,
} from "../utils/scoring"
import {
  downloadCsv,
} from "../utils/csv"

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
  const [performance, setPerformance] =
    useState({
      exact: 0,
      outcomes: 0,
      accuracy: 0,
      bestMatchday: 0,
    })
  const [
    matchdayHistory,
    setMatchdayHistory,
  ] = useState<
    {
      id: string
      name: string
      points: number
      exact: number
      outcomes: number
      scored: number
    }[]
  >([])

  useEffect(() => {
    async function load() {
      if (!currentUser) return

      const [
        predictionsResult,
        matchesResult,
        matchdaysResult,
      ] = await Promise.all([
        getMyPredictions().then(
          (data) => ({ data })
        ),
        supabase
          .from("matches")
          .select("*"),
        supabase
          .from("matchdays")
          .select("*"),
      ])

      const predictions =
        (predictionsResult.data ||
          []) as Prediction[]
      const matches =
        (matchesResult.data ||
          []) as Match[]
      const matchdays =
        (matchdaysResult.data ||
          []) as Matchday[]

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
      setPerformance(
        personalStats(
          predictions,
          matches
        )
      )

      const matchesById = new Map(
        matches.map((match) => [
          match.id,
          match,
        ])
      )
      const history =
        matchdays
          .map((matchday) => {
            let dayPoints = 0
            let exact = 0
            let outcomes = 0
            let scored = 0

            predictions.forEach(
              (prediction) => {
                const match =
                  matchesById.get(
                    prediction.match_id
                  )
                if (
                  !match ||
                  match.matchday_id !==
                    matchday.id ||
                  match.home_score ===
                    null ||
                  match.away_score ===
                    null
                ) {
                  return
                }

                scored += 1
                const earned =
                  predictionPoints(
                    prediction,
                    match
                  )
                dayPoints += earned
                if (earned === 3) {
                  exact += 1
                }
                if (earned > 0) {
                  outcomes += 1
                }
              }
            )

            return {
              id: matchday.id,
              name: matchday.name,
              points: dayPoints,
              exact,
              outcomes,
              scored,
            }
          })
          .filter(
            (item) =>
              item.scored > 0
          )
          .sort(
            (a, b) =>
              b.name.localeCompare(
                a.name,
                undefined,
                {
                  numeric: true,
                }
              )
          )

      setMatchdayHistory(history)
    }

    load()
  }, [currentUser])

  async function logout() {
    await logoutSession()
    localStorage.removeItem(
      "goalpredict_user"
    )
    localStorage.removeItem(
      "goalpredict_session"
    )
    setCurrentUser(null)
    navigate("/")
  }

  async function exportData() {
    const [
      users,
      predictions,
      finishedPredictions,
      matchesResult,
    ] = await Promise.all([
      listPublicUsers(),
      currentUser?.role ===
      "admin"
        ? getAllPredictionsForAdmin()
        : getMyPredictions(),
      getFinishedPredictions(),
      supabase
        .from("matches")
        .select("*"),
    ])
    const matches =
      (matchesResult.data ||
        []) as Match[]
    const ranking =
      rankedPlayers(
        users,
        finishedPredictions,
        matches
      )
    downloadCsv(
      "goalpredict-export.csv",
      [
        [
          "Type",
          "Player/Match",
          "Details",
          "Kickoff",
          "Prediction",
          "Result/Points",
        ],
        ...ranking.map(
          (player, index) => [
            "Ranking",
            `${index + 1}. ${player.name}`,
            "",
            "",
            "",
            player.points,
          ]
        ),
        ...matches
          .filter(
            (match) =>
              match.home_score !==
                null &&
              match.away_score !==
                null
          )
          .map((match) => [
            "Result",
            `${match.home_team} - ${match.away_team}`,
            "",
            match.kickoff,
            "",
            `${match.home_score}-${match.away_score}`,
          ]),
        ...predictions.map(
          (prediction) => {
            const user =
              users.find(
                (item) =>
                  item.id ===
                  prediction.user_id
              )
            const match =
              matches.find(
                (item) =>
                  item.id ===
                  prediction.match_id
              )
            return [
              "Prediction",
              user?.name ||
                currentUser?.name ||
                "",
              `${match?.home_team || ""} - ${match?.away_team || ""}`,
              match?.kickoff,
              `${prediction.home_prediction}-${prediction.away_prediction}`,
              match?.home_score !==
                null &&
              match?.away_score !==
                null
                ? `${match?.home_score}-${match?.away_score}`
                : "",
            ]
          }
        ),
      ]
    )
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
        className="surface"
        style={{
          padding: "14px",
        }}
      >
        <div className="section-label">
          Personal statistics
        </div>
        <div className="stats-grid">
          {[
            [
              "Exact scores",
              performance.exact,
            ],
            [
              "Correct outcomes",
              performance.outcomes,
            ],
            [
              "Accuracy",
              `${performance.accuracy}%`,
            ],
            [
              "Best matchday",
              `${performance.bestMatchday} pts`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="stat-tile"
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="surface profile-history-card">
        <div className="section-label">
          Matchday history
        </div>
        {matchdayHistory.length ===
        0 ? (
          <div className="empty-state">
            No completed matchdays yet.
          </div>
        ) : (
          <div className="profile-history-list">
            {matchdayHistory
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="profile-history-row"
                >
                  <div>
                    <strong>
                      {item.name}
                    </strong>
                    <small>
                      {item.exact} exact ·{" "}
                      {item.outcomes} correct
                      outcomes
                    </small>
                  </div>
                  <span>
                    {item.points} pts
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div
        className="surface-soft"
        style={{
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() =>
            navigate("/rules")
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
          <BookOpen
            size={17}
            color="#60A5FA"
          />
          <span
            style={{
              flex: 1,
              fontSize: "12px",
              fontWeight: 750,
            }}
          >
            Rules and scoring
          </span>
          <span>›</span>
        </button>

        <button
          type="button"
          onClick={exportData}
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
          <Download
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
            Export CSV
          </span>
          <span>›</span>
        </button>

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
