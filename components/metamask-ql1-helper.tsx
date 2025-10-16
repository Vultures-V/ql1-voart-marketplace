"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { WalletIcon } from "@/components/simple-icons"
import { useToast } from "@/hooks/use-toast"
import { QL1_NETWORK } from "@/lib/network-config"

export function MetaMaskQL1Helper() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const addQL1Network = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to continue",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: QL1_NETWORK.chainIdHex,
            chainName: QL1_NETWORK.name,
            nativeCurrency: QL1_NETWORK.nativeCurrency,
            rpcUrls: [QL1_NETWORK.rpcUrl],
            blockExplorerUrls: [QL1_NETWORK.blockExplorerUrl],
          },
        ],
      })

      toast({
        title: "Success!",
        description: "QL1 Network added to MetaMask",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add QL1 Network to MetaMask",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button
      onClick={addQL1Network}
      disabled={isConnecting}
      className="bg-[#f97316] hover:bg-[#ea580c] text-white font-medium"
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Adding Network...
        </>
      ) : (
        <>
          <WalletIcon className="h-4 w-4 mr-2" />
          Add QL1 to MetaMask
        </>
      )}
    </Button>
  )
}
