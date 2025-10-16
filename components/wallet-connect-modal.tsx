"use client"

import { useState } from "react"
import { useWallet, type WalletInfo } from "@/hooks/use-wallet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2Icon } from "@/components/simple-icons"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { availableWallets, connectWallet, isConnecting } = useWallet()
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)

  const handleWalletConnect = async (walletName: string) => {
    setSelectedWallet(walletName)
    try {
      await connectWallet(walletName)
      onOpenChange(false)
    } catch (error) {
      // Error is handled by the hook with toast
    } finally {
      setSelectedWallet(null)
    }
  }

  const getWalletInstallUrl = (walletName: string) => {
    switch (walletName) {
      case "MetaMask":
        return "https://metamask.io/download/"
      case "Trust Wallet":
        return "https://trustwallet.com/download"
      case "Coinbase Wallet":
        return "https://www.coinbase.com/wallet/downloads"
      case "WalletConnect":
        return "https://walletconnect.com/"
      default:
        return "#"
    }
  }

  const getWalletDescription = (wallet: WalletInfo) => {
    if (wallet.isWalletConnect) {
      return "Connect with any mobile wallet"
    }
    return wallet.installed ? "Ready to connect" : "Not installed"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Connect Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Choose your preferred wallet to connect to the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {availableWallets.map((wallet: WalletInfo) => (
            <div
              key={wallet.name}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{wallet.icon}</div>
                <div>
                  <div className="font-medium">{wallet.name}</div>
                  <div className="text-sm text-muted-foreground">{getWalletDescription(wallet)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!wallet.installed && !wallet.isWalletConnect && (
                  <Badge variant="outline" className="text-xs">
                    Not Installed
                  </Badge>
                )}

                {wallet.isWalletConnect && (
                  <Badge variant="secondary" className="text-xs">
                    Universal
                  </Badge>
                )}

                {wallet.installed || wallet.isWalletConnect ? (
                  <Button
                    onClick={() => handleWalletConnect(wallet.name)}
                    disabled={isConnecting}
                    size="sm"
                    className="min-w-[80px]"
                  >
                    {isConnecting && selectedWallet === wallet.name ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Connecting
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getWalletInstallUrl(wallet.name), "_blank")}
                  >
                    Install
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          By connecting a wallet, you agree to our Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  )
}
