import {
  useEffect,
  useState,
} from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  CalendarDays,
  Target,
  Trophy,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import PageHeader from "../components/PageHeader"
import TeamBadge from "../components/TeamBadge"
import type {
  Match,
  Prediction,
  User,
} from "../types"

function Dashboard() {
  const { currentUser } = useAuth()
  const [
    currentMatchday,
    setCurrentMatchday,
  ] = useState("-")
  const [
    upcomingMatch,
    setUpcomingMatch,
  ] = useState<Match | null>(null)
  const [
    myPredictions,
    setMyPredictions,
  ] = useState(0)
  const [leader, setLeader] =
    useState("No leader yet")

  useEffect(() => {
    async function loadDashboard() {
      const [
        matchdayResult,
        upcomingResult,
        predictionResult,
        usersResult,
        allPredictionsResult,
        matchesResult,
      ] = await Promise.all([
        supabase
          .from("matchdays")
          .select("*")
          .eq("is_open", true)
          .order("name")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("*")
          .is("home_score", null)
          .order("kickoff")
          .limit(1)
          .maybeSingle(),
        currentUser
          ? supabase
              .from("predictions")
              .select("id")
              .eq(
                "user_id",
                currentUser.id
              )
          : Promise.resolve({
              data: [],
            }),
        supabase
          .from("users")
          .select("*"),
        supabase
          .from("predictions")
          .select("*"),
        supabase
          .from("matches")
          .select("*"),
      ])

      if (matchdayResult.data) {
        setCurrentMatchday(
          matchdayResult.data.name
        )
      }
      setUpcomingMatch(
        (upcomingResult.data ||
          null) as Match | null
      )
      setMyPredictions(
        predictionResult.data?.length ||
          0
      )

      const users =
        (usersResult.data ||
          []) as User[]
      const predictions =
        (allPredictionsResult.data ||
          []) as Prediction[]
      const matches =
        (matchesResult.data ||
          []) as Match[]

      const ranking = users
        .map((user) => {
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
                  points += 3
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
                  points += 1
                }
              }
            )
          return {
            name: user.name,
            points,
          }
        })
        .sort(
          (a, b) =>
            b.points - a.points
        )

      if (
        ranking[0] &&
        ranking[0].points > 0
      ) {
        setLeader(
          `${ranking[0].name} · ${ranking[0].points} pts`
        )
      }
    }

    loadDashboard()
  }, [currentUser])

  return (
    <div className="page">
      <PageHeader
        title={`Hi, ${currentUser?.name || "player"}`}
        subtitle="Here is what matters right now."
      />

      <Link
        to="/matchdays"
        className="surface"
        style={{
          padding: "16px",
          color: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "10px",
          }}
        >
          <span className="section-label">
            Next match
          </span>
          <ArrowRight
            size={15}
            color="#9CA3AF"
          />
        </div>

        {upcomingMatch ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr auto 1fr",
              alignItems: "center",
              gap: "8px",
              marginTop: "14px",
            }}
          >
            <div
              style={{
                display: "grid",
                justifyItems: "center",
                gap: "7px",
                textAlign: "center",
              }}
            >
              <TeamBadge
                name={
                  upcomingMatch.home_team
                }
                logo={
                  upcomingMatch.home_team_logo
                }
                size={38}
              />
              <strong
                style={{
                  fontSize: "12px",
                  lineHeight: 1.25,
                }}
              >
                {
                  upcomingMatch.home_team
                }
              </strong>
            </div>
            <span
              style={{
                color: "#6B7280",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              VS
            </span>
            <div
              style={{
                display: "grid",
                justifyItems: "center",
                gap: "7px",
                textAlign: "center",
              }}
            >
              <TeamBadge
                name={
                  upcomingMatch.away_team
                }
                logo={
                  upcomingMatch.away_team_logo
                }
                size={38}
              />
              <strong
                style={{
                  fontSize: "12px",
                  lineHeight: 1.25,
                }}
              >
                {
                  upcomingMatch.away_team
                }
              </strong>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            No upcoming match.
          </div>
        )}
      </Link>

      <div
        className="surface-soft"
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "13px",
            borderRight:
              "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <CalendarDays
            size={16}
            color="#9CF989"
          />
          <div
            className="section-label"
            style={{
              marginTop: "9px",
            }}
          >
            Matchday
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "15px",
              fontWeight: 800,
            }}
          >
            {currentMatchday}
          </div>
        </div>

        <div
          style={{
            padding: "13px",
          }}
        >
          <Trophy
            size={16}
            color="#F8D477"
          />
          <div
            className="section-label"
            style={{
              marginTop: "9px",
            }}
          >
            Leader
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            {leader}
          </div>
        </div>
      </div>

      <div
        className="surface-soft"
        style={{
          overflow: "hidden",
        }}
      >
        <Link
          to="/predictions"
          className="compact-row"
          style={{ color: "inherit" }}
        >
          <Target
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
            My predictions
          </span>
          <strong>
            {myPredictions}
          </strong>
          <ArrowRight
            size={14}
            color="#6B7280"
          />
        </Link>
        <Link
          to="/statistics"
          className="compact-row"
          style={{ color: "inherit" }}
        >
          <span
            style={{
              width: "17px",
              color: "#60A5FA",
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            %
          </span>
          <span
            style={{
              flex: 1,
              fontSize: "12px",
              fontWeight: 750,
            }}
          >
            League statistics
          </span>
          <ArrowRight
            size={14}
            color="#6B7280"
          />
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
