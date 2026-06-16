import { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function Login() {
  const navigate = useNavigate()

  const { currentUser, setCurrentUser } =
    useAuth()

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
    <div>
      <h2>🔐 Login</h2>

      <input
        placeholder="Name"

        value={name}

        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <br />

      <br />

      <input
        type="password"

        maxLength={4}

        placeholder="4-digit PIN"

        value={pin}

        onChange={(e) =>
          setPin(e.target.value)
        }
      />

      <br />

      <br />

      <button onClick={handleLogin}>
        Login
      </button>
    </div>
  )
}

export default Login