'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ProfileClientPage } from '@/components/profile-client-page'
import {
  getContributorByUserId,
  getVideosByContributorId,
} from '@/lib/db/client'
import type { Contributor, Video } from '@/types'

export default function MyProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [contributor, setContributor] = useState<Contributor | null>(
    null
  )
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      const contributorData = await getContributorByUserId(
        user.id
      )

      if (!isMounted) return

      if (!contributorData) {
        setError('Contributor profile not found.')
        setIsLoading(false)
        return
      }

      const contributorVideos =
        await getVideosByContributorId(contributorData.id)

      if (!isMounted) return

      setContributor(contributorData)
      setVideos(contributorVideos)
      setError(null)
      setIsLoading(false)
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [authLoading, router, user])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!contributor) {
    return null
  }

  return (
    <ProfileClientPage
      contributor={contributor}
      videos={videos}
      isOwner
    />
  )
}
