'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth' // Use your auth hook

interface AuthGuardProps {
  children: ReactNode
  // You might add roles or other permissions here later
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if not loading and user is null
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    // Optional: Render a full-page loading spinner or skeleton
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading authentication...</p>
        {/* Replace with your actual Loading component */}
      </div>
    )
  }

  if (!user) {
    // If not loading but no user, it means we're redirecting, so return null
    // The useEffect above will handle the actual router.replace
    return null
  }

  // If user is logged in, render the protected content
  return <>{children}</>
}
