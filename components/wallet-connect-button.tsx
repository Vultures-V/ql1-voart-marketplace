"use client"

import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WalletIcon, CopyIcon, ExternalLinkIcon, LogOutIcon, ChevronDownIcon } from "@/components/simple-icons"
import { useToast } from "@/hooks/use-toast"
import { QL1_NETWORK, getExplorerAddressUrl } from "@/lib/network-config"

export function WalletConnectButton() {
  const {
    isConnected,
    address,
    balance,
    walletName,
    chainId,
    qomBalance,
    qomBalanceUSD,
    disconnectWallet,
    switchNetwork,
  } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const { toast } = useToast()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const viewOnExplorer = () => {
    if (address) {
      window.open(getExplorerAddressUrl(address), "_blank")
    }
  }

  const handleNetworkSwitch = async () => {
    try {
      await switchNetwork(QL1_NETWORK.chainId)
    } catch (error) {
      // Error handled by hook
    }
  }

  if (!isConnected) {
    return (
      <>
        <Button onClick={() => setShowModal(true)} className="origami-card">
          <WalletIcon className="w-4 h-4" />
          Connect Wallet
        </Button>
        <WalletConnectModal open={showModal} onOpenChange={setShowModal} />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="origami-card flex items-center gap-2 bg-transparent">
            <WalletIcon className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{formatAddress(address!)}</span>
                <ChevronDownIcon className="w-3 h-3" />
              </div>
              <div className="text-xs text-muted-foreground">{balance} QOM</div>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{walletName}</span>
              <Badge variant="outline" className="text-xs">
                {chainId === QL1_NETWORK.chainId ? QL1_NETWORK.name : `Chain ${chainId}`}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{formatAddress(address!)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <div>Balance: {balance} QOM</div>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={copyAddress}>
            <CopyIcon className="w-4 h-4" />
            Copy Address
          </DropdownMenuItem>

          <DropdownMenuItem onClick={viewOnExplorer}>
            <ExternalLinkIcon className="w-4 h-4" />
            View on Explorer
          </DropdownMenuItem>

          {chainId !== QL1_NETWORK.chainId && (
            <DropdownMenuItem onClick={handleNetworkSwitch}>
              <ExternalLinkIcon className="w-4 h-4" />
              Switch to {QL1_NETWORK.name}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={disconnectWallet} className="text-destructive focus:text-destructive">
            <LogOutIcon className="w-4 h-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WalletConnectModal open={showModal} onOpenChange={setShowModal} />
    </>
  )
}
