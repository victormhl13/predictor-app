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
      width: "52px",
      height: "48px",
      borderRadius: "16px",
      textDecoration: "none",
      color: active
        ? "#D7FFCE"
        : "rgba(255,255,255,0.78)",
      background: active
        ? "linear-gradient(145deg, rgba(156,249,137,0.20), rgba(156,249,137,0.075))"
        : "transparent",
      boxShadow: active
        ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 18px rgba(0,0,0,0.16)"
        : "none",
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
        height: "62px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        background:
          "linear-gradient(180deg, rgba(15,22,34,0.90), rgba(7,12,21,0.88))",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.13)",
        borderRadius: "22px",
        boxShadow:
          "0 16px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
        isolation: "isolate",
        pointerEvents: "auto",
      }}
    >
      <Link to="/" style={itemStyle("/")}>
        <House size={18} />
        <span style={{ fontSize: "8.5px", fontWeight: 750 }}>Home</span>
      </Link>

      <Link to="/matchdays" style={itemStyle("/matchdays")}>
        <Calendar size={18} />
        <span style={{ fontSize: "8.5px", fontWeight: 750 }}>Matches</span>
      </Link>

      <Link to="/predictions" style={itemStyle("/predictions")}>
        <Target size={18} />
        <span style={{ fontSize: "8.5px", fontWeight: 750 }}>Picks</span>
      </Link>

      <Link to="/leaderboard" style={itemStyle("/leaderboard")}>
        <Trophy size={18} />
        <span style={{ fontSize: "8.5px", fontWeight: 750 }}>Ranking</span>
      </Link>

      <Link to="/profile" style={itemStyle("/profile")}>
        <User size={18} />
        <span style={{ fontSize: "8.5px", fontWeight: 750 }}>Profile</span>
      </Link>
    </div>
  )
}

export default BottomNavigation
