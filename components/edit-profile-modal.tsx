"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { CameraIcon } from "@/components/simple-icons"
import { validateImage, IMAGE_REQUIREMENTS, formatFileSize } from "@/utils/image-validation"

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userData: {
    username: string
    bio: string
    profileImage?: string
    coverImage?: string
    socialLinks: {
      twitter?: string
      discord?: string
      instagram?: string
      website?: string
    }
  }
  onProfileUpdate: (updatedData: any) => void
}

export function EditProfileModal({ open, onOpenChange, userData, onProfileUpdate }: EditProfileModalProps) {
  const [profileImage, setProfileImage] = useState<string | null>(userData.profileImage || null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userData.username || "",
      bio: userData.bio || "",
      twitter: userData.socialLinks.twitter || "",
      discord: userData.socialLinks.discord || "",
      instagram: userData.socialLinks.instagram || "",
      website: userData.socialLinks.website || "",
    },
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate image based on type
    const requirements = type === "profile" ? IMAGE_REQUIREMENTS.PROFILE_AVATAR : IMAGE_REQUIREMENTS.PROFILE_BANNER

    const validation = await validateImage(file, requirements)

    if (!validation.valid) {
      toast({
        title: "Invalid image",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    // Show success with dimensions
    if (validation.dimensions) {
      toast({
        title: `${type === "profile" ? "Profile picture" : "Cover image"} validated`,
        description: `${validation.dimensions.width}x${validation.dimensions.height}px, ${formatFileSize(validation.fileSize || 0)}`,
      })
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === "profile") {
        setProfileImage(result)
      } else {
        // No cover image state, do nothing
      }
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true)
    try {
      console.log("[v0] Starting profile update with data:", data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedProfileData = {
        username: data.username,
        bio: data.bio || "",
        profileImage: profileImage || "",
        socialLinks: {
          twitter: data.twitter || "",
          discord: data.discord || "",
          instagram: data.instagram || "",
          website: data.website || "",
        },
      }

      console.log("[v0] Profile update data prepared:", updatedProfileData)

      try {
        onProfileUpdate(updatedProfileData)
        console.log("[v0] Profile update callback completed successfully")
      } catch (callbackError) {
        console.error("[v0] Error in onProfileUpdate callback:", callbackError)
        throw new Error("Failed to save profile data")
      }

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Profile update error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and social links. Changes will be visible to other users.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <FormLabel>Profile Picture</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback>
                      <CameraIcon className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <CameraIcon className="w-6 h-6 text-white" />
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "profile")}
                    className="sr-only"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Upload a profile picture</p>
                  <p>400-800x400-800px (square)</p>
                  <p>Max 500KB, JPG/PNG</p>
                </div>
              </div>
            </div>

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        @
                      </span>
                      <Input {...field} className="pl-8" placeholder="cryptoartist" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your unique username. Only letters, numbers, and underscores allowed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself and your art..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>{field.value?.length || 0}/160 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Social Links</h4>

              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter/X</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://twitter.com/username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Username#1234" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://instagram.com/username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://yourwebsite.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="origami-button">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Form validation schema
const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  twitter: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  discord: z.string().max(50, "Discord username must be less than 50 characters").optional(),
  instagram: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})
