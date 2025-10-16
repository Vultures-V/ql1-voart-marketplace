"use client"

import { Suspense } from "react"
import { ProfileHeader } from "@/components/profile-header"
import { ProfileTabs } from "@/components/profile-tabs"
import { ProfileStats } from "@/components/profile-stats"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import { useState } from "react"

export default function ProfilePage() {
  const { isConnected, isReconnecting } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Show loading state during reconnection
  if (isReconnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Reconnecting wallet...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="origami-card p-8">
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-6">Please connect your wallet to view and manage your profile.</p>
            <Button onClick={() => setShowWalletModal(true)} className="origami-button w-full">
              Connect Wallet
            </Button>
          </div>
        </div>
        <WalletConnectModal open={showWalletModal} onOpenChange={setShowWalletModal} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Profile Header with Cover Image and User Info */}
          <Suspense fallback={<div className="h-64 animate-pulse bg-card rounded-lg" />}>
            <ProfileHeader />
          </Suspense>

          {/* Statistics Section */}
          <Suspense fallback={<div className="h-32 animate-pulse bg-card rounded-lg" />}>
            <ProfileStats />
          </Suspense>

          {/* Profile Tabs */}
          <Suspense fallback={<div className="h-96 animate-pulse bg-card rounded-lg" />}>
            <ProfileTabs />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
