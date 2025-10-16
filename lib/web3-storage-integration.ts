// Web3.Storage Integration
import { storageWhitelist } from "./storage-whitelist"

export interface Web3StorageUploadResult {
  cid: string
  url: string
  gateway: string
  size: number
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string }>
  properties?: Record<string, any>
}

class Web3StorageService {
  private readonly API_KEY = process.env.WEB3_STORAGE_API_KEY || ""
  private readonly GATEWAY_URL = "https://w3s.link/ipfs"

  async uploadToMarketplaceStorage(file: File, walletAddress: string): Promise<Web3StorageUploadResult> {
    if (!storageWhitelist.isWhitelisted(walletAddress)) {
      throw new Error("Wallet not authorized for marketplace storage")
    }

    const usage = storageWhitelist.getStorageUsage(walletAddress)
    const fileSizeMB = file.size / (1024 * 1024)

    if (usage.remaining < fileSizeMB) {
      throw new Error(`Storage quota exceeded. You have ${usage.remaining.toFixed(2)} MB remaining`)
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockCid = this.generateMockCID(file.name)
    const result: Web3StorageUploadResult = {
      cid: mockCid,
      url: `ipfs://${mockCid}`,
      gateway: `${this.GATEWAY_URL}/${mockCid}`,
      size: file.size,
    }

    storageWhitelist.updateStorageUsage(walletAddress, fileSizeMB)
    return result
  }

  async validateIPFSHash(ipfsHash: string) {
    try {
      const cleanHash = ipfsHash.replace("ipfs://", "").trim()

      if (!cleanHash || cleanHash.length < 40) {
        return { valid: false, error: "Invalid IPFS hash format" }
      }

      return { valid: true, url: `ipfs://${cleanHash}` }
    } catch (error) {
      return { valid: false, error: "Failed to validate IPFS hash" }
    }
  }

  async uploadMetadata(metadata: NFTMetadata, walletAddress: string): Promise<Web3StorageUploadResult> {
    const jsonString = JSON.stringify(metadata, null, 2)
    const jsonFile = new File([jsonString], "metadata.json", { type: "application/json" })
    return this.uploadToMarketplaceStorage(jsonFile, walletAddress)
  }

  getGatewayUrl(cid: string): string {
    const cleanCid = cid.replace("ipfs://", "")
    return `${this.GATEWAY_URL}/${cleanCid}`
  }

  toGatewayUrl(ipfsUrl: string): string {
    if (ipfsUrl.startsWith("ipfs://")) {
      const cid = ipfsUrl.replace("ipfs://", "")
      return this.getGatewayUrl(cid)
    }
    return ipfsUrl
  }

  private generateMockCID(filename: string): string {
    const hash = this.simpleHash(filename + Date.now())
    return `Qm${hash.substring(0, 44)}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36).padStart(44, "0")
  }
}

export const web3Storage = new Web3StorageService()
