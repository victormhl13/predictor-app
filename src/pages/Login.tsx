import {
  useEffect,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"

import { loginWithPin } from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
function Login() {
  const navigate = useNavigate()
  const {
    currentUser,
    setCurrentUser,
  } = useAuth()
  const [name, setName] =
    useState("")
  const [pin, setPin] =
    useState("")
  const [loading, setLoading] =
    useState(false)
  const [error, setError] =
    useState("")

  useEffect(() => {
    if (currentUser) {
      navigate("/")
    }
  }, [currentUser, navigate])

  async function handleLogin() {
    if (!name.trim() || !pin) {
      setError(
        "Enter your name and PIN."
      )
      return
    }

    setLoading(true)
    setError("")

    try {
      const {
        user,
        token,
      } = await loginWithPin(
        name.trim(),
        pin
      )

      localStorage.setItem(
        "goalpredict_user",
        JSON.stringify(user)
      )
      localStorage.setItem(
        "goalpredict_session",
        token
      )
      setCurrentUser(user)
      navigate("/")
    } catch (loginError) {
      setLoading(false)
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Name or PIN is incorrect."
      )
    }
  }

  return (
    <div
      style={{
        minHeight: "58vh",
        display: "grid",
        alignContent: "center",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "22px",
            textAlign: "center",
          }}
        >
          <h2 className="page-title">
            Welcome back
          </h2>
          <p className="page-subtitle">
            Sign in to submit your
            predictions.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          <input
            className="field"
            placeholder="Name"
            value={name}
            autoComplete="username"
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
          />
          <input
            className="field"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pin}
            autoComplete="current-password"
            onChange={(event) =>
              setPin(
                event.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                handleLogin()
              }
            }}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: "10px",
              color: "#FF8585",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="primary-button"
          style={{
            width: "100%",
            marginTop: "14px",
          }}
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>
      </div>
    </div>
  )
}

export default Login
