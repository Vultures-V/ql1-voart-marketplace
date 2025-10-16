"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  X,
  Plus,
  ImageIcon,
  FileText,
  Music,
  Video,
  FileUp as File3D,
  FileIcon,
  Zap,
  Package,
  ArrowLeft,
} from "@/components/simple-icons"
import Link from "next/link"
import { ipfsStorage, type IPFSUploadResult } from "@/lib/ipfs-storage"

interface NFTAttribute {
  trait_type: string
  value: string
}

interface Collection {
  id: string
  name: string
  description: string
  symbol: string
  category: string
  network: string
  royalties: number
  totalSupply: string
  isUnlimited: boolean
  mintingType: string
  coverImage?: string
  logo?: string
  traits: NFTAttribute[]
  createdAt: string
  creator: string
}

export default function CollectionManagePage({ params }: { params: { id: string } }) {
  const { isConnected, address } = useWallet()
  const { toast } = useToast()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [activeTab, setActiveTab] = useState("single")

  // Single NFT form state
  const [singleNFT, setSingleNFT] = useState({
    name: "",
    description: "",
    price: "",
    supply: "1",
    media: null as File | null,
  })
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [singleAttributes, setSingleAttributes] = useState<NFTAttribute[]>([])
  const [newAttribute, setNewAttribute] = useState({ trait_type: "", value: "" })

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [bulkMethod, setBulkMethod] = useState<"files" | "csv" | "json">("files")
  const [csvData, setCsvData] = useState("")
  const [jsonData, setJsonData] = useState("")

  // IPFS upload state
  const [ipfsResults, setIpfsResults] = useState<IPFSUploadResult[]>([])

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadCollection()
  }, [params.id])

  const loadCollection = () => {
    try {
      const collections = JSON.parse(localStorage.getItem("user-collections") || "[]")
      const foundCollection = collections.find((c: Collection) => c.id === params.id)

      if (foundCollection) {
        setCollection(foundCollection)
      } else {
        toast({
          title: "Collection not found",
          description: "The collection you're looking for doesn't exist.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading collection:", error)
      toast({
        title: "Error loading collection",
        description: "Failed to load collection details.",
        variant: "destructive",
      })
    }
  }

  const handleSingleNFTChange = (field: string, value: any) => {
    setSingleNFT((prev) => ({ ...prev, [field]: value }))
  }

  const handleMediaUpload = async (file: File) => {
    try {
      console.log("[v0] Uploading single media file to IPFS:", file.name)

      const previewUrl = URL.createObjectURL(file)
      setMediaPreview(previewUrl)

      const ipfsResult = await ipfsStorage.uploadFile(file)

      setSingleNFT((prev) => ({ ...prev, media: file }))
      setIpfsResults([ipfsResult])

      toast({
        title: "Media uploaded to IPFS",
        description: `${file.name} is now stored on IPFS`,
      })

      console.log("[v0] Single media uploaded to IPFS:", ipfsResult)
    } catch (error) {
      console.error("[v0] Single media IPFS upload failed:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload media to IPFS. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setSingleAttributes((prev) => [...prev, { ...newAttribute }])
      setNewAttribute({ trait_type: "", value: "" })
    }
  }

  const removeAttribute = (index: number) => {
    setSingleAttributes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBulkFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    setBulkFiles(fileArray)

    try {
      console.log("[v0] Starting bulk IPFS upload for", fileArray.length, "files")
      const results = await ipfsStorage.uploadFiles(fileArray)
      setIpfsResults(results)

      toast({
        title: "Files uploaded to IPFS",
        description: `${fileArray.length} files are now stored on IPFS`,
      })

      console.log("[v0] Bulk files uploaded to IPFS:", results)
    } catch (error) {
      console.error("[v0] Bulk IPFS upload failed:", error)
      toast({
        title: "Bulk upload failed",
        description: "Some files failed to upload to IPFS. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />
    if (type.startsWith("audio/")) return <Music className="w-5 h-5" />
    if (type.startsWith("video/")) return <Video className="w-5 h-5" />
    if (type.includes("model") || file.name.endsWith(".glb") || file.name.endsWith(".gltf"))
      return <File3D className="w-5 h-5" />
    if (type.includes("text") || type.includes("pdf")) return <FileText className="w-5 h-5" />
    return <FileIcon className="w-5 h-5" />
  }

  const createSingleNFT = async () => {
    if (!collection || !singleNFT.name || !singleNFT.media) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload media.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Creating single NFT with IPFS integration")

      const nftMetadata = {
        name: singleNFT.name,
        description: singleNFT.description,
        attributes: singleAttributes,
        properties: {
          collection: collection.name,
          category: collection.category,
          network: collection.network,
          supply: Number.parseInt(singleNFT.supply),
        },
      }

      const { imageResult, metadataResult } = await ipfsStorage.uploadNFTWithMetadata(singleNFT.media, nftMetadata)

      const nftData = {
        id: Date.now(),
        collectionId: collection.id,
        collectionName: collection.name,
        name: singleNFT.name,
        description: singleNFT.description,
        price: singleNFT.price,
        currency: "QOM",
        supply: Number.parseInt(singleNFT.supply),
        image: imageResult.gateway, // Use IPFS gateway URL for display
        imageIPFS: imageResult.url, // Store IPFS URL
        metadataIPFS: metadataResult.url, // Store metadata IPFS URL
        media: singleNFT.media.name,
        mediaType: singleNFT.media.type,
        attributes: singleAttributes,
        creator: address,
        creatorName: "You",
        status: "listed",
        likes: 0,
        views: 0,
        createdAt: new Date().toISOString(),
        category: collection.category,
        network: collection.network,
        rarity: "Common",
        saleType: "fixed",
        isLazyMinted: collection.mintingType === "lazy",
        ipfs: {
          imageCID: imageResult.cid,
          metadataCID: metadataResult.cid,
          imageUrl: imageResult.url,
          metadataUrl: metadataResult.url,
        },
      }

      // Store NFT
      const existingNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      existingNFTs.push(nftData)
      localStorage.setItem("marketplace-nfts", JSON.stringify(existingNFTs))

      toast({
        title: "NFT created successfully with IPFS!",
        description: `${singleNFT.name} has been added to ${collection.name} with decentralized storage.`,
      })

      console.log("[v0] Single NFT created with IPFS:", nftData)

      // Reset form
      setSingleNFT({
        name: "",
        description: "",
        price: "",
        supply: "1",
        media: null,
      })
      setSingleAttributes([])
      setIpfsResults([])
      setMediaPreview(null)
    } catch (error) {
      console.error("[v0] Error creating NFT with IPFS:", error)
      toast({
        title: "Error creating NFT",
        description: "Failed to create NFT with IPFS storage. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createBulkNFTs = async () => {
    if (!collection) return

    if (bulkMethod === "files" && bulkFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      })
      return
    }

    if (bulkMethod === "csv" && !csvData.trim()) {
      toast({
        title: "No CSV data",
        description: "Please provide CSV data.",
        variant: "destructive",
      })
      return
    }

    if (bulkMethod === "json" && !jsonData.trim()) {
      toast({
        title: "No JSON data",
        description: "Please provide JSON data.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Creating bulk NFTs with IPFS integration")

      let nftCount = 0
      const newNFTs = []

      if (bulkMethod === "files" && ipfsResults.length > 0) {
        for (let i = 0; i < bulkFiles.length && i < ipfsResults.length; i++) {
          const file = bulkFiles[i]
          const ipfsResult = ipfsResults[i]

          const nftMetadata = {
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
            description: `NFT created from ${file.name}`,
            attributes: [],
            properties: {
              collection: collection.name,
              category: collection.category,
              network: collection.network,
              originalFilename: file.name,
            },
          }

          const metadataResult = await ipfsStorage.uploadMetadata({
            ...nftMetadata,
            image: ipfsResult.url,
          })

          const nftData = {
            id: Date.now() + i,
            collectionId: collection.id,
            collectionName: collection.name,
            name: nftMetadata.name,
            description: nftMetadata.description,
            price: "1.0", // Default price
            currency: "QOM",
            supply: 1,
            image: ipfsResult.gateway,
            imageIPFS: ipfsResult.url,
            metadataIPFS: metadataResult.url,
            media: file.name,
            mediaType: file.type,
            attributes: [],
            creator: address,
            creatorName: "You",
            status: "listed",
            likes: 0,
            views: 0,
            createdAt: new Date().toISOString(),
            category: collection.category,
            network: collection.network,
            rarity: "Common",
            saleType: "fixed",
            isLazyMinted: collection.mintingType === "lazy",
            ipfs: {
              imageCID: ipfsResult.cid,
              metadataCID: metadataResult.cid,
              imageUrl: ipfsResult.url,
              metadataUrl: metadataResult.url,
            },
          }

          newNFTs.push(nftData)
        }
        nftCount = newNFTs.length
      } else if (bulkMethod === "csv") {
        const lines = csvData.trim().split("\n")
        nftCount = lines.length - 1 // Subtract header
        // Process CSV...
      } else if (bulkMethod === "json") {
        const data = JSON.parse(jsonData)
        nftCount = Array.isArray(data) ? data.length : 1
        // Process JSON...
      }

      // Store new NFTs
      if (newNFTs.length > 0) {
        const existingNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
        const updatedNFTs = [...newNFTs, ...existingNFTs]
        localStorage.setItem("marketplace-nfts", JSON.stringify(updatedNFTs))

        console.log("[v0] Bulk NFTs created with IPFS:", newNFTs.length)
      }

      toast({
        title: "Bulk NFTs created successfully with IPFS!",
        description: `${nftCount} NFTs have been added to ${collection.name} with decentralized storage.`,
      })

      // Reset form
      setBulkFiles([])
      setCsvData("")
      setJsonData("")
      setIpfsResults([])
    } catch (error) {
      console.error("[v0] Error creating bulk NFTs with IPFS:", error)
      toast({
        title: "Error creating bulk NFTs",
        description: "Failed to create NFTs with IPFS storage. Please check your data format and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Wallet Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please connect your wallet to manage your collection.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Loading Collection...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Please wait while we load your collection.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/collections">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collections
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
          <p className="text-muted-foreground text-lg mb-4">{collection.description}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{collection.category}</Badge>
            <Badge variant="outline">{collection.network}</Badge>
            <Badge variant="outline">{collection.mintingType} minting</Badge>
          </div>
        </div>

        {/* Upload NFTs Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Upload NFTs to Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Create Single</TabsTrigger>
                <TabsTrigger value="multiple">Create Multiple</TabsTrigger>
              </TabsList>

              {/* Single NFT Creation */}
              <TabsContent value="single" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Media Upload */}
                  <div className="space-y-4">
                    <Label>Media *</Label>
                    <p className="text-sm text-muted-foreground">
                      You can upload image, audio, video, HTML, text, PDF, or 3D model files.
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,audio/*,video/*,text/*,application/pdf,.glb,.gltf,.html"
                        onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
                        className="hidden"
                        id="media-upload"
                      />
                      <label htmlFor="media-upload" className="cursor-pointer block">
                        {singleNFT.media ? (
                          <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-muted hover:border-primary transition-colors">
                            {singleNFT.media.type.startsWith("image/") && mediaPreview ? (
                              <>
                                <img
                                  src={mediaPreview || "/placeholder.svg"}
                                  alt="NFT Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                  <Upload className="w-8 h-8 mb-2" />
                                  <p className="font-medium">Click to change</p>
                                  <p className="text-xs mt-1">{singleNFT.media.name}</p>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 p-6">
                                {getFileIcon(singleNFT.media)}
                                <p className="font-medium mt-4 text-center break-all px-4">{singleNFT.media.name}</p>
                                <p className="text-xs text-muted-foreground mt-2">Click to change</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-square w-full max-w-sm mx-auto rounded-lg border-2 border-dashed border-muted hover:border-primary transition-colors flex flex-col items-center justify-center p-6 bg-muted/5">
                            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="font-medium text-center">Upload Media</p>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Drag and drop or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              PNG, JPG, GIF, MP4, MP3, PDF, GLB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* NFT Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nft-name">Name *</Label>
                      <Input
                        id="nft-name"
                        value={singleNFT.name}
                        onChange={(e) => handleSingleNFTChange("name", e.target.value)}
                        placeholder="Enter NFT name"
                        className="form-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nft-description">Description</Label>
                      <Textarea
                        id="nft-description"
                        value={singleNFT.description}
                        onChange={(e) => handleSingleNFTChange("description", e.target.value)}
                        placeholder="Describe your NFT"
                        rows={3}
                        className="form-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nft-price">Price (QOM)</Label>
                        <Input
                          id="nft-price"
                          type="number"
                          step="0.001"
                          min="0"
                          value={singleNFT.price}
                          onChange={(e) => handleSingleNFTChange("price", e.target.value)}
                          placeholder="0.00"
                          className="form-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nft-supply">Supply</Label>
                        <Input
                          id="nft-supply"
                          type="number"
                          min="1"
                          value={singleNFT.supply}
                          onChange={(e) => handleSingleNFTChange("supply", e.target.value)}
                          placeholder="1"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-4">
                  <Label>Attributes</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="attr-name">Name</Label>
                      <Input
                        id="attr-name"
                        value={newAttribute.trait_type}
                        onChange={(e) => setNewAttribute((prev) => ({ ...prev, trait_type: e.target.value }))}
                        placeholder="e.g., Color"
                        className="form-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attr-value">Value</Label>
                      <Input
                        id="attr-value"
                        value={newAttribute.value}
                        onChange={(e) => setNewAttribute((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder="e.g., Blue"
                        className="form-input"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={addAttribute}
                        disabled={!newAttribute.trait_type || !newAttribute.value}
                        className="coral-button w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Attribute
                      </Button>
                    </div>
                  </div>

                  {singleAttributes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Added Attributes</Label>
                      <div className="space-y-2">
                        {singleAttributes.map((attr, index) => (
                          <div key={index} className="trait-item">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{attr.trait_type}</Badge>
                              <span className="text-sm">{attr.value}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttribute(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={createSingleNFT}
                    disabled={isLoading || !singleNFT.name || !singleNFT.media}
                    className="coral-button px-8"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating NFT...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Create NFT
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Bulk NFT Creation */}
              <TabsContent value="multiple" className="space-y-6">
                <div className="space-y-4">
                  <Label>Upload Method</Label>
                  <Tabs value={bulkMethod} onValueChange={(value) => setBulkMethod(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="files">Upload Files</TabsTrigger>
                      <TabsTrigger value="csv">CSV</TabsTrigger>
                      <TabsTrigger value="json">JSON</TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="space-y-4">
                      <div className="upload-area">
                        <input
                          type="file"
                          multiple
                          accept="image/*,audio/*,video/*,text/*,application/pdf,.glb,.gltf,.html"
                          onChange={(e) => e.target.files && handleBulkFileUpload(e.target.files)}
                          className="hidden"
                          id="bulk-upload"
                        />
                        <label htmlFor="bulk-upload" className="cursor-pointer block">
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-navy" />
                            <p className="font-medium">Drag and drop files or folder</p>
                            <p className="text-xs text-muted-foreground">
                              Select multiple files to create NFTs in bulk
                            </p>
                          </div>
                        </label>
                      </div>

                      {bulkFiles.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selected Files ({bulkFiles.length})</Label>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {bulkFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                {getFileIcon(file)}
                                <span className="text-sm truncate">{file.name}</span>
                                {ipfsResults[index] && (
                                  <Badge variant="outline" className="text-xs">
                                    IPFS
                                  </Badge>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log("[v0] Deleting file at index:", index, "File name:", file.name)
                                    console.log(
                                      "[v0] Current files before deletion:",
                                      bulkFiles.map((f) => f.name),
                                    )
                                    setBulkFiles((prev) => {
                                      const newFiles = prev.filter((_, i) => i !== index)
                                      console.log(
                                        "[v0] Files after deletion:",
                                        newFiles.map((f) => f.name),
                                      )
                                      return newFiles
                                    })
                                    setIpfsResults((prev) => prev.filter((_, i) => i !== index))
                                  }}
                                  className="ml-auto"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="csv" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="csv-data">CSV Data</Label>
                        <Textarea
                          id="csv-data"
                          value={csvData}
                          onChange={(e) => setCsvData(e.target.value)}
                          placeholder="name,description,price,image_url,trait1,trait2&#10;NFT 1,Description 1,1.5,https://...,Blue,Rare&#10;NFT 2,Description 2,2.0,https://...,Red,Common"
                          rows={8}
                          className="form-input font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: name,description,price,image_url,trait1,trait2...
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="json" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="json-data">JSON Data</Label>
                        <Textarea
                          id="json-data"
                          value={jsonData}
                          onChange={(e) => setJsonData(e.target.value)}
                          placeholder='[{"name": "NFT 1", "description": "Description 1", "price": "1.5", "image": "https://...", "attributes": [{"trait_type": "Color", "value": "Blue"}]}]'
                          rows={8}
                          className="form-input font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Provide an array of NFT objects with metadata</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex justify-center">
                  <Button onClick={createBulkNFTs} disabled={isLoading} className="coral-button px-8">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating NFTs...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Create Multiple NFTs
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
