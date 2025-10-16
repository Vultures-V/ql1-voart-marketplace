"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Plus, Zap, Info, Calendar, Twitter, MessageCircle, Globe } from "@/components/simple-icons"
import { validateImage, IMAGE_REQUIREMENTS, formatFileSize } from "@/lib/image-validation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"

interface Trait {
  trait_type: string
  value: string
}

export default function CreateCollectionPage() {
  const { isConnected, address } = useWallet()
  const { toast } = useToast()

  const [collectionCount, setCollectionCount] = useState(0)
  const [maxCollections, setMaxCollections] = useState(100)
  const [factoryPaused, setFactoryPaused] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbol: "",
    category: "",
    network: "ql1",
    royalties: 5, // Default to 5%
    totalSupply: "",
    isUnlimited: false,
    mintingType: "lazy",
    twitter: "",
    discord: "",
    website: "",
    launchDate: "",
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [traits, setTraits] = useState<Trait[]>([])
  const [newTrait, setNewTrait] = useState({ trait_type: "", value: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const categories = [
    "Art",
    "Gaming",
    "Music",
    "Collectibles",
    "Sports",
    "Photography",
    "Utility",
    "Metaverse",
    "Fashion",
    "Domain Names",
  ]

  const suggestedRoyalties = [
    { value: 0, label: "0% (No royalties)" },
    { value: 2.5, label: "2.5%" },
    { value: 5, label: "5% (Recommended)" },
    { value: 7.5, label: "7.5%" },
    { value: 10, label: "10% (Maximum)" },
  ]

  const handleInputChange = (field: string, value: any) => {
    if (field === "name" && typeof value === "string" && value.length > 64) {
      toast({
        title: "Name too long",
        description: "Collection name must be 64 characters or less",
        variant: "destructive",
      })
      return
    }
    if (field === "symbol" && typeof value === "string" && value.length > 32) {
      toast({
        title: "Symbol too long",
        description: "Collection symbol must be 32 characters or less",
        variant: "destructive",
      })
      return
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileUpload = (file: File, type: "cover" | "logo") => {
    const requirements = type === "cover" ? IMAGE_REQUIREMENTS.COLLECTION_BANNER : IMAGE_REQUIREMENTS.COLLECTION_LOGO

    validateImage(file, requirements).then((validation) => {
      if (!validation.valid) {
        toast({
          title: "Invalid image",
          description: validation.error,
          variant: "destructive",
        })
        return
      }

      const previewUrl = URL.createObjectURL(file)

      if (validation.dimensions) {
        toast({
          title: `${type === "cover" ? "Banner" : "Logo"} uploaded`,
          description: `${validation.dimensions.width}x${validation.dimensions.height}px, ${formatFileSize(validation.fileSize || 0)}`,
        })
      }

      if (type === "cover") {
        setCoverImage(file)
        setCoverPreview(previewUrl)
      } else {
        setLogo(file)
        setLogoPreview(previewUrl)
      }
    })
  }

  const addTrait = () => {
    if (newTrait.trait_type && newTrait.value) {
      setTraits((prev) => [...prev, { ...newTrait }])
      setNewTrait({ trait_type: "", value: "" })
    }
  }

  const removeTrait = (index: number) => {
    setTraits((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a collection.",
        variant: "destructive",
      })
      return
    }

    if (factoryPaused) {
      toast({
        title: "Factory Paused",
        description: "Collection creation is temporarily paused. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (collectionCount >= maxCollections) {
      toast({
        title: "Collection Limit Reached",
        description: `You have reached the maximum of ${maxCollections} collections per creator.`,
        variant: "destructive",
      })
      return
    }

    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsLoading(true)
    try {
      const coverImageBase64 = coverImage ? await fileToBase64(coverImage) : ""
      const logoBase64 = logo ? await fileToBase64(logo) : ""

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const collectionId = `collection-${Date.now()}`

      const collectionData = {
        id: collectionId,
        ...formData,
        coverImage: coverImageBase64, // Store base64 instead of filename
        logo: logoBase64, // Store base64 instead of filename
        traits,
        createdAt: new Date().toISOString(),
        creator: address,
      }

      const existingCollections = JSON.parse(localStorage.getItem("user-collections") || "[]")
      existingCollections.push(collectionData)
      localStorage.setItem("user-collections", JSON.stringify(existingCollections))

      toast({
        title: "Collection created successfully!",
        description: `${formData.name} has been created on ${formData.network}.`,
      })

      window.location.href = `/collection/${collectionId}/manage`
    } catch (error) {
      toast({
        title: "Error creating collection",
        description: "Please try again later.",
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
            <p className="text-muted-foreground mb-4">Please connect your wallet to create a collection.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Confirm Collection Details</CardTitle>
              <p className="text-muted-foreground">Review your collection before creating it on the blockchain</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coverPreview && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Cover Image</Label>
                    <img
                      src={coverPreview || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}
                {logoPreview && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Logo</Label>
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-32 h-32 rounded-lg border object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Collection Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Collection Name</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Symbol</span>
                  <span className="font-medium">{formData.symbol}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium capitalize">{formData.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Royalty Fee</span>
                  <span className="font-medium">{formData.royalties}%</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Supply</span>
                  <span className="font-medium">{formData.isUnlimited ? "Unlimited" : formData.totalSupply}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Minting Type</span>
                  <span className="font-medium capitalize">{formData.mintingType} Minting</span>
                </div>
                {formData.launchDate && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Launch Date</span>
                    <span className="font-medium">{new Date(formData.launchDate).toLocaleDateString()}</span>
                  </div>
                )}
                {traits.length > 0 && (
                  <div className="py-2">
                    <span className="text-muted-foreground block mb-2">Traits</span>
                    <div className="flex flex-wrap gap-2">
                      {traits.map((trait, index) => (
                        <Badge key={index} variant="outline">
                          {trait.trait_type}: {trait.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1">
                  Back to Edit
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isLoading} className="coral-button flex-1">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Confirm & Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Create Collection</h1>
          <p className="text-muted-foreground text-lg">
            Launch your own NFT collection with customizable properties and traits
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Badge variant="outline">
              Collections: {collectionCount} / {maxCollections}
            </Badge>
            {factoryPaused && <Badge variant="destructive">Factory Paused</Badge>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Information */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">1</div>
              <h2 className="form-step-header">Basic Information</h2>
            </div>
            <div className="step-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter collection name"
                    maxLength={64}
                    required
                    className="form-input"
                  />
                  <p className="text-xs text-muted-foreground">{formData.name.length}/64 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange("symbol", e.target.value.toUpperCase())}
                    placeholder="e.g., MYART"
                    maxLength={32}
                    minLength={3}
                    required
                    className="form-input"
                  />
                  <p className="text-xs text-muted-foreground">3-32 characters, ERC-721 compatible</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your collection's story, purpose, and what makes it unique. Markdown formatting is supported for rich text."
                  rows={4}
                  className="form-input"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Include your collection's theme, rarity distribution, and utility
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="form-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="launchDate">Launch Date (Optional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="launchDate"
                      type="date"
                      value={formData.launchDate}
                      onChange={(e) => handleInputChange("launchDate", e.target.value)}
                      className="form-input pl-10"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Schedule your collection's public release</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Upload Images */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">2</div>
              <h2 className="form-step-header">Upload Images</h2>
            </div>
            <div className="step-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label>Cover Image *</Label>
                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={coverPreview || "/placeholder.svg"}
                        alt="Cover preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCoverImage(null)
                          setCoverPreview("")
                        }}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="upload-area">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label htmlFor="cover-upload" className="cursor-pointer block">
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-navy" />
                          <p className="font-medium">Upload Cover Image</p>
                          <p className="text-xs text-muted-foreground">1200x400px (3:1 ratio), JPG/PNG, max 1MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo/Avatar *</Label>
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border mx-auto"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setLogo(null)
                          setLogoPreview("")
                        }}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="upload-area">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo")}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer block">
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-navy" />
                          <p className="font-medium">Upload Logo</p>
                          <p className="text-xs text-muted-foreground">240-300x240-300px (square), JPG/PNG, max 1MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Collection Settings */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">3</div>
              <h2 className="form-step-header">Collection Settings</h2>
            </div>
            <div className="step-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="royalties">Royalty Fee: {formData.royalties}%</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Royalties are paid to you on every secondary sale of your NFTs</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider
                  value={[formData.royalties]}
                  onValueChange={(value) => handleInputChange("royalties", value[0])}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {suggestedRoyalties.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.royalties === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("royalties", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="totalSupply">Total Supply</Label>
                  <div className="space-y-3">
                    <Input
                      id="totalSupply"
                      type="number"
                      min="1"
                      value={formData.totalSupply}
                      onChange={(e) => handleInputChange("totalSupply", e.target.value)}
                      placeholder="Enter number of NFTs"
                      disabled={formData.isUnlimited}
                      className="form-input"
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="unlimited"
                        checked={formData.isUnlimited}
                        onCheckedChange={(checked) => handleInputChange("isUnlimited", checked)}
                      />
                      <Label htmlFor="unlimited" className="text-sm">
                        Unlimited supply
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Label>Minting Type</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Lazy Minting (Recommended)</p>
                        <p className="text-sm">
                          NFTs are only minted when purchased, saving you upfront gas fees. The buyer pays the minting
                          cost.
                        </p>
                        <p className="font-medium mt-2 mb-1">Pre-minting</p>
                        <p className="text-sm">
                          All NFTs are minted immediately. You pay all gas fees upfront, but NFTs are available
                          instantly.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.mintingType === "lazy"
                        ? "border-coral bg-coral/5"
                        : "border-navy/30 hover:border-navy/50"
                    }`}
                    onClick={() => handleInputChange("mintingType", "lazy")}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="mintingType"
                        value="lazy"
                        checked={formData.mintingType === "lazy"}
                        onChange={() => handleInputChange("mintingType", "lazy")}
                        className="text-coral"
                      />
                      <div>
                        <h4 className="font-medium">Lazy Minting</h4>
                        <p className="text-sm text-muted-foreground">NFTs minted when purchased (gas-efficient)</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.mintingType === "pre" ? "border-coral bg-coral/5" : "border-navy/30 hover:border-navy/50"
                    }`}
                    onClick={() => handleInputChange("mintingType", "pre")}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="mintingType"
                        value="pre"
                        checked={formData.mintingType === "pre"}
                        onChange={() => handleInputChange("mintingType", "pre")}
                        className="text-coral"
                      />
                      <div>
                        <h4 className="font-medium">Pre-minting</h4>
                        <p className="text-sm text-muted-foreground">
                          All NFTs minted upfront (immediate availability)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Social Media & Links (Optional) */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">4</div>
              <h2 className="form-step-header">Social Media & Links (Optional)</h2>
            </div>
            <div className="step-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange("twitter", e.target.value)}
                      placeholder="@username"
                      className="form-input pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord">Discord</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="discord"
                      value={formData.discord}
                      onChange={(e) => handleInputChange("discord", e.target.value)}
                      placeholder="discord.gg/invite"
                      className="form-input pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://example.com"
                      className="form-input pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Traits & Properties */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">5</div>
              <h2 className="form-step-header">Traits & Properties (Optional)</h2>
            </div>
            <div className="step-content">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add traits to categorize your NFTs. Example: Color: Blue, Rarity: Legendary
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trait-type">Trait Type</Label>
                    <Input
                      id="trait-type"
                      value={newTrait.trait_type}
                      onChange={(e) => setNewTrait((prev) => ({ ...prev, trait_type: e.target.value }))}
                      placeholder="e.g., Color, Rarity"
                      className="form-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trait-value">Value</Label>
                    <Input
                      id="trait-value"
                      value={newTrait.value}
                      onChange={(e) => setNewTrait((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="e.g., Blue, Epic"
                      className="form-input"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addTrait}
                      disabled={!newTrait.trait_type || !newTrait.value}
                      className="coral-button w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Trait
                    </Button>
                  </div>
                </div>

                {traits.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Traits</Label>
                    <div className="space-y-2">
                      {traits.map((trait, index) => (
                        <div key={index} className="trait-item">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{trait.trait_type}</Badge>
                            <span className="text-sm">{trait.value}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTrait(index)}
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
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.symbol || !formData.category || !coverImage || !logo}
              className="coral-button px-12 py-4 text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Review & Create Collection
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
