import {
  useEffect,
  useState,
} from "react"
import { Navigate } from "react-router-dom"
import {
  Plus,
  UserRound,
} from "lucide-react"

import {
  createUser,
  listAdminUsers,
  setUserActive,
} from "../lib/appApi"
import { useAuth } from "../context/AuthContext"
import PageHeader from "../components/PageHeader"
import type { User } from "../types"

function AdminPanel() {
  const { currentUser } = useAuth()
  const [users, setUsers] =
    useState<User[]>([])
  const [formOpen, setFormOpen] =
    useState(false)
  const [name, setName] =
    useState("")
  const [pin, setPin] =
    useState("")
  const [role, setRole] =
    useState("user")
  const [error, setError] =
    useState("")

  async function loadUsers() {
    setUsers(
      await listAdminUsers()
    )
  }

  useEffect(() => {
    if (
      currentUser?.role !==
      "admin"
    ) {
      return
    }

    let active = true

    listAdminUsers().then(
      (data) => {
        if (active) {
          setUsers(data)
        }
      }
    )

    return () => {
      active = false
    }
  }, [currentUser])

  async function addUser() {
    if (
      !name.trim() ||
      pin.length !== 4
    ) {
      setError(
        "Enter a name and a 4-digit PIN."
      )
      return
    }

    try {
      await createUser(
        name.trim(),
        pin,
        role
      )
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create user."
      )
      return
    }

    setName("")
    setPin("")
    setRole("user")
    setError("")
    setFormOpen(false)
    await loadUsers()
  }

  async function toggleUser(
    user: User
  ) {
    if (
      user.id === currentUser?.id
    ) {
      setError(
        "You cannot disable your own account."
      )
      return
    }

    await setUserActive(
      user.id,
      !user.active
    )
    await loadUsers()
  }

  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="Users"
        subtitle={`${users.length} GoalPredict accounts`}
        action={
          <button
            type="button"
            onClick={() =>
              setFormOpen(
                !formOpen
              )
            }
            className="primary-button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Plus size={14} />
            Add
          </button>
        }
      />

      {formOpen && (
        <div
          className="surface"
          style={{
            padding: "13px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "9px",
            }}
          >
            <input
              className="field"
              placeholder="Name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "9px",
              }}
            >
              <input
                className="field"
                inputMode="numeric"
                maxLength={4}
                placeholder="PIN"
                value={pin}
                onChange={(event) =>
                  setPin(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />
              <select
                className="field"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value
                  )
                }
              >
                <option value="user">
                  Player
                </option>
                <option value="admin">
                  Admin
                </option>
              </select>
            </div>
            <button
              type="button"
              onClick={addUser}
              className="primary-button"
            >
              Create account
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#FF8585",
            fontSize: "11px",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="surface"
        style={{
          overflow: "hidden",
        }}
      >
        {users.map((user) => (
          <div
            key={user.id}
            className="compact-row"
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                background:
                  "rgba(255,255,255,0.055)",
              }}
            >
              <UserRound
                size={16}
                color={
                  user.active
                    ? "#9CF989"
                    : "#6B7280"
                }
              />
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  marginTop: "2px",
                  color: "#6B7280",
                  fontSize: "9px",
                  textTransform:
                    "capitalize",
                }}
              >
                {user.role}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                toggleUser(user)
              }
              className={
                user.active
                  ? "glass-button"
                  : "primary-button"
              }
              style={{
                minHeight: "30px",
                padding: "0 10px",
                color: user.active
                  ? "#9CA3AF"
                  : "#B7FFA7",
                fontSize: "9px",
              }}
            >
              {user.active
                ? "Disable"
                : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel
