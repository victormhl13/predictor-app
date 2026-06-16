import { Link } from "react-router-dom"

import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

function BottomNavigation() {
  const navigate = useNavigate()

  const {
    currentUser,

    setCurrentUser,
  } = useAuth()

  function logout() {
    localStorage.removeItem(
      "goalpredict_user"
    )

    setCurrentUser(null)

    navigate("/login")
  }

  return (
    <div
      style={{
        position: "fixed",

        bottom: 0,

        left: 0,

        right: 0,

        height: "70px",

        display: "flex",

        justifyContent: "space-around",

        alignItems: "center",

        backgroundColor: "#1E1E1E",

        borderTop: "1px solid #2A2A2A",
      }}
    >
      <Link to="/">🏠</Link>

      <Link to="/matchdays">⚽</Link>

      <Link to="/predictions">📝</Link>

      <Link to="/leaderboard">🏆</Link>

      {currentUser?.role === "admin" && (
        <Link to="/admin">👑</Link>
      )}

      <button
        onClick={logout}
        style={{
          background: "none",

          border: "none",

          color: "white",

          fontSize: "24px",

          cursor: "pointer",
        }}
      >
        🚪
      </button>
    </div>
  )
}

export default BottomNavigation