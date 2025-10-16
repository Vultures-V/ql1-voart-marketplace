"use client"

import type React from "react"
import { QOMCostCalculator } from "@/components/qom-cost-calculator"
import { QOMPriceFetcher } from "@/components/qom-price-fetcher"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  UploadIcon,
  ImageIcon,
  BoxIcon,
  ZapIcon,
  EyeIcon,
  ShieldIcon,
  DollarSignIcon,
  CheckCircleIcon,
  LinkIcon,
  StarIcon,
  InfoIcon,
} from "@/components/simple-icons"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { WalletProtectionGuard } from "@/components/wallet-protection-guard"
import Image from "next/image"
import { ipfsStorage, type IPFSUploadResult } from "@/lib/ipfs-storage"
import { validateImage, IMAGE_REQUIREMENTS, formatFileSize } from "@/lib/image-validation"
import { storageWhitelist } from "@/lib/storage-whitelist"
import { web3Storage } from "@/lib/web3-storage-integration"

interface NFTFormData {
  name: string
  description: string
  category: string
  color: string
  rarity: string
  tags: string
  saleType: string
  price: string
  auctionDuration: string
  royaltyPercentage: string
  royaltyAddress: string
  file: File | null
  filePreview: string
}

interface NFTAttribute {
  trait_type: string
  value: string
}

export default function MintPage() {
  const [lazyMintEnabled, setLazyMintEnabled] = useState(true)
  const [contractType, setContractType] = useState("ERC721")
  const [isUploading, setIsUploading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [copyrightAccepted, setCopyrightAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [nftAttributes, setNftAttributes] = useState<NFTAttribute[]>([])
  const [newAttribute, setNewAttribute] = useState({ trait_type: "", value: "" })

  const [formData, setFormData] = useState<NFTFormData>({
    name: "",
    description: "",
    category: "",
    color: "",
    rarity: "",
    tags: "",
    saleType: "fixed",
    price: "",
    auctionDuration: "",
    royaltyPercentage: "10",
    royaltyAddress: "",
    file: null,
    filePreview: "",
  })

  const [ipfsResult, setIpfsResult] = useState<IPFSUploadResult | null>(null)

  const [uploadMethod, setUploadMethod] = useState<"marketplace" | "ipfs">("marketplace")
  const [userIPFSHash, setUserIPFSHash] = useState("")
  const [isValidatingIPFS, setIsValidatingIPFS] = useState(false)
  const [ipfsValidated, setIpfsValidated] = useState(false)

  const [metadataMethod, setMetadataMethod] = useState<"auto" | "ipfs">("auto")
  const [userMetadataIPFS, setUserMetadataIPFS] = useState("")
  const [metadataValidated, setMetadataValidated] = useState(false)

  const { isConnected, address } = useWallet()
  const { toast } = useToast()
  const router = useRouter()

  const isWhitelisted = address ? storageWhitelist.isWhitelisted(address) : false
  const storageUsage = address ? storageWhitelist.getStorageUsage(address) : null

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const validation = await validateImage(file, IMAGE_REQUIREMENTS.NFT_MINT)

      if (!validation.valid) {
        toast({
          title: "Invalid Image",
          description: validation.error || "Please check image requirements and try again",
          variant: "destructive",
        })
        return
      }

      if (validation.dimensions) {
        toast({
          title: "Image Validated",
          description: `${validation.dimensions.width}x${validation.dimensions.height}px, ${formatFileSize(validation.fileSize || 0)}`,
        })
      }

      const localPreviewUrl = URL.createObjectURL(file)

      setFormData((prev) => ({
        ...prev,
        file,
        filePreview: localPreviewUrl,
      }))

      setIsUploading(true)

      if (uploadMethod === "marketplace" && isWhitelisted && address) {
        const result = await web3Storage.uploadToMarketplaceStorage(file, address)
        setIpfsResult({
          cid: result.cid,
          url: result.url,
          gateway: result.gateway,
        })
      } else {
        // Fallback to local IPFS simulation
        const ipfsResult = await ipfsStorage.uploadFile(file)
        setIpfsResult(ipfsResult)
      }

      setIsUploading(false)

      toast({
        title: "Upload Successful",
        description: `${file.name} is ready for minting`,
      })
    } catch (error: any) {
      setIsUploading(false)

      let errorMessage = "Failed to upload file. Please try again."

      if (error.message?.includes("not authorized")) {
        errorMessage = error.message
      } else if (error.message?.includes("quota exceeded")) {
        errorMessage = error.message
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message?.includes("size")) {
        errorMessage = "File is too large. Please compress your image and try again."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleValidateIPFS = async () => {
    if (!userIPFSHash.trim()) {
      toast({
        title: "Missing IPFS Hash",
        description: "Please enter an IPFS hash or URL",
        variant: "destructive",
      })
      return
    }

    setIsValidatingIPFS(true)

    try {
      const result = await web3Storage.validateIPFSHash(userIPFSHash)

      if (result.valid && result.url) {
        setIpfsValidated(true)
        setIpfsResult({
          cid: result.url.replace("ipfs://", ""),
          url: result.url,
          gateway: web3Storage.getGatewayUrl(result.url.replace("ipfs://", "")),
        })

        // Set preview from gateway
        setFormData((prev) => ({
          ...prev,
          filePreview: web3Storage.getGatewayUrl(result.url!.replace("ipfs://", "")),
        }))

        toast({
          title: "IPFS Link Validated",
          description: "Your IPFS content is accessible and ready for minting",
        })
      } else {
        toast({
          title: "Validation Failed",
          description: result.error || "Could not validate IPFS hash. Please check and try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate IPFS hash",
        variant: "destructive",
      })
    } finally {
      setIsValidatingIPFS(false)
    }
  }

  const handleValidateMetadataIPFS = async () => {
    if (!userMetadataIPFS.trim()) {
      toast({
        title: "Missing Metadata IPFS",
        description: "Please enter a metadata IPFS hash",
        variant: "destructive",
      })
      return
    }

    setIsValidatingIPFS(true)

    try {
      const result = await web3Storage.validateIPFSHash(userMetadataIPFS)

      if (result.valid) {
        setMetadataValidated(true)
        toast({
          title: "Metadata Validated",
          description: "Your metadata JSON is accessible",
        })
      } else {
        toast({
          title: "Validation Failed",
          description: result.error || "Could not validate metadata IPFS hash",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate metadata IPFS hash",
        variant: "destructive",
      })
    } finally {
      setIsValidatingIPFS(false)
    }
  }

  const handleAddAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setNftAttributes([...nftAttributes, newAttribute])
      setNewAttribute({ trait_type: "", value: "" })
      toast({
        title: "Attribute added",
        description: `${newAttribute.trait_type}: ${newAttribute.value}`,
      })
    }
  }

  const handleRemoveAttribute = (index: number) => {
    setNftAttributes(nftAttributes.filter((_, i) => i !== index))
  }

  const handleMintNFT = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint NFTs",
        variant: "destructive",
      })
      return
    }

    if (!formData.file && !ipfsValidated && metadataMethod === "auto") {
      toast({
        title: "Missing Artwork",
        description: "Please upload an image for your NFT or provide a valid IPFS link",
        variant: "destructive",
      })
      return
    }

    if (metadataMethod === "ipfs" && !metadataValidated) {
      toast({
        title: "Metadata Not Validated",
        description: "Please validate your metadata IPFS hash before proceeding",
        variant: "destructive",
      })
      return
    }

    if (!formData.name || formData.name.trim().length === 0) {
      toast({
        title: "Missing NFT Name",
        description: "Please enter a name for your NFT",
        variant: "destructive",
      })
      return
    }

    if (formData.name.length > 64) {
      toast({
        title: "Name Too Long",
        description: "NFT name must be 64 characters or less",
        variant: "destructive",
      })
      return
    }

    if (!formData.description || formData.description.trim().length === 0) {
      toast({
        title: "Missing Description",
        description: "Please enter a description for your NFT",
        variant: "destructive",
      })
      return
    }

    if (!formData.category || formData.category.trim().length === 0) {
      toast({
        title: "Missing Category",
        description: "Please select a category for your NFT",
        variant: "destructive",
      })
      return
    }

    if (!formData.rarity || formData.rarity.trim().length === 0) {
      toast({
        title: "Missing Rarity",
        description: "Please select a rarity level for your NFT",
        variant: "destructive",
      })
      return
    }

    const royaltyNum = Number.parseFloat(formData.royaltyPercentage)
    if (royaltyNum < 0.1 || royaltyNum > 5) {
      toast({
        title: "Invalid Royalty",
        description: "Royalty must be between 0.1% and 5%",
        variant: "destructive",
      })
      return
    }

    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      })
      return
    }

    if (!ipfsResult && uploadMethod === "marketplace") {
      toast({
        title: "Upload In Progress",
        description: "Please wait for the file upload to complete",
        variant: "destructive",
      })
      return
    }

    if (!copyrightAccepted || !termsAccepted) {
      toast({
        title: "Terms Not Accepted",
        description: "You must accept the copyright and terms to continue",
        variant: "destructive",
      })
      return
    }

    setIsMinting(true)

    try {
      const nftMetadata = {
        name: formData.name,
        description: formData.description,
        attributes: nftAttributes,
        properties: {
          color: formData.color,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          category: formData.category || "Art",
          rarity: formData.rarity || "Common",
          contractType,
          saleType: formData.saleType,
          auctionDuration: formData.auctionDuration,
          royalty: {
            percentage: formData.royaltyPercentage,
            address: formData.royaltyAddress || address,
          },
        },
      }

      // If a file was uploaded, upload the metadata with it. Otherwise, just use the existing IPFS CID.
      let imageResult: { cid: string; url: string; gateway: string } | undefined
      let metadataResult: { cid: string; url: string; gateway: string } | undefined

      if (formData.file) {
        const { imageResult: imgRes, metadataResult: metaRes } = await ipfsStorage.uploadNFTWithMetadata(
          formData.file,
          nftMetadata,
        )
        imageResult = imgRes
        metadataResult = metaRes
      } else if (uploadMethod === "ipfs" && metadataMethod === "auto") {
        // If only IPFS hash is provided and metadata is auto-generated
        const { cid, url, gateway } = await ipfsStorage.uploadMetadata(nftMetadata)
        metadataResult = { cid, url, gateway }
      }

      const uniqueId = Date.now() + Math.floor(Math.random() * 10000)

      const imageDataUrl = formData.file
        ? await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(formData.file!)
          })
        : ipfsResult?.gateway || userIPFSHash // Use gateway URL if IPFS hash was provided

      const newNFT = {
        id: uniqueId,
        name: formData.name,
        description: formData.description,
        image: imageDataUrl,
        imageIPFS: imageResult ? imageResult.url : ipfsResult?.url || userIPFSHash, // Use result from uploadNFTWithMetadata or provided IPFS
        imageGateway: imageResult ? imageResult.gateway : ipfsResult?.gateway,
        metadataIPFS: metadataResult ? metadataResult.url : userMetadataIPFS || ipfsResult?.url, // Use result from uploadNFTWithMetadata or provided IPFS
        price: formData.price,
        currency: "QOM",
        creator: address,
        creatorName: `${address?.slice(0, 6)}...${address?.slice(-4)}`,
        likes: 0,
        views: 0,
        isLazyMinted: lazyMintEnabled,
        category: formData.category || "Art",
        rarity: formData.rarity || "Common",
        contractType,
        properties: {
          color: formData.color,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
        attributes: nftAttributes,
        saleType: formData.saleType,
        auctionDuration: formData.auctionDuration,
        royalty: {
          percentage: formData.royaltyPercentage,
          address: formData.royaltyAddress || address,
        },
        createdAt: new Date().toISOString(),
        status: "listed",
        ipfs: {
          imageCID: imageResult ? imageResult.cid : ipfsResult?.cid,
          metadataCID: metadataResult
            ? metadataResult.cid
            : userMetadataIPFS
              ? userMetadataIPFS.replace("ipfs://", "")
              : ipfsResult?.cid,
          imageUrl: imageResult ? imageResult.url : ipfsResult?.url || userIPFSHash,
          metadataUrl: metadataResult ? metadataResult.url : userMetadataIPFS || ipfsResult?.url,
        },
      }

      console.log("[v0] Minting NFT:", {
        id: uniqueId,
        name: formData.name,
        creator: address,
        willSaveToGlobal: true,
      })

      const existingNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      console.log("[v0] Existing marketplace NFTs before save:", existingNFTs.length)

      const updatedNFTs = [newNFT, ...existingNFTs]
      localStorage.setItem("marketplace-nfts", JSON.stringify(updatedNFTs))

      console.log("[v0] Marketplace NFTs after save:", updatedNFTs.length)
      console.log("[v0] Saved to marketplace-nfts:", {
        totalNFTs: updatedNFTs.length,
        newNFT: { id: newNFT.id, name: newNFT.name, creator: newNFT.creator },
      })

      // NFTs are now only stored in marketplace-nfts and filtered by creator address

      window.dispatchEvent(new Event("nft-added"))

      toast({
        title: "NFT Created Successfully!",
        description: `${formData.name} has been ${lazyMintEnabled ? "lazy minted" : "minted"} and listed for sale`,
      })

      setTimeout(() => {
        router.push("/marketplace")
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Minting failed:", error)
      let errorMessage = "Failed to create NFT. Please try again."

      if (error.message?.includes("storage")) {
        errorMessage = "Storage error. Please try again or contact support."
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <WalletProtectionGuard
      title="Connect Wallet to Mint NFTs"
      description="Creating and minting NFTs requires a connected wallet to manage ownership and transactions on the QL1 blockchain."
      icon={<ZapIcon className="w-10 h-10 text-primary" />}
      showFullPage={true}
    >
      <div className="hidden">
        <QOMPriceFetcher />
      </div>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-foreground mb-2">Create Your NFT: Unleash Your Art on QL1!</h1>
              <p className="text-muted-foreground">
                Transform your digital art into unique NFTs on the eco-friendly QL1 blockchain with ultra-low fees
              </p>
            </div>

            <Card className="origami-card mb-4 bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ZapIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary text-sm mb-2">Why Mint on QL1?</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 99.9% cheaper than Ethereum - Save on gas fees</li>
                      <li>• 5-30 second confirmations - Lightning fast</li>
                      <li>• Eco-friendly minting - Sustainable blockchain</li>
                      <li>• Secure & scalable - Enterprise-grade infrastructure</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <Card className="origami-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Upload Your Artwork</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Choose Upload Method</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Card
                        className={`cursor-pointer transition-all hover:border-primary/50 ${
                          uploadMethod === "marketplace" ? "ring-2 ring-primary" : ""
                        } ${!isWhitelisted ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => isWhitelisted && setUploadMethod("marketplace")}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <UploadIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs">Upload to Marketplace</span>
                                {isWhitelisted && <StarIcon className="w-3 h-3 text-yellow-500" />}
                              </div>
                              <p className="text-xs text-muted-foreground">We handle storage & metadata</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all hover:border-primary/50 ${
                          uploadMethod === "ipfs" ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setUploadMethod("ipfs")}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <LinkIcon className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold text-xs">Provide Your Own IPFS</span>
                              <p className="text-xs text-muted-foreground">You control storage</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {uploadMethod === "marketplace" ? (
                    <div>
                      <Label className="text-sm mb-2 block">Upload File</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,.glb"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          disabled={isUploading || !isWhitelisted}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex justify-center gap-2">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              <BoxIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm mb-1">
                                {isUploading ? "Uploading..." : "Drop your file here"}
                              </p>
                              <p className="text-xs text-muted-foreground">Supported: PNG, JPEG, GIF, GLB</p>
                              <p className="text-xs text-muted-foreground">Max size: 50MB</p>
                            </div>
                            <OrigamiButton
                              variant="secondary"
                              disabled={isUploading || !isWhitelisted}
                              type="button"
                              size="sm"
                            >
                              {isUploading ? "Processing..." : "Browse Files"}
                            </OrigamiButton>
                          </div>
                        </label>
                      </div>
                      {storageUsage && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Storage: {storageUsage.used.toFixed(2)} / {storageUsage.limit} MB used
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Label htmlFor="ipfs-hash" className="text-sm">
                            Image IPFS Hash
                          </Label>
                          <div className="group relative">
                            <InfoIcon className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border rounded-lg shadow-lg text-xs z-10">
                              Validation checks: IPFS format, accessibility, and file type
                            </div>
                          </div>
                        </div>
                        <Input
                          id="ipfs-hash"
                          placeholder="QmXxx... or ipfs://QmXxx..."
                          value={userIPFSHash}
                          onChange={(e) => {
                            setUserIPFSHash(e.target.value)
                            setIpfsValidated(false)
                          }}
                        />
                        <OrigamiButton
                          variant="secondary"
                          onClick={handleValidateIPFS}
                          disabled={isValidatingIPFS || !userIPFSHash.trim()}
                          className="w-full mt-2"
                          size="sm"
                        >
                          {isValidatingIPFS ? "Validating..." : "Validate Image"}
                        </OrigamiButton>
                        {ipfsValidated && (
                          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg mt-2">
                            <div className="flex items-center gap-2 text-green-600 text-xs">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Image validated</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm mb-2 block">Metadata Handling</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Card
                            className={`cursor-pointer transition-all hover:border-primary/50 ${
                              metadataMethod === "auto" ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setMetadataMethod("auto")}
                          >
                            <CardContent className="p-2.5">
                              <div className="flex items-center gap-2">
                                <ZapIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-xs">Create from Form (Recommended)</p>
                                  <p className="text-xs text-muted-foreground">
                                    Fill out the form below to create metadata
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card
                            className={`cursor-pointer transition-all hover:border-primary/50 ${
                              metadataMethod === "ipfs" ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setMetadataMethod("ipfs")}
                          >
                            <CardContent className="p-2.5">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-xs">Provide Metadata IPFS</p>
                                  <p className="text-xs text-muted-foreground">Advanced: Use your own metadata JSON</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {metadataMethod === "ipfs" && (
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Label htmlFor="metadata-ipfs" className="text-sm">
                              Metadata JSON IPFS Hash
                            </Label>
                            <a
                              href="https://docs.opensea.org/docs/metadata-standards"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View template
                            </a>
                          </div>
                          <Input
                            id="metadata-ipfs"
                            placeholder="QmXxx... (metadata.json)"
                            value={userMetadataIPFS}
                            onChange={(e) => {
                              setUserMetadataIPFS(e.target.value)
                              setMetadataValidated(false)
                            }}
                          />
                          <OrigamiButton
                            variant="secondary"
                            onClick={handleValidateMetadataIPFS}
                            disabled={isValidatingIPFS || !userMetadataIPFS.trim()}
                            className="w-full mt-2"
                            size="sm"
                          >
                            {isValidatingIPFS ? "Validating..." : "Validate Metadata"}
                          </OrigamiButton>
                          {metadataValidated && (
                            <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg mt-2">
                              <div className="flex items-center gap-2 text-green-600 text-xs">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Metadata validated</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground space-y-1 pt-2">
                        <p className="font-medium text-foreground">Free IPFS providers:</p>
                        <p>• Pinata.cloud (1 GB free)</p>
                        <p>• NFT.Storage (unlimited free)</p>
                      </div>
                    </div>
                  )}

                  {!isWhitelisted && uploadMethod === "marketplace" && (
                    <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Want marketplace storage?</strong> Contact admin for
                        verified creator status.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <EyeIcon className="w-4 h-4" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full max-w-[200px] mx-auto aspect-square bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden border border-muted">
                    {formData.filePreview && (uploadMethod === "marketplace" || ipfsValidated) ? (
                      <Image
                        src={formData.filePreview || "/placeholder.svg"}
                        alt="NFT Preview"
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        sizes="200px"
                        priority={true}
                      />
                    ) : (
                      <div className="text-center space-y-2 p-4">
                        <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                        <p className="text-muted-foreground text-xs">
                          {uploadMethod === "ipfs" && !ipfsValidated
                            ? "Validate IPFS link to see preview"
                            : "Your artwork will appear here"}
                        </p>
                      </div>
                    )}
                  </div>

                  {formData.name && (uploadMethod === "marketplace" || ipfsValidated) && (
                    <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-muted">
                      <p className="text-xs font-semibold text-foreground mb-1">{formData.name}</p>
                      {formData.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{formData.description}</p>
                      )}
                      {formData.rarity && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {formData.rarity}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {(uploadMethod === "marketplace" || (uploadMethod === "ipfs" && metadataMethod === "auto")) && (
              <Card className="origami-card mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">NFT Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="nft-name" className="text-sm">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nft-name"
                        placeholder="Enter your NFT name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description" className="text-sm">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Tell collectors about your NFT..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm">
                        Category
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="3d">3D Models</SelectItem>
                          <SelectItem value="collectibles">Collectibles</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Label htmlFor="rarity" className="text-sm">
                          Rarity Level
                        </Label>
                        <div className="group relative">
                          <InfoIcon className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border rounded-lg shadow-lg text-xs z-10">
                            <p className="font-semibold mb-1">Rarity Levels:</p>
                            <p>• Common: Standard items</p>
                            <p>• Rare: Limited availability</p>
                            <p>• Legendary: Extremely rare</p>
                          </div>
                        </div>
                      </div>
                      <Select
                        value={formData.rarity}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, rarity: value }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select rarity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Common">Common</SelectItem>
                          <SelectItem value="Rare">Rare</SelectItem>
                          <SelectItem value="Epic">Epic</SelectItem>
                          <SelectItem value="Legendary">Legendary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tags" className="text-sm">
                        Tags
                      </Label>
                      <Input
                        id="tags"
                        placeholder="art, digital, abstract"
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm mb-2 block">Custom Attributes (Optional)</Label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input
                          placeholder="Attribute name"
                          value={newAttribute.trait_type}
                          onChange={(e) => setNewAttribute((prev) => ({ ...prev, trait_type: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Value"
                            value={newAttribute.value}
                            onChange={(e) => setNewAttribute((prev) => ({ ...prev, value: e.target.value }))}
                          />
                          <OrigamiButton
                            variant="secondary"
                            onClick={handleAddAttribute}
                            disabled={!newAttribute.trait_type || !newAttribute.value}
                            type="button"
                            size="sm"
                          >
                            Add
                          </OrigamiButton>
                        </div>
                      </div>

                      {nftAttributes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {nftAttributes.map((attr, index) => (
                            <Badge key={index} variant="secondary" className="px-2 py-1 text-xs">
                              {attr.trait_type}: {attr.value}
                              <button
                                onClick={() => handleRemoveAttribute(index)}
                                className="ml-1.5 text-muted-foreground hover:text-foreground"
                                type="button"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {uploadMethod === "ipfs" && metadataMethod === "ipfs" && (
              <Card className="origami-card mb-4 bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-600 text-sm mb-1">Using Your Own Metadata</p>
                      <p className="text-xs text-muted-foreground">
                        Your metadata JSON will be used as-is. Make sure it includes: name, description, image, and any
                        attributes you want to display.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mb-4">
              <QOMCostCalculator
                type="minting"
                defaultQuantity={1}
                defaultPrice={Number.parseFloat(formData.price) || 1}
              />
            </div>

            <Card className="origami-card mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSignIcon className="w-4 h-4" />
                  Pricing & Sale Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Sale Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card
                      className={`cursor-pointer transition-all hover:border-primary/50 ${formData.saleType === "fixed" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, saleType: "fixed" }))}
                    >
                      <CardContent className="p-3 text-center">
                        <DollarSignIcon className="w-6 h-6 mx-auto mb-1.5 text-primary" />
                        <p className="font-semibold text-sm">Fixed Price</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Set a specific price</p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all hover:border-primary/50 ${formData.saleType === "auction" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, saleType: "auction" }))}
                    >
                      <CardContent className="p-3 text-center">
                        <ZapIcon className="w-6 h-6 mx-auto mb-1.5 text-primary" />
                        <p className="font-semibold text-sm">Auction</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Highest bidder wins</p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all hover:border-primary/50 ${formData.saleType === "offer" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, saleType: "offer" }))}
                    >
                      <CardContent className="p-3 text-center">
                        <ShieldIcon className="w-6 h-6 mx-auto mb-1.5 text-primary" />
                        <p className="font-semibold text-sm">Open for Offers</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Accept best offer</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-sm">
                      Price (QOM) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  {formData.saleType === "auction" && (
                    <div>
                      <Label htmlFor="duration" className="text-sm">
                        Auction Duration
                      </Label>
                      <Select
                        value={formData.auctionDuration}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, auctionDuration: value }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label className="text-sm mb-2 block">Royalty Settings</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="royalty" className="text-xs">
                        Royalty Percentage
                      </Label>
                      <Select
                        value={formData.royaltyPercentage}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, royaltyPercentage: value }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select percentage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0% - No royalty</SelectItem>
                          <SelectItem value="2.5">2.5%</SelectItem>
                          <SelectItem value="5">5% - Recommended</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="15">15%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Earn from future resales</p>
                    </div>
                    <div>
                      <Label htmlFor="royalty-address" className="text-xs">
                        Royalty Address (Optional)
                      </Label>
                      <Input
                        id="royalty-address"
                        placeholder={address || "0x..."}
                        value={formData.royaltyAddress}
                        onChange={(e) => setFormData((prev) => ({ ...prev, royaltyAddress: e.target.value }))}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Defaults to your wallet</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <ZapIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary text-sm">Lazy Minting (LAZZYMINT)</span>
                          <div className="group relative">
                            <InfoIcon className="w-3.5 h-3.5 text-primary cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border rounded-lg shadow-lg text-xs z-10">
                              Lazy minting creates your NFT only when it's purchased, saving you upfront gas fees
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Save gas fees by minting only when your NFT is purchased. Eco-friendly and cost-effective.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            No upfront fees
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            Instant listing
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            Eco-friendly
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Switch checked={lazyMintEnabled} onCheckedChange={setLazyMintEnabled} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="origami-card mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldIcon className="w-4 h-4" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                  <input
                    type="checkbox"
                    id="copyright"
                    className="mt-0.5 cursor-pointer"
                    checked={copyrightAccepted}
                    onChange={(e) => setCopyrightAccepted(e.target.checked)}
                  />
                  <Label htmlFor="copyright" className="text-xs cursor-pointer leading-relaxed">
                    I confirm that I own the copyright to this work and have the right to mint it as an NFT
                  </Label>
                </div>
                <div className="flex items-start gap-2.5 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-0.5 cursor-pointer"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <Label htmlFor="terms" className="text-xs cursor-pointer leading-relaxed">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary hover:underline" rel="noreferrer">
                      Terms of Service
                    </a>{" "}
                    and understand the marketplace fees (6% total: 3% buyer + 3% seller + 1% platform donation)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <OrigamiButton
                variant="secondary"
                className="flex-1 h-11"
                onClick={() => router.push("/marketplace")}
                type="button"
              >
                Cancel
              </OrigamiButton>
              <OrigamiButton
                variant="primary"
                className="flex-1 h-11"
                onClick={handleMintNFT}
                disabled={
                  isMinting ||
                  isUploading ||
                  (!formData.file && !ipfsValidated && metadataMethod === "auto") ||
                  (metadataMethod === "ipfs" && !metadataValidated) ||
                  !formData.name ||
                  formData.name.length > 64 ||
                  !formData.description ||
                  !formData.category ||
                  !formData.rarity ||
                  Number.parseFloat(formData.royaltyPercentage) < 0.1 ||
                  Number.parseFloat(formData.royaltyPercentage) > 5 ||
                  !formData.price ||
                  !copyrightAccepted ||
                  !termsAccepted
                }
              >
                {isMinting ? (
                  <>
                    <ZapIcon className="w-4 h-4 mr-2 animate-spin" />
                    {lazyMintEnabled ? "Creating NFT..." : "Minting NFT..."}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    {lazyMintEnabled ? "Create NFT" : "Mint NFT"}
                  </>
                )}
              </OrigamiButton>
            </div>
          </div>
        </div>
      </div>
    </WalletProtectionGuard>
  )
}
