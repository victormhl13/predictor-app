import {
  useEffect,
  useState,
} from "react"
import {
  CalendarCheck,
  CheckCircle2,
  Trophy,
  Users,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import {
  getFinishedPredictions,
  listPublicUsers,
} from "../lib/appApi"
import { calculateLeaderboard } from "../utils/calculateLeaderboard"
import PageHeader from "../components/PageHeader"
import type {
  Match,
  Matchday,
  Prediction,
  User,
} from "../types"

type Stats = {
  leader: string
  players: number
  openMatchdays: number
  finishedMatches: number
}

function Statistics() {
  const [stats, setStats] =
    useState<Stats>({
      leader: "-",
      players: 0,
      openMatchdays: 0,
      finishedMatches: 0,
    })

  useEffect(() => {
    async function load() {
      const [
        usersResult,
        matchdaysResult,
        matchesResult,
        predictionsResult,
      ] = await Promise.all([
        listPublicUsers().then(
          (data) => ({ data })
        ),
        supabase
          .from("matchdays")
          .select("*"),
        supabase
          .from("matches")
          .select("*"),
        getFinishedPredictions().then(
          (data) => ({ data })
        ),
      ])

      const users =
        (usersResult.data ||
          []) as User[]
      const matchdays =
        (matchdaysResult.data ||
          []) as Matchday[]
      const matches =
        (matchesResult.data ||
          []) as Match[]
      const predictions =
        (predictionsResult.data ||
          []) as Prediction[]
      const ranking =
        calculateLeaderboard(
          users,
          predictions,
          matches
        )

      setStats({
        leader:
          ranking[0]?.points > 0
            ? `${ranking[0].name} · ${ranking[0].points} pts`
            : "No leader yet",
        players: users.length,
        openMatchdays:
          matchdays.filter(
            (item) => item.is_open
          ).length,
        finishedMatches:
          matches.filter(
            (match) =>
              match.home_score !==
                null &&
              match.away_score !==
                null
          ).length,
      })
    }

    load()
  }, [])

  const rows = [
    {
      icon: Trophy,
      label: "Current leader",
      value: stats.leader,
      color: "#F8D477",
    },
    {
      icon: Users,
      label: "Active players",
      value: String(
        stats.players
      ),
      color: "#9CF989",
    },
    {
      icon: CalendarCheck,
      label: "Open matchdays",
      value: String(
        stats.openMatchdays
      ),
      color: "#60A5FA",
    },
    {
      icon: CheckCircle2,
      label: "Finished matches",
      value: String(
        stats.finishedMatches
      ),
      color: "#C9CFD8",
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Statistics"
        subtitle="A compact overview of the competition."
      />

      <div
        className="surface"
        style={{
          overflow: "hidden",
        }}
      >
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div
              key={row.label}
              className="compact-row"
              style={{
                minHeight: "58px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius:
                    "11px",
                  background:
                    "rgba(255,255,255,0.045)",
                }}
              >
                <Icon
                  size={17}
                  color={row.color}
                />
              </div>
              <div
                style={{
                  flex: 1,
                }}
              >
                <div
                  style={{
                    color:
                      "#9CA3AF",
                    fontSize: "10px",
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  {row.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Statistics
