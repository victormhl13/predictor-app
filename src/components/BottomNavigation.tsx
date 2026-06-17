import type { CSSProperties } from "react"
import { Link, useLocation } from "react-router-dom"

import {
  House,
  Calendar,
  Target,
  Trophy,
  User,
} from "lucide-react"

function BottomNavigation() {
  const location = useLocation()

  function itemStyle(path: string): CSSProperties {
    const active = location.pathname === path

    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      textDecoration: "none",
      color: active ? "#6DFF4E" : "#FFFFFF",
      background: active
        ? "rgba(109,255,78,0.12)"
        : "transparent",
      transition: "all .2s ease",
      transform: active ? "scale(1.08)" : "scale(1)",
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: "430px",
        height: "64px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "22px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <Link to="/" style={itemStyle("/")}>
        <House size={20} />
        <span style={{ fontSize: "10px" }}>Home</span>
      </Link>

      <Link to="/matchdays" style={itemStyle("/matchdays")}>
        <Calendar size={20} />
        <span style={{ fontSize: "10px" }}>Matches</span>
      </Link>

      <Link to="/predictions" style={itemStyle("/predictions")}>
        <Target size={20} />
        <span style={{ fontSize: "10px" }}>Predictions</span>
      </Link>

      <Link to="/leaderboard" style={itemStyle("/leaderboard")}>
        <Trophy size={20} />
        <span style={{ fontSize: "10px" }}>Ranking</span>
      </Link>

      <Link to="/profile" style={itemStyle("/profile")}>
        <User size={20} />
        <span style={{ fontSize: "10px" }}>Profile</span>
      </Link>
    </div>
  )
}

export default BottomNavigation