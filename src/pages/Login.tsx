import { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function Login() {
  const navigate = useNavigate()

  const { currentUser, setCurrentUser } = useAuth()

  const [name, setName] = useState("")

  const [pin, setPin] = useState("")

  useEffect(() => {
    if (currentUser) {
      navigate("/")
    }
  }, [currentUser])

  async function handleLogin() {
    if (!name || !pin) {
      alert("Please fill all fields")
      return
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("name", name)
      .eq("pin", pin)
      .single()

    if (error || !data) {
      alert("Invalid name or PIN")
      return
    }

    localStorage.setItem(
      "goalpredict_user",
      JSON.stringify(data)
    )

    setCurrentUser(data)

    navigate("/")
  }

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "340px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "24px",
        }}
      >
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            height: "52px",
            padding: "0 18px",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.05)",
            color: "#FFFFFF",
            fontSize: "16px",
            outline: "none",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          maxLength={4}
          placeholder="4-digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: "100%",
            height: "52px",
            padding: "0 18px",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.05)",
            color: "#FFFFFF",
            fontSize: "16px",
            outline: "none",
            marginBottom: "22px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            height: "50px",
            border: "1px solid rgba(109,255,78,0.25)",
            borderRadius: "999px",
            background: "rgba(109,255,78,0.12)",
            color: "#EFFFF5",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(109,255,78,0.12)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            transition: "all .2s ease",
          }}
        >
          Login
        </button>
      </div>
    </div>
  )
}

export default Login