import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"

import BottomNavigation from "./components/BottomNavigation"

import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Matchdays from "./pages/Matchdays"
import MyPredictions from "./pages/MyPredictions"
import Leaderboard from "./pages/Leaderboard"
import AdminPanel from "./pages/AdminPanel"
import Statistics from "./pages/Statistics"
import Profile from "./pages/Profile"

import { useAuth } from "./context/AuthContext"

function App() {
  const { currentUser } = useAuth()

  return (
    <BrowserRouter>
      <div
        style={{
          height: "100dvh",

          color: "#FFFFFF",

          padding:
            "calc(14px + env(safe-area-inset-top)) 40px calc(78px + env(safe-area-inset-bottom))",

          fontFamily:
            "'Manrope', 'Inter', system-ui, sans-serif",

          maxWidth: "430px",

          margin: "0 auto",

          display: "flex",

          flexDirection: "column",

          overflow: "hidden",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",

            flexDirection: "column",

            alignItems: "center",

            justifyContent: "center",

            marginBottom: "30px",

            paddingTop: "2px",

            paddingBottom: "8px",

            flex: "0 0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "17px",

              fontWeight: 900,

              margin: 0,

              letterSpacing: "2.2px",

              textTransform: "uppercase",

              color: "#FFFFFF",

              textShadow:
                "0 0 12px rgba(109,255,78,0.35), 0 0 30px rgba(109,255,78,0.15)",
            }}
          >
            GoalPredict
          </h1>

          <div
            style={{
              fontSize: "25px",

              marginTop: "4px",

              filter:
                "drop-shadow(0 0 14px rgba(109,255,78,0.4))",
            }}
          >
            ⚽
          </div>
        </div>

        {/* AUTH GATE */}

        <main
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowX: "hidden",
            overflowY: "auto",
            overscrollBehavior:
              "none",
            WebkitOverflowScrolling:
              "touch",
            paddingBottom: "12px",
          }}
        >
        {!currentUser ? (
          <Routes>
            <Route
              path="*"
              element={<Login />}
            />
          </Routes>
        ) : (
          <>
            <Routes>
              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/matchdays"
                element={<Matchdays />}
              />

              <Route
                path="/predictions"
                element={<MyPredictions />}
              />

              <Route
                path="/leaderboard"
                element={<Leaderboard />}
              />

              <Route
                path="/statistics"
                element={<Statistics />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/admin"
                element={<AdminPanel />}
              />
            </Routes>

            <BottomNavigation />
          </>
        )}
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
