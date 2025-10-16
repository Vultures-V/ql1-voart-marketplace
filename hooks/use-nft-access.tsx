"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "./use-wallet"
import { QL1_NETWORK } from "@/lib/network-config"

const BETA_NFT_CONTRACT = process.env.NEXT_PUBLIC_BETA_NFT_CONTRACT || "0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1"
const ENABLE_BETA_GATE = process.env.NEXT_PUBLIC_ENABLE_BETA_GATE !== "false"

// Standard ERC-721 ABI for balanceOf function
const ERC721_ABI = ["function balanceOf(address owner) view returns (uint256)"]

interface NFTAccessState {
  hasAccess: boolean
  isChecking: boolean
  error: string | null
  nftBalance: number
}

export function useNFTAccess() {
  const { isConnected, address } = useWallet()
  const [state, setState] = useState<NFTAccessState>({
    hasAccess: false,
    isChecking: true,
    error: null,
    nftBalance: 0,
  })

  useEffect(() => {
    async function checkNFTOwnership() {
      if (!ENABLE_BETA_GATE) {
        console.log("[v0] Beta gate disabled via NEXT_PUBLIC_ENABLE_BETA_GATE")
        setState({
          hasAccess: true,
          isChecking: false,
          error: null,
          nftBalance: 0,
        })
        return
      }

      if (!BETA_NFT_CONTRACT || BETA_NFT_CONTRACT === "0x0000000000000000000000000000000000000000") {
        console.error("[v0] Beta NFT contract not configured!")
        setState({
          hasAccess: false,
          isChecking: false,
          error: "Beta access is not properly configured. Please contact support.",
          nftBalance: 0,
        })
        return
      }

      // If wallet not connected, no access
      if (!isConnected || !address) {
        setState({
          hasAccess: false,
          isChecking: false,
          error: null,
          nftBalance: 0,
        })
        return
      }

      setState((prev) => ({ ...prev, isChecking: true, error: null }))

      try {
        console.log("[v0] Checking NFT ownership for address:", address)
        console.log("[v0] NFT Contract:", BETA_NFT_CONTRACT)

        const provider = new ethers.JsonRpcProvider(QL1_NETWORK.rpcUrl, {
          chainId: QL1_NETWORK.chainId,
          name: QL1_NETWORK.name,
        })

        // Create contract instance
        const contract = new ethers.Contract(BETA_NFT_CONTRACT, ERC721_ABI, provider)

        // Check balance
        const balance = await contract.balanceOf(address)
        const balanceNumber = Number(balance)

        console.log("[v0] NFT balance:", balanceNumber)

        setState({
          hasAccess: balanceNumber > 0,
          isChecking: false,
          error: null,
          nftBalance: balanceNumber,
        })
      } catch (error) {
        console.error("[v0] Error checking NFT ownership:", error)
        setState({
          hasAccess: false,
          isChecking: false,
          error: error instanceof Error ? error.message : "Failed to check NFT ownership",
          nftBalance: 0,
        })
      }
    }

    checkNFTOwnership()
  }, [isConnected, address])

  return state
}
