'use client'

import { AuthGuard } from '@/components/auth-guard' // Import AuthGuard
import { useAuth } from '@/hooks/use-auth' // Import useAuth to display user info

export default function ProfilePage() {
  const { user, signOut } = useAuth() // Get user and signOut function

  return (
    <AuthGuard> {/* Wrap the content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Profile Page</h1>
        {user ? (
          <div>
            <p className="mb-2">Welcome, {user.email}!</p>
            {/* Display more user details if available */}
            {user.user_metadata?.full_name && <p>Name: {user.user_metadata.full_name}</p>}
            <button
              onClick={signOut}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <p>You are not logged in.</p> // This state should ideally not be reached due to AuthGuard
        )}
      </div>
    </AuthGuard>
  )
}
