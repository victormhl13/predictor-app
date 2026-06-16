import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

import { useAuth } from "../context/AuthContext"

function AdminPanel() {
  const { currentUser } = useAuth()

  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers()
    }
  }, [currentUser])

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("name")

    if (error) {
      console.log(error)

      return
    }

    if (data) {
      setUsers(data)
    }
  }

  async function addUser() {
    const name = prompt("Enter name")

    if (!name) return

    const pin = prompt("Enter 4-digit PIN")

    if (!pin) return

    const { error } = await supabase
      .from("users")
      .insert([
        {
          name,

          pin,

          role: "user",

          active: true,
        },
      ])

    if (error) {
      console.log(error)

      alert("Could not create user")

      return
    }

    await loadUsers()
  }

  if (!currentUser) {
    return (
      <div>
        <h2>🔒 Login required</h2>

        <p>Please login first.</p>
      </div>
    )
  }

  if (currentUser.role !== "admin") {
    return (
      <div>
        <h2>🚫 Access denied</h2>

        <p>Only admins can access this page.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>👑 Manage Users</h2>

      <button onClick={addUser}>
        ➕ Add User
      </button>

      <div style={{ marginTop: "20px" }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              backgroundColor: "#1E1E1E",

              border: "1px solid #2A2A2A",

              borderRadius: "12px",

              padding: "16px",

              marginBottom: "12px",
            }}
          >
            👤 {user.name}

            {user.role === "admin" && " 👑"}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel