import { useEffect, useState } from "react"

import { Navigate } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function AdminPanel() {
  const { currentUser } = useAuth()

  const [users, setUsers] =
    useState<any[]>([])

  const [name, setName] =
    useState("")

  const [pin, setPin] =
    useState("")

  const [role, setRole] =
    useState("user")

  useEffect(() => {
    if (
      currentUser &&
      currentUser.role === "admin"
    ) {
      loadUsers()
    }
  }, [currentUser])

  async function loadUsers() {
    const { data } =
      await supabase
        .from("users")
        .select("*")
        .order("name")

    if (data) {
      setUsers(data)
    }
  }

  async function addUser() {
    if (
      !name ||

      !pin ||

      pin.length !== 4
    ) {
      alert(
        "Enter a name and a 4-digit PIN."
      )

      return
    }

    const { error } =
      await supabase

        .from("users")

        .insert([
          {
            name,

            pin,

            role,

            active: true,
          },
        ])

    if (error) {
      alert(
        "Could not create user."
      )

      return
    }

    setName("")

    setPin("")

    setRole("user")

    loadUsers()
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  if (
    currentUser.role !==
    "admin"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <div>
      {/* HEADER */}

      <div
        style={{
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            fontSize: "28px",

            fontWeight: 800,

            marginBottom: "6px",
          }}
        >
          Manage Users
        </div>

        <div
          style={{
            color: "#9CA3AF",

            fontSize: "14px",
          }}
        >
          Manage all GoalPredict accounts
        </div>
      </div>

      {/* FORM */}

      <div
        style={{
          background:
            "rgba(255,255,255,0.05)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          borderRadius:
            "22px",

          padding: "18px",

          marginBottom:
            "26px",
        }}
      >
        <input
          placeholder="User name"

          value={name}

          onChange={(e) =>
            setName(
              e.target.value
            )
          }

          style={{
            width: "100%",

            height: "50px",

            marginBottom: "14px",

            padding:
              "0 16px",

            boxSizing:
              "border-box",

            borderRadius:
              "16px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            background:
              "rgba(255,255,255,0.05)",

            color:
              "#FFFFFF",

            fontSize: "15px",

            outline: "none",
          }}
        />

        <input
          maxLength={4}

          placeholder="4-digit PIN"

          value={pin}

          onChange={(e) =>
            setPin(
              e.target.value
            )
          }

          style={{
            width: "100%",

            height: "50px",

            marginBottom: "14px",

            padding:
              "0 16px",

            boxSizing:
              "border-box",

            borderRadius:
              "16px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            background:
              "rgba(255,255,255,0.05)",

            color:
              "#FFFFFF",

            fontSize: "15px",

            outline: "none",
          }}
        />

        <select
          value={role}

          onChange={(e) =>
            setRole(
              e.target.value
            )
          }

          style={{
            width: "100%",

            height: "50px",

            marginBottom: "18px",

            padding:
              "0 16px",

            borderRadius:
              "16px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            background:
              "#1C1C1C",

            color:
              "#FFFFFF",

            fontSize: "15px",
          }}
        >
          <option value="user">
            Player
          </option>

          <option value="admin">
            Admin
          </option>
        </select>

        <button
          onClick={addUser}
          style={{
            width: "100%",

            height: "52px",

            borderRadius:
              "999px",

            border:
              "1px solid rgba(109,255,78,0.25)",

            background:
              "rgba(109,255,78,0.12)",

            color:
              "#FFFFFF",

            fontWeight:
              800,

            fontSize: "15px",

            cursor:
              "pointer",

            boxShadow:
              "0 6px 18px rgba(109,255,78,0.12)",
          }}
        >
          Add User
        </button>
      </div>

      {/* USERS */}

      {users.map((user) => (
        <div
          key={user.id}
          style={{
            background:
              "rgba(255,255,255,0.05)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "18px",

            padding: "18px",

            marginBottom:
              "14px",
          }}
        >
          <div
            style={{
              fontSize: "18px",

              fontWeight: 800,
            }}
          >
            {user.name}
          </div>

          <div
            style={{
              marginTop: "8px",

              color:
                "#9CA3AF",

              fontSize: "13px",

              fontWeight: 700,
            }}
          >
            {user.role ===
            "admin"
              ? "Admin"
              : "Player"}
          </div>

          <div
            style={{
              marginTop: "10px",

              color:
                "#6DFF4E",

              fontSize: "14px",

              fontWeight: 700,

              letterSpacing:
                "0.5px",
            }}
          >
            Active
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdminPanel