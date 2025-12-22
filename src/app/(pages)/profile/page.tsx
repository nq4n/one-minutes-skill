import { redirect } from 'next/navigation'
import {
  getAuthenticatedContributor,
  getVideosByContributor,
} from '@/lib/db/server'
import { ProfileClientPage } from '@/components/profile-client-page'

export default async function MyProfilePage() {
  const contributor = await getAuthenticatedContributor()
  if (!contributor) {
    redirect('/login')
  }

  const videos = await getVideosByContributor(contributor.id)

  return (
    <ProfileClientPage
      contributor={contributor}
      videos={videos}
      isOwner
    />
  )
}
