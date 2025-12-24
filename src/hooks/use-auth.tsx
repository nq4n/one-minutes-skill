'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useMemo,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation' // Import useRouter

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Initial loading state
  const router = useRouter() // Initialize router

  useEffect(() => {
    // 1. Fetch initial session on component mount
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      setSession(initialSession)
      setUser(initialSession?.user || null)
      setIsLoading(false) // Set loading to false after initial session check
    }

    getInitialSession()

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user || null)
      setIsLoading(false) // Ensure loading is false after any state change

      // Optional: Redirect logic on sign out, if desired here, but AuthGuard handles protected pages
      if (event === 'SIGNED_OUT') {
        router.refresh() // Refresh the router to clear any cached SSR content
      }
    })

    return () => subscription.unsubscribe()
  }, [router]) // Add router to dependency array

  const signOut = async () => {
    setIsLoading(true) // Set loading during sign-out
    await supabase.auth.signOut()
    // onAuthStateChange will handle updating state and setting isLoading to false
    router.refresh() // Force refresh to update UI across the app
    router.push('/login') // Redirect to login after sign out
  }

  const value = useMemo(
    () => ({ user, session, isLoading, signOut }),
    [user, session, isLoading]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
