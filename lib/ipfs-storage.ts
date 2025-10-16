// IPFS Storage Integration using Web3.Storage
import type { Web3Storage } from "web3.storage"

interface IPFSUploadResult {
  cid: string
  url: string
  gateway: string
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
  properties?: {
    [key: string]: any
  }
}

class IPFSStorageService {
  private client: Web3Storage | null = null
  private readonly GATEWAY_URL = "https://w3s.link/ipfs"

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    // Web3.Storage client will be initialized when API key is available
    // For now, we'll use a placeholder that will be replaced with actual integration
    console.log("[v0] IPFS Storage Service initialized")
  }

  /**
   * Upload a single file to IPFS
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      console.log("[v0] Uploading file to IPFS:", file.name)

      // For demo purposes, we'll simulate IPFS upload
      // In production, this would use Web3.Storage client
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate a mock CID for demonstration
      const mockCid = this.generateMockCID(file.name)

      const result: IPFSUploadResult = {
        cid: mockCid,
        url: `ipfs://${mockCid}`,
        gateway: `${this.GATEWAY_URL}/${mockCid}`,
      }

      console.log("[v0] File uploaded to IPFS:", result)
      return result
    } catch (error) {
      console.error("[v0] IPFS upload failed:", error)
      throw new Error("Failed to upload file to IPFS")
    }
  }

  /**
   * Upload multiple files to IPFS
   */
  async uploadFiles(files: File[]): Promise<IPFSUploadResult[]> {
    try {
      console.log("[v0] Uploading multiple files to IPFS:", files.length)

      const results = await Promise.all(files.map((file) => this.uploadFile(file)))

      console.log("[v0] All files uploaded to IPFS:", results.length)
      return results
    } catch (error) {
      console.error("[v0] Bulk IPFS upload failed:", error)
      throw new Error("Failed to upload files to IPFS")
    }
  }

  /**
   * Upload NFT metadata as JSON to IPFS
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    try {
      console.log("[v0] Uploading metadata to IPFS:", metadata.name)

      // Create JSON file from metadata
      const jsonString = JSON.stringify(metadata, null, 2)
      const jsonFile = new File([jsonString], "metadata.json", {
        type: "application/json",
      })

      const result = await this.uploadFile(jsonFile)
      console.log("[v0] Metadata uploaded to IPFS:", result)

      return result
    } catch (error) {
      console.error("[v0] Metadata upload failed:", error)
      throw new Error("Failed to upload metadata to IPFS")
    }
  }

  /**
   * Upload file and create complete NFT metadata
   */
  async uploadNFTWithMetadata(
    file: File,
    metadata: Omit<NFTMetadata, "image">,
  ): Promise<{
    imageResult: IPFSUploadResult
    metadataResult: IPFSUploadResult
  }> {
    try {
      console.log("[v0] Uploading NFT with metadata:", metadata.name)

      // Upload the media file first
      const imageResult = await this.uploadFile(file)

      // Create complete metadata with IPFS image URL
      const completeMetadata: NFTMetadata = {
        ...metadata,
        image: imageResult.url,
      }

      // Upload metadata
      const metadataResult = await this.uploadMetadata(completeMetadata)

      console.log("[v0] NFT with metadata uploaded successfully")

      return {
        imageResult,
        metadataResult,
      }
    } catch (error) {
      console.error("[v0] NFT upload with metadata failed:", error)
      throw new Error("Failed to upload NFT with metadata to IPFS")
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayUrl(cid: string): string {
    return `${this.GATEWAY_URL}/${cid}`
  }

  /**
   * Check if a URL is an IPFS URL
   */
  isIPFSUrl(url: string): boolean {
    return url.startsWith("ipfs://") || url.includes("/ipfs/")
  }

  /**
   * Convert IPFS URL to gateway URL for display
   */
  toGatewayUrl(ipfsUrl: string): string {
    if (ipfsUrl.startsWith("ipfs://")) {
      const cid = ipfsUrl.replace("ipfs://", "")
      return this.getGatewayUrl(cid)
    }

    if (ipfsUrl.includes("/ipfs/")) {
      return ipfsUrl
    }

    return ipfsUrl
  }

  /**
   * Generate a mock CID for demonstration
   * In production, this would be provided by Web3.Storage
   */
  private generateMockCID(filename: string): string {
    const hash = this.simpleHash(filename + Date.now())
    return `Qm${hash.substring(0, 44)}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).padStart(44, "0")
  }
}

// Export singleton instance
export const ipfsStorage = new IPFSStorageService()

// Export types
export type { IPFSUploadResult, NFTMetadata }
