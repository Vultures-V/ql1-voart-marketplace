"use client"

import type React from "react"

import { useNFTAccess } from "@/hooks/use-nft-access"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircleIcon, LockIcon, Loader2Icon, ExternalLinkIcon, RefreshCwIcon } from "@/components/simple-icons"
import { WalletConnectButton } from "./wallet-connect-button"

interface BetaAccessGuardProps {
  children: React.ReactNode
}

export function BetaAccessGuard({ children }: BetaAccessGuardProps) {
  const { isConnected, address } = useWallet()
  const { hasAccess, isChecking, error, nftBalance } = useNFTAccess()

  const handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">Verifying beta access...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show wallet connect prompt if not connected
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <LockIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">VOart VIP Pass Required</CardTitle>
            <CardDescription className="text-base">Connect your wallet to verify your VIP access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              This marketplace is currently in private beta. You need to own a VOart VIP Pass NFT to continue.
            </p>
            <WalletConnectButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if there was an error checking
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md border-destructive/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircleIcon className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Verification Error</CardTitle>
            <CardDescription className="text-base">Unable to verify beta access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} className="w-full flex items-center justify-center gap-2">
              <RefreshCwIcon className="w-4 h-4" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show access denied if no NFT
  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <LockIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">VOart VIP Pass Required</CardTitle>
            <CardDescription className="text-base">
              You need a VOart VIP Pass NFT to access this marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="mb-2 font-medium">Connected Wallet:</p>
              <p className="font-mono text-xs text-muted-foreground break-all">{address}</p>
              <p className="mt-2 text-muted-foreground">VOart VIP Pass NFTs owned: {nftBalance}</p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to get access:</p>
              <p className="leading-relaxed">
                Purchase a VOart VIP Pass NFT to gain access to this exclusive marketplace. This NFT grants you beta
                testing privileges and early access to all features.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() =>
                  window.open("https://thirdweb.com/ql1/0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1", "_blank")
                }
                className="flex-1"
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Get VIP Pass
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 bg-transparent"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Has access - render children
  return <>{children}</>
}
