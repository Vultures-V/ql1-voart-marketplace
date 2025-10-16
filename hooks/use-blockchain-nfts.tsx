"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "@/hooks/use-wallet"

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]

const ERC721_INTERFACE_ID = "0x80ac58cd"

const KNOWN_NFT_CONTRACTS = [
  "0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1", // Beta Access NFT
]

export interface BlockchainNFT {
  contractAddress: string
  tokenId: string
  name: string
  symbol: string
  tokenURI: string
  metadata?: {
    name?: string
    description?: string
    image?: string
    attributes?: any[]
  }
  isExternal: true
}

export function useBlockchainNFTs() {
  const { address, provider } = useWallet()
  const [nfts, setNfts] = useState<BlockchainNFT[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discoveredContracts, setDiscoveredContracts] = useState<string[]>([])

  useEffect(() => {
    console.log("[v0] useBlockchainNFTs effect triggered - address:", address, "provider:", !!provider)
    if (address && provider) {
      discoverAndFetchNFTs()
    } else {
      setNfts([])
      setDiscoveredContracts([])
    }
  }, [address, provider])

  const fetchNFTsFromContract = async (contractAddress: string): Promise<BlockchainNFT[]> => {
    if (!address || !provider) return []

    try {
      console.log("[v0] Checking contract:", contractAddress)
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)

      // Check if it's ERC721
      let isERC721 = false
      try {
        isERC721 = await contract.supportsInterface(ERC721_INTERFACE_ID)
      } catch {
        try {
          await contract.balanceOf(address)
          isERC721 = true
        } catch {
          console.log("[v0] Contract", contractAddress, "is not ERC721")
          return []
        }
      }

      if (!isERC721) {
        console.log("[v0] Contract", contractAddress, "does not support ERC721")
        return []
      }

      const [name, symbol, balance] = await Promise.all([
        contract.name().catch(() => "Unknown"),
        contract.symbol().catch(() => "NFT"),
        contract.balanceOf(address),
      ])

      const balanceNum = Number(balance)
      console.log(`[v0] User owns ${balanceNum} NFTs from ${name} (${symbol})`)

      if (balanceNum === 0) return []

      const nfts: BlockchainNFT[] = []

      for (let i = 0; i < balanceNum; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i)
          const tokenURI = await contract.tokenURI(tokenId).catch(() => "")

          const nft: BlockchainNFT = {
            contractAddress,
            tokenId: tokenId.toString(),
            name,
            symbol,
            tokenURI,
            isExternal: true,
          }

          // Fetch metadata
          if (tokenURI) {
            try {
              let metadataURL = tokenURI
              if (tokenURI.startsWith("ipfs://")) {
                metadataURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
              }

              const response = await fetch(metadataURL)
              if (response.ok) {
                const metadata = await response.json()
                nft.metadata = metadata

                if (metadata.image?.startsWith("ipfs://")) {
                  metadata.image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
                }
              }
            } catch (metadataError) {
              console.warn(`[v0] Could not fetch metadata for token ${tokenId}:`, metadataError)
            }
          }

          nfts.push(nft)
          console.log("[v0] Added NFT:", nft.name, "Token ID:", nft.tokenId)
        } catch (tokenError) {
          console.warn(`[v0] Error fetching token at index ${i}:`, tokenError)
        }
      }

      return nfts
    } catch (err) {
      console.error(`[v0] Error fetching NFTs from ${contractAddress}:`, err)
      return []
    }
  }

  const discoverAndFetchNFTs = async () => {
    if (!address || !provider) {
      console.log("[v0] Cannot discover NFTs - missing address or provider")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting NFT discovery for address:", address)

      const allNFTs: BlockchainNFT[] = []
      const validContracts: string[] = []

      // First, check known contracts
      console.log("[v0] Checking known NFT contracts...")
      for (const contractAddress of KNOWN_NFT_CONTRACTS) {
        const nfts = await fetchNFTsFromContract(contractAddress)
        if (nfts.length > 0) {
          allNFTs.push(...nfts)
          validContracts.push(contractAddress)
        }
      }

      console.log(`[v0] Found ${allNFTs.length} NFTs from known contracts`)

      // Then scan for additional contracts via Transfer events
      try {
        console.log("[v0] Scanning blockchain for additional NFT contracts...")
        const currentBlock = await provider.getBlockNumber()
        console.log("[v0] Current block:", currentBlock)

        // Scan last 50k blocks (adjust based on chain speed)
        const fromBlock = Math.max(0, currentBlock - 50000)
        console.log("[v0] Scanning from block:", fromBlock, "to", currentBlock)

        const transferTopic = ethers.id("Transfer(address,address,uint256)")
        const addressTopic = ethers.zeroPadValue(address, 32)

        const filter = {
          fromBlock,
          toBlock: "latest",
          topics: [transferTopic, null, addressTopic],
        }

        console.log("[v0] Fetching Transfer events...")
        const logs = await provider.getLogs(filter)
        console.log("[v0] Found", logs.length, "Transfer events")

        const uniqueContracts = new Set<string>(KNOWN_NFT_CONTRACTS)
        for (const log of logs) {
          if (log.address) {
            uniqueContracts.add(log.address)
          }
        }

        console.log("[v0] Found", uniqueContracts.size, "unique contracts (including known)")

        // Check new contracts
        for (const contractAddress of uniqueContracts) {
          if (KNOWN_NFT_CONTRACTS.includes(contractAddress)) continue // Already checked

          const nfts = await fetchNFTsFromContract(contractAddress)
          if (nfts.length > 0) {
            allNFTs.push(...nfts)
            validContracts.push(contractAddress)
          }
        }
      } catch (scanError) {
        console.warn("[v0] Error scanning for additional contracts:", scanError)
        // Continue with known contracts even if scan fails
      }

      setDiscoveredContracts(validContracts)
      setNfts(allNFTs)
      console.log(`[v0] Successfully loaded ${allNFTs.length} NFTs from ${validContracts.length} contracts`)
    } catch (err) {
      console.error("[v0] Error discovering NFTs:", err)
      setError(err instanceof Error ? err.message : "Failed to discover NFTs")
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = () => {
    console.log("[v0] Manual refresh triggered")
    discoverAndFetchNFTs()
  }

  return {
    nfts,
    isLoading,
    error,
    discoveredContracts,
    refresh,
  }
}
