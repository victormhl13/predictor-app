import {
  lazy,
  Suspense,
} from "react"
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"

import BottomNavigation from "./components/BottomNavigation"

const Dashboard = lazy(
  () => import("./pages/Dashboard")
)
const Login = lazy(
  () => import("./pages/Login")
)
const Matchdays = lazy(
  () => import("./pages/Matchdays")
)
const MyPredictions = lazy(
  () =>
    import("./pages/MyPredictions")
)
const Leaderboard = lazy(
  () => import("./pages/Leaderboard")
)
const AdminPanel = lazy(
  () => import("./pages/AdminPanel")
)
const Statistics = lazy(
  () => import("./pages/Statistics")
)
const Profile = lazy(
  () => import("./pages/Profile")
)
const Rules = lazy(
  () => import("./pages/Rules")
)

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
            "calc(14px + env(safe-area-inset-top)) 18px calc(78px + env(safe-area-inset-bottom))",

          fontFamily:
            "'Manrope', 'Inter', system-ui, sans-serif",

          maxWidth: "430px",

          margin: "0 auto",

          display: "flex",

          flexDirection: "column",

          position: "relative",

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

            paddingTop: "4px",

            paddingBottom: "4px",

            flex: "0 0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "18px",

              fontWeight: 900,

              margin: 0,

              letterSpacing: "2.8px",

              textTransform: "uppercase",

              color: "#FFFFFF",

              textShadow:
                "0 2px 18px rgba(0,0,0,0.62), 0 0 24px rgba(156,249,137,0.18)",
            }}
          >
            PitchCall
          </h1>

          <div
            style={{
              width: "34px",
              height: "34px",
              marginTop: "7px",
              display: "grid",
              placeItems: "center",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "999px",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
              boxShadow:
                "0 10px 26px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
              fontSize: "20px",

              filter:
                "drop-shadow(0 0 14px rgba(156,249,137,0.18))",
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
        <Suspense
          fallback={
            <div className="surface empty-state">
              Loading PitchCall…
            </div>
          }
        >
        {!currentUser ? (
          <Routes>
            <Route
              path="*"
              element={<Login />}
            />
          </Routes>
        ) : (
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
                path="/rules"
                element={<Rules />}
              />

              <Route
                path="/admin"
                element={<AdminPanel />}
              />
            </Routes>
        )}
        </Suspense>
        </main>

        {currentUser && (
          <BottomNavigation />
        )}
      </div>
    </BrowserRouter>
  )
}

export default App
