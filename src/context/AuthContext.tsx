import {
  createContext,

  useContext,

  useState,
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
    useState<User | null>(() => {
      const savedUser =
        localStorage.getItem(
          "goalpredict_user"
        )

      if (!savedUser) {
        return null
      }

      try {
        return JSON.parse(
          savedUser
        ) as User
      } catch {
        localStorage.removeItem(
          "goalpredict_user"
        )
        return null
      }
    })

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
