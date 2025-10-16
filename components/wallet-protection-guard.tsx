"use client"

import type React from "react"

import { useWallet } from "@/hooks/use-wallet"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Card, CardContent } from "@/components/ui/card"
import { LockIcon } from "@/components/simple-icons"

interface WalletProtectionGuardProps {
  children: React.ReactNode
  title?: string
  description?: string
  icon?: React.ReactNode
  showFullPage?: boolean
}

export function WalletProtectionGuard({
  children,
  title = "Connect Your Wallet",
  description = "To access this feature, please connect your wallet first.",
  icon,
  showFullPage = false,
}: WalletProtectionGuardProps) {
  const { isConnected } = useWallet()

  if (isConnected) {
    return <>{children}</>
  }

  const content = (
    <div className="max-w-2xl mx-auto text-center">
      <Card className="origami-card">
        <CardContent className="p-12">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              {icon || <LockIcon className="w-10 h-10 text-primary" />}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground text-pretty max-w-md">{description}</p>
            </div>

            <div className="pt-4">
              <WalletConnectButton />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Don't have a wallet? We recommend{" "}
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  MetaMask
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (showFullPage) {
    return (
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">{content}</main>
      </div>
    )
  }

  return content
}
