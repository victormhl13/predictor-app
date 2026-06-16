import {
  createContext,

  useContext,

  useState,

  useEffect,
} from "react"

import type { ReactNode } from "react"

import type { User } from "../types"

type AuthContextType = {
  currentUser: User | null

  setCurrentUser: (
    user: User | null
  ) => void
}

const AuthContext =
  createContext<AuthContextType>({
    currentUser: null,

    setCurrentUser: () => {},
  })

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [currentUser, setCurrentUser] =
    useState<User | null>(null)

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "goalpredict_user"
      )

    if (savedUser) {
      setCurrentUser(
        JSON.parse(savedUser)
      )
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        currentUser,

        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}