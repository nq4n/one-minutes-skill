import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getAuthenticatedContributor,
  getVideosByContributor,
} from '@/lib/db/server'
import { ProfileClientPage } from '@/components/profile-client-page'

export default async function MyProfilePage() {
  const cookieStore = await cookies()
  const contributor = await getAuthenticatedContributor(cookieStore)
  if (!contributor) {
    redirect('/login')
  }
  
  
  const videos = await getVideosByContributor(
    cookieStore,
    contributor.id
  )

  return (
    <ProfileClientPage
      contributor={contributor}
      videos={videos}
      isOwner
    />
  )
}
