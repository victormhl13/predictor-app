import {
  useEffect,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import type { User } from "../types"

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

    const { data, error: loginError } =
      await supabase
        .from("users")
        .select("*")
        .eq("name", name.trim())
        .eq("pin", pin)
        .eq("active", true)
        .single()

    if (loginError || !data) {
      setLoading(false)
      setError(
        "Name or PIN is incorrect."
      )
      return
    }

    const user = data as User
    localStorage.setItem(
      "goalpredict_user",
      JSON.stringify(user)
    )
    setCurrentUser(user)
    navigate("/")
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
