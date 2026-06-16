import { BrowserRouter, Routes, Route } from "react-router-dom"

import BottomNavigation from "./components/BottomNavigation"

import Dashboard from "./pages/Dashboard"

import Login from "./pages/Login"

import Matchdays from "./pages/Matchdays"

import MyPredictions from "./pages/MyPredictions"

import Leaderboard from "./pages/Leaderboard"

import AdminPanel from "./pages/AdminPanel"

import Statistics from "./pages/Statistics"

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",

          backgroundColor:
            "#121212",

          color: "#FFFFFF",

          padding: "20px",

          paddingBottom:
            "90px",
        }}
      >
        <h1>
          🏆 GoalPredict
        </h1>

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/matchdays"
            element={
              <Matchdays />
            }
          />

          <Route
            path="/predictions"
            element={
              <MyPredictions />
            }
          />

          <Route
            path="/leaderboard"
            element={
              <Leaderboard />
            }
          />

          <Route
            path="/statistics"
            element={
              <Statistics />
            }
          />

          <Route
            path="/admin"
            element={
              <AdminPanel />
            }
          />
        </Routes>

        <BottomNavigation />
      </div>
    </BrowserRouter>
  )
}

export default App