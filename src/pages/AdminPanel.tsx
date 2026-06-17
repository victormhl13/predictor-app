import { useEffect, useState } from "react"

import { Navigate } from "react-router-dom"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function AdminPanel() {
  const { currentUser } = useAuth()

  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (
      currentUser &&
      currentUser.role === "admin"
    ) {
      loadUsers()
    }
  }, [currentUser])

  async function loadUsers() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("name")

    if (data) {
      setUsers(data)
    }
  }

  async function addUser() {
    const name = prompt("Enter name")

    if (!name) return

    const pin = prompt("Enter 4-digit PIN")

    if (!pin) return

    await supabase
      .from("users")
      .insert([
        {
          name,

          pin,

          role: "user",

          active: true,
        },
      ])

    loadUsers()
  }

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <h2>👑 Manage Users</h2>

      <button onClick={addUser}>
        ➕ Add User
      </button>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              background:
                "#1E1E1E",

              border:
                "1px solid #2A2A2A",

              borderRadius:
                "12px",

              padding: "16px",

              marginBottom:
                "12px",
            }}
          >
            👤 {user.name}

            {user.role ===
              "admin" && " 👑"}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel