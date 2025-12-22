'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client' // Client-side Supabase instance
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      // On successful sign-up, you might want to redirect to a verification page
      // or directly to a protected page if email confirmation is not required.
      // For simplicity, redirecting to login or profile after successful signup.
      router.push('/profile') // Or '/login?message=Check your email for verification'
      router.refresh() // Force a refresh to update any cached states
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 text-card-foreground shadow-md">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
