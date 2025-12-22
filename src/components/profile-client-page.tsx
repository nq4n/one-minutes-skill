'use client'

import type { Contributor, Video } from '@/types'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  User,
  Settings,
  Eye,
  Heart,
  Clapperboard,
  LogOut,
  Shield,
} from 'lucide-react'
import { Dropzone } from '@/components/ui/dropzone'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import replacePng from '@/public/replace.png'

interface ProfileClientPageProps {
  contributor: Contributor
  videos: Video[]
  isOwner?: boolean
}

export function ProfileClientPage({
  contributor,
  videos,
  isOwner = false,
}: ProfileClientPageProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  const totalViews = videos.reduce(
    (sum, video) => sum + (video.views || 0),
    0
  )

  const totalLikes = videos.reduce(
    (sum, video) => sum + (video.likes || 0),
    0
  )

  return (
    <div className="flex min-h-screen w-full flex-col">

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto max-w-5xl py-8">
          {/* PROFILE HEADER */}
          <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
              {contributor.avatarUrl && (
                <AvatarImage
                  src={contributor.avatarUrl}
                  alt={contributor.name}
                />
              )}
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold font-headline">
                {contributor.name}
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                {contributor.bio}
              </p>

              <div className="mt-4 flex justify-center space-x-6 md:justify-start">
                <div className="text-center">
                  <span className="font-bold">{videos.length}</span>
                  <span className="block text-sm text-muted-foreground">
                    videos
                  </span>
                </div>

                <div className="text-center">
                  <span className="font-bold">
                    {totalViews.toLocaleString()}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    views
                  </span>
                </div>

                <div className="text-center">
                  <span className="font-bold">
                    {totalLikes.toLocaleString()}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    likes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <Tabs defaultValue="videos" className="w-full">
            <TabsList
              className={`grid w-full ${
                isOwner ? 'grid-cols-3' : 'grid-cols-1'
              }`}
            >
              <TabsTrigger value="videos">
                <Clapperboard /> Videos
              </TabsTrigger>

              {isOwner && (
                <TabsTrigger value="upload">
                  <Eye /> Upload
                </TabsTrigger>
              )}

              {isOwner && (
                <TabsTrigger value="settings">
                  <Settings /> Settings
                </TabsTrigger>
              )}
            </TabsList>

            {/* VIDEOS */}
            <TabsContent value="videos" className="mt-6">
              {videos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className="group relative aspect-square w-full overflow-hidden rounded-md"
                    >
                      <Image
                        src={video.thumbnailUrl || replacePng}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="text-center text-white">
                          <p className="text-sm font-bold">
                            {video.title}
                          </p>
                          <div className="mt-1 flex items-center justify-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye size={14} />{' '}
                              {video.views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart size={14} />{' '}
                              {(video.likes || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  No videos yet.
                </div>
              )}
            </TabsContent>

            {/* UPLOAD (OWNER ONLY) */}
            {isOwner && (
              <TabsContent value="upload" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload a New Skill</CardTitle>
                    <CardDescription>
                      Share your knowledge in a one-minute video.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dropzone className="w-full" />
                    <Button className="w-full" disabled>
                      Upload Video
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* SETTINGS (OWNER ONLY) */}
            {isOwner && (
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account and security.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium font-headline">
                        Profile Information
                      </h3>
                      <Separator className="my-2" />
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Name</Label>
                          <Input defaultValue={contributor.name} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Bio</Label>
                          <Input defaultValue={contributor.bio} />
                        </div>
                        <Button disabled>Save Changes</Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium font-headline">
                        Security
                      </h3>
                      <Separator className="my-2" />
                      <div className="flex flex-col space-y-4">
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled
                        >
                          <Shield /> Reset Password
                        </Button>
                        <Button
                          variant="destructive"
                          className="justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut /> Log Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}
