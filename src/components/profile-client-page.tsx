'use client'

import type { Contributor, Video } from '@/types'
import type { Category } from '@/types'
import { useEffect, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { getCategories } from '@/lib/db/client'
import { uploadVideo } from '@/lib/video-actions'

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
  const { signOut, user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const createThumbnailFromVideo = async (file: File) => {
    const videoElement = document.createElement('video')
    const url = URL.createObjectURL(file)
    videoElement.src = url
    videoElement.muted = true
    videoElement.playsInline = true

    await new Promise<void>((resolve, reject) => {
      videoElement.addEventListener('loadeddata', () => resolve(), {
        once: true,
      })
      videoElement.addEventListener(
        'error',
        () => reject(new Error('Unable to load video for thumbnail.')),
        { once: true }
      )
    })

    videoElement.currentTime = Math.min(1, videoElement.duration / 2)
    await new Promise<void>((resolve) => {
      videoElement.addEventListener('seeked', () => resolve(), { once: true })
    })

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const context = canvas.getContext('2d')
    if (!context) {
      URL.revokeObjectURL(url)
      throw new Error('Unable to create thumbnail.')
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error('Thumbnail generation failed.'))
        }
      }, 'image/jpeg')
    })

    URL.revokeObjectURL(url)

    return new File([blob], `${file.name}-thumbnail.jpg`, {
      type: 'image/jpeg',
    })
  }

  const handleUpload = async () => {
    setUploadError(null)
    setUploadSuccess(null)

    if (!videoFile || !title || !categoryId) {
      setUploadError('Please add a video, title, and category.')
      return
    }

    setUploading(true)

    try {
      const thumbnailFile = await createThumbnailFromVideo(videoFile)
      const { error } = await uploadVideo({
        videoFile,
        thumbnailFile,
        title,
        description,
        categoryId,
        contributor,
        userId: user?.id,
      })

      if (error) {
        throw error
      }

      setUploadSuccess('Video uploaded successfully!')
      setVideoFile(null)
      setTitle('')
      setDescription('')
      setCategoryId('')
      router.refresh()
    } catch (err) {
      console.error(err)
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
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
                    <Dropzone
                      className="w-full"
                      onDrop={(files) => setVideoFile(files[0] || null)}
                      fileName={videoFile?.name || null}
                      helperText="MP4 or MOV files work best."
                      disabled={uploading}
                    />
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Give your skill a title"
                          disabled={uploading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          placeholder="Describe what viewers will learn"
                          disabled={uploading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={categoryId}
                          onValueChange={setCategoryId}
                          disabled={uploading}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-sm text-destructive">{uploadError}</p>
                    )}
                    {uploadSuccess && (
                      <p className="text-sm text-primary">{uploadSuccess}</p>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Video'}
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
