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
      gap: "3px",
      width: "48px",
      height: "46px",
      borderRadius: "14px",
      textDecoration: "none",
      color: active ? "#6DFF4E" : "#FFFFFF",
      background: active
        ? "rgba(109,255,78,0.12)"
        : "transparent",
      transition: "all .2s ease",
      transform: active ? "translateY(-1px)" : "none",
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 200,
        bottom:
          "calc(14px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 36px)",
        maxWidth: "394px",
        height: "58px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        background: "rgba(13,18,27,0.88)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "20px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        isolation: "isolate",
        pointerEvents: "auto",
      }}
    >
      <Link to="/" style={itemStyle("/")}>
        <House size={18} />
        <span style={{ fontSize: "9px" }}>Home</span>
      </Link>

      <Link to="/matchdays" style={itemStyle("/matchdays")}>
        <Calendar size={18} />
        <span style={{ fontSize: "9px" }}>Matches</span>
      </Link>

      <Link to="/predictions" style={itemStyle("/predictions")}>
        <Target size={18} />
        <span style={{ fontSize: "9px" }}>Predictions</span>
      </Link>

      <Link to="/leaderboard" style={itemStyle("/leaderboard")}>
        <Trophy size={18} />
        <span style={{ fontSize: "9px" }}>Ranking</span>
      </Link>

      <Link to="/profile" style={itemStyle("/profile")}>
        <User size={18} />
        <span style={{ fontSize: "9px" }}>Profile</span>
      </Link>
    </div>
  )
}

export default BottomNavigation
