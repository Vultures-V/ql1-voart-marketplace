"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { useWallet } from "@/hooks/use-wallet"
import {
  SettingsIcon,
  CopyIcon,
  ExternalLinkIcon,
  TwitterIcon,
  MessageCircleIcon,
  InstagramIcon,
  GlobeIcon,
  Share2Icon,
  CheckCircleIcon,
  ClockIcon,
} from "@/components/simple-icons"
import { useToast } from "@/hooks/use-toast"
import { verificationSystem } from "@/lib/verification-system"

const defaultUserData = {
  username: "",
  bio: "",
  profileImage: "",
  socialLinks: {
    twitter: "",
    discord: "",
    instagram: "",
    website: "",
  },
  badges: [],
  followers: 0,
  following: 0,
}

export function ProfileHeader() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [userData, setUserData] = useState(defaultUserData)
  const { address, isConnected } = useWallet()
  const { toast } = useToast()

  const [persistentAddress, setPersistentAddress] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [hasRequestedVerification, setHasRequestedVerification] = useState(false)

  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress")
    if (savedAddress) {
      setPersistentAddress(savedAddress)
    }
  }, [])

  useEffect(() => {
    if (address && isConnected) {
      setPersistentAddress(address)
    }
  }, [address, isConnected])

  useEffect(() => {
    const addressToUse = persistentAddress || address
    if (addressToUse) {
      const savedData = localStorage.getItem(`profile_${addressToUse}`)
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          setUserData({ ...defaultUserData, ...parsedData })
          console.log("[v0] Loaded profile data from localStorage:", parsedData)
        } catch (error) {
          console.error("[v0] Error parsing saved profile data:", error)
        }
      }

      setIsVerified(verificationSystem.isUserVerified(addressToUse))

      // Check if user has pending verification request
      const requests = verificationSystem.getAllRequests()
      const hasPending = requests.some(
        (req) => req.targetId.toLowerCase() === addressToUse.toLowerCase() && req.status === "pending",
      )
      setHasRequestedVerification(hasPending)
    }
  }, [persistentAddress, address])

  const copyWalletAddress = async () => {
    const addressToUse = persistentAddress || address
    if (addressToUse) {
      await navigator.clipboard.writeText(addressToUse)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const shareProfile = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${userData.username || "User"}'s Profile - VOart`,
        text: userData.bio || "Check out this profile on VOart",
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied!",
        description: "Profile link copied to clipboard",
      })
    }
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleProfileUpdate = (updatedData: any) => {
    try {
      console.log("[v0] handleProfileUpdate called with:", updatedData)

      const newUserData = { ...userData, ...updatedData }
      console.log("[v0] Merged user data:", newUserData)

      setUserData(newUserData)

      const addressToUse = persistentAddress || address
      console.log("[v0] Address to use for storage:", addressToUse)

      if (addressToUse) {
        const storageKey = `profile_${addressToUse}`
        const dataToStore = JSON.stringify(newUserData)
        console.log("[v0] Storing to localStorage with key:", storageKey)

        localStorage.setItem(storageKey, dataToStore)
        console.log("[v0] Successfully saved profile data to localStorage")

        // Verify the data was saved
        const savedData = localStorage.getItem(storageKey)
        console.log("[v0] Verification - data retrieved from localStorage:", savedData)
      } else {
        console.error("[v0] No address available for storage")
        throw new Error("No wallet address available")
      }
    } catch (error) {
      console.error("[v0] Error in handleProfileUpdate:", error)
      throw error
    }
  }

  const handleRequestVerification = () => {
    const addressToUse = persistentAddress || address
    if (!addressToUse) return

    const result = verificationSystem.submitRequest(
      "user",
      addressToUse,
      userData.username || "User",
      addressToUse,
      userData.username || "User",
      "I would like to verify my profile to build trust with the community.",
    )

    toast({
      title: result.success ? "Verification Requested" : "Request Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      setHasRequestedVerification(true)
    }
  }

  const displayAddress = persistentAddress || address

  return (
    <div className="origami-card overflow-hidden">
      <div className="h-64 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={shareProfile} className="bg-background/80 backdrop-blur-sm">
            <Share2Icon className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="bg-background/80 backdrop-blur-sm"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="p-6 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={userData.profileImage || "/placeholder.svg"} alt={userData.username || "User"} />
              <AvatarFallback className="text-2xl font-bold">
                {userData.username ? userData.username.slice(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{userData.followers}</strong> Followers
              </span>
              <span>
                <strong className="text-foreground">{userData.following}</strong> Following
              </span>
            </div>

            {!isVerified && !hasRequestedVerification && isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestVerification}
                className="mt-4 text-primary border-primary hover:bg-primary/10 bg-transparent"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Request Verification
              </Button>
            )}

            {hasRequestedVerification && !isVerified && (
              <Badge variant="outline" className="mt-4 text-yellow-500 border-yellow-500">
                <ClockIcon className="w-3 h-3 mr-1" />
                Verification Pending
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">
                  {userData.username ? `@${userData.username}` : "Set up your profile"}
                </h1>
                {userData.badges.includes("Verified") && <CheckCircleIcon className="w-5 h-5 text-primary" />}
              </div>

              {userData.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {userData.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}

              {displayAddress && (
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{formatWalletAddress(displayAddress)}</code>
                  <Button variant="ghost" size="sm" onClick={copyWalletAddress} className="h-6 w-6 p-0">
                    <CopyIcon className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {userData.bio ||
                  "Welcome to your profile! Click 'Edit Profile' to add your bio and customize your page."}
              </p>
            </div>

            {(userData.socialLinks.twitter ||
              userData.socialLinks.discord ||
              userData.socialLinks.instagram ||
              userData.socialLinks.website) && (
              <div className="flex flex-wrap gap-3">
                {userData.socialLinks.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={userData.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <TwitterIcon className="w-4 h-4 mr-2" />
                      Twitter
                      <ExternalLinkIcon className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}

                {userData.socialLinks.discord && (
                  <Button variant="outline" size="sm">
                    <MessageCircleIcon className="w-4 h-4 mr-2" />
                    {userData.socialLinks.discord}
                  </Button>
                )}

                {userData.socialLinks.instagram && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={userData.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <InstagramIcon className="w-4 h-4 mr-2" />
                      Instagram
                      <ExternalLinkIcon className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}

                {userData.socialLinks.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={userData.socialLinks.website} target="_blank" rel="noopener noreferrer">
                      <GlobeIcon className="w-4 h-4 mr-2" />
                      Website
                      <ExternalLinkIcon className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        userData={userData}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  )
}
