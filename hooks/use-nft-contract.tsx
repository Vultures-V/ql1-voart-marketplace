"use client"

import { useCallback } from "react"
import { ethers } from "ethers"
import { useContract } from "./use-contract"
import { ORIGAMI_NFT_ABI, CONTRACTS } from "@/lib/contract-abis"

export interface NFTMetadata {
  name: string
  description: string
  category: string
  rarity: string
  creator: string
  createdAt: bigint
  isLazyMinted: boolean
}

export function useNFTContract() {
  const nft = useContract(CONTRACTS.NFT, ORIGAMI_NFT_ABI)

  // Mint a new NFT
  const mintNFT = useCallback(
    async (
      to: string,
      tokenURI: string,
      name: string,
      description: string,
      category: string,
      rarity: string,
      royaltyReceiver: string,
      royaltyPercentage: number, // 0-500 (0-5%)
    ) => {
      console.log("[v0] Minting NFT:", { name, category, rarity, royaltyPercentage })
      return await nft.write(
        "mintNFT",
        to,
        tokenURI,
        name,
        description,
        category,
        rarity,
        royaltyReceiver,
        royaltyPercentage,
      )
    },
    [nft],
  )

  // Lazy mint NFT (mint on first sale)
  const lazyMintNFT = useCallback(
    async (
      to: string,
      tokenURI: string,
      name: string,
      description: string,
      category: string,
      rarity: string,
      royaltyReceiver: string,
      royaltyPercentage: number,
    ) => {
      console.log("[v0] Lazy minting NFT:", { name, category, rarity })
      return await nft.write(
        "lazyMintNFT",
        to,
        tokenURI,
        name,
        description,
        category,
        rarity,
        royaltyReceiver,
        royaltyPercentage,
      )
    },
    [nft],
  )

  // Burn an NFT
  const burnNFT = useCallback(
    async (tokenId: number) => {
      console.log("[v0] Burning NFT:", tokenId)
      return await nft.write("burnNFT", tokenId)
    },
    [nft],
  )

  // Get NFT metadata
  const getNFTMetadata = useCallback(
    async (tokenId: number): Promise<NFTMetadata | null> => {
      return await nft.read<NFTMetadata>("getNFTMetadata", tokenId)
    },
    [nft],
  )

  // Get NFT owner
  const getOwner = useCallback(
    async (tokenId: number): Promise<string | null> => {
      return await nft.read<string>("ownerOf", tokenId)
    },
    [nft],
  )

  // Get token URI
  const getTokenURI = useCallback(
    async (tokenId: number): Promise<string | null> => {
      return await nft.read<string>("tokenURI", tokenId)
    },
    [nft],
  )

  // Get creator's NFTs
  const getCreatorNFTs = useCallback(
    async (creator: string): Promise<bigint[] | null> => {
      return await nft.read<bigint[]>("getCreatorNFTs", creator)
    },
    [nft],
  )

  // Get total supply
  const getTotalSupply = useCallback(async (): Promise<bigint | null> => {
    return await nft.read<bigint>("totalSupply")
  }, [nft])

  // Get royalty info
  const getRoyaltyInfo = useCallback(
    async (tokenId: number, salePrice: string): Promise<{ receiver: string; amount: bigint } | null> => {
      const price = ethers.parseEther(salePrice)
      const result = await nft.read<[string, bigint]>("royaltyInfo", tokenId, price)
      if (!result) return null
      return { receiver: result[0], amount: result[1] }
    },
    [nft],
  )

  // Listen to NFT events
  const listenToMints = useCallback(
    (callback: (event: any) => void) => {
      return nft.listen("NFTMinted", callback)
    },
    [nft],
  )

  const listenToTransfers = useCallback(
    (callback: (event: any) => void) => {
      return nft.listen("Transfer", callback)
    },
    [nft],
  )

  return {
    mintNFT,
    lazyMintNFT,
    burnNFT,
    getNFTMetadata,
    getOwner,
    getTokenURI,
    getCreatorNFTs,
    getTotalSupply,
    getRoyaltyInfo,
    listenToMints,
    listenToTransfers,
    txStatus: nft.txStatus,
    resetTxStatus: nft.resetTxStatus,
  }
}
