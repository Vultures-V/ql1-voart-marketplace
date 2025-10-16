"use client"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Eye,
  Ban,
  Flag,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Star,
  EyeOff,
  InfoIcon, // Added InfoIcon
} from "@/components/simple-icons"
import { WalletProtectionGuard } from "@/components/wallet-protection-guard"
import { useWallet } from "@/hooks/use-wallet"
import { AdminDebugPanel } from "@/components/admin-debug-panel"
import { getCommissionRates, getPlatformFeeConfig } from "@/lib/commission-system"
import { isAdminWallet } from "@/lib/admin-utils"
import { verificationSystem, type VerificationRequest } from "@/lib/verification-system"
import { UserManagementSystem, type UserProfile } from "@/lib/user-management"
import { NFTAdminManagement } from "@/lib/nft-admin-management"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { storageWhitelist, type WhitelistEntry } from "@/lib/storage-whitelist"
import { ReportsSystem, type ContentReport } from "@/lib/reports-system"
import { FeaturedCollectionsSystem, type FeaturedCollection } from "@/lib/featured-collections-system"
import { MarketplaceWhitelistSystem, type MarketplaceWhitelistEntry } from "@/lib/marketplace-whitelist"

function getRealStats() {
  if (typeof window === "undefined")
    return {
      totalUsers: 0,
      totalNFTs: 0,
      totalVolume: "0",
      pendingReports: 0,
      activeAuctions: 0,
      newUsersToday: 0,
    }

  const users = JSON.parse(localStorage.getItem("voart_users") || "[]")
  const nfts = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
  const collections = JSON.parse(localStorage.getItem("voart_collections") || "[]")

  const totalVolume = nfts.reduce((sum: number, nft: any) => {
    // Only count NFTs that have been sold
    if (nft.status === "sold") {
      // Use actual sale price if available, otherwise use purchase price or listing price
      const salePrice = nft.salePrice || nft.purchasePrice || Number.parseFloat(nft.price) || 0
      return sum + salePrice
    }
    return sum
  }, 0)

  return {
    totalUsers: users.length,
    totalNFTs: nfts.length,
    totalVolume: totalVolume.toFixed(2),
    pendingReports: 0, // No reports system implemented yet
    activeAuctions: nfts.filter((nft: any) => nft.isForSale || nft.status === "listed").length,
    newUsersToday: 0, // Would need timestamp tracking
  }
}

function getRealRecentActivity() {
  if (typeof window === "undefined") return []

  const nfts = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
  const collections = JSON.parse(localStorage.getItem("voart_collections") || "[]")

  const activities = []

  // Add recent NFTs (last 10)
  const recentNFTs = nfts.slice(-10).reverse()
  recentNFTs.forEach((nft: any, index: number) => {
    activities.push({
      id: `nft-${nft.id}`,
      type: "mint",
      user: nft.creator || "Unknown Creator",
      item: nft.name || `NFT #${nft.id}`,
      time: `${index + 1} ${index === 0 ? "minute" : "minutes"} ago`,
    })
  })

  // Add recent collections (last 5)
  const recentCollections = collections.slice(-5).reverse()
  recentCollections.forEach((collection: any, index: number) => {
    activities.push({
      id: `collection-${collection.id}`,
      type: "collection",
      user: collection.creator || "Unknown Creator",
      item: collection.name || `Collection #${collection.id}`,
      time: `${(index + 1) * 5} minutes ago`,
    })
  })

  return activities.slice(0, 10) // Return only first 10 activities
}

function AdminDashboardContent() {
  const [selectedReportState, setSelectedReportState] = useState<string | null>(null) // Renamed from selectedReport to avoid redeclaration
  const [stats, setStats] = useState(getRealStats())
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [verificationStats, setVerificationStats] = useState(verificationSystem.getStatistics())

  const [users, setUsers] = useState<UserProfile[]>([])
  const [userStats, setUserStats] = useState(UserManagementSystem.getUserStats())
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState<string>("")
  const [fixDialogOpen, setFixDialogOpen] = useState(false)
  const [fixType, setFixType] = useState<string>("")

  const [nfts, setNfts] = useState<any[]>([])
  const [nftStats, setNftStats] = useState(NFTAdminManagement.getNFTStats())
  const [nftSearchQuery, setNftSearchQuery] = useState("")
  const [nftFilter, setNftFilter] = useState("all")
  const [selectedNFT, setSelectedNFT] = useState<any | null>(null)
  const [nftActionDialogOpen, setNftActionDialogOpen] = useState(false)
  const [nftActionType, setNftActionType] = useState<string>("")
  const [nftActionReason, setNftActionReason] = useState("")

  const [deleteNFTDialogOpen, setDeleteNFTDialogOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")

  const [clearNFTsDialogOpen, setClearNFTsDialogOpen] = useState(false)

  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([])
  const [storageStats, setStorageStats] = useState(storageWhitelist.getTotalStats())
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const [bulkAddresses, setBulkAddresses] = useState("")

  const [activeTab, setActiveTab] = useState("overview")
  const [reports, setReports] = useState<ContentReport[]>([])
  const [reportStats, setReportStats] = useState(ReportsSystem.getStatistics())
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null) // Renamed from selectedReport to avoid redeclaration
  const [reportResolution, setReportResolution] = useState("")
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  const [featuredCollections, setFeaturedCollections] = useState<FeaturedCollection[]>([])
  const [allCollections, setAllCollections] = useState<any[]>([])
  const [selectedCollectionToFeature, setSelectedCollectionToFeature] = useState("")
  const [featurePriority, setFeaturePriority] = useState("5")
  const [featureExpiry, setFeatureExpiry] = useState("")

  const [marketplaceWhitelist, setMarketplaceWhitelist] = useState<MarketplaceWhitelistEntry[]>([])
  const [marketplaceWhitelistEnabled, setMarketplaceWhitelistEnabled] = useState(false)
  const [marketplaceWhitelistStats, setMarketplaceWhitelistStats] = useState(MarketplaceWhitelistSystem.getStats())
  const [newMarketplaceAddress, setNewMarketplaceAddress] = useState("")
  const [bulkMarketplaceAddresses, setBulkMarketplaceAddresses] = useState("")

  // NFTFactory management state
  const [factoryPaused, setFactoryPaused] = useState(false)
  const [disabledCollections, setDisabledCollections] = useState<string[]>([])
  const [collectionToDisable, setCollectionToDisable] = useState("")

  const [lazyMintFee, setLazyMintFee] = useState("0.001")
  const [collectionCreationFee, setCollectionCreationFee] = useState("0.1")

  const { address } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    setStats(getRealStats())
    setRecentActivity(getRealRecentActivity())
    loadVerificationData()
    loadUserData()
    loadNFTData()
    loadStorageData() // Load storage whitelist data
    loadMarketplaceWhitelistData()
    loadReportsData()
    loadFeaturedCollectionsData()
    loadCollectionsData()
    // TODO: Fetch initial factory state when deployed
    loadTransactionSettings()
  }, [])

  const loadVerificationData = () => {
    setVerificationRequests(verificationSystem.getAllRequests())
    setVerificationStats(verificationSystem.getStatistics())
  }

  const handleApproveVerification = (requestId: string) => {
    if (!address) return

    const result = verificationSystem.approveRequest(requestId, address)
    toast({
      title: result.success ? "Verification Approved" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadVerificationData()
    }
  }

  const handleRejectVerification = (requestId: string) => {
    if (!address) return

    const result = verificationSystem.rejectRequest(requestId, address)
    toast({
      title: result.success ? "Verification Rejected" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadVerificationData()
    }
  }

  const handleRevokeVerification = (type: "user" | "collection", targetId: string) => {
    const result = verificationSystem.revokeVerification(type, targetId)
    toast({
      title: result.success ? "Verification Revoked" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadVerificationData()
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "mint":
        return <Zap className="w-4 h-4 text-green-500" />
      case "sale":
        return <DollarSign className="w-4 h-4 text-blue-500" />
      case "report":
        return <Flag className="w-4 h-4 text-red-500" />
      case "collection":
        return <ShoppingBag className="w-4 h-4 text-purple-500" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const loadUserData = () => {
    setUsers(UserManagementSystem.getAllUsers())
    setUserStats(UserManagementSystem.getUserStats())
  }

  const loadNFTData = () => {
    if (typeof window === "undefined") return
    const allNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
    setNfts(allNFTs)
    setNftStats(NFTAdminManagement.getNFTStats())
  }

  // Storage whitelist management functions
  const loadStorageData = () => {
    setWhitelistEntries(storageWhitelist.getWhitelist())
    setStorageStats(storageWhitelist.getTotalStats())
  }

  const loadMarketplaceWhitelistData = () => {
    setMarketplaceWhitelist(MarketplaceWhitelistSystem.getWhitelist())
    setMarketplaceWhitelistEnabled(MarketplaceWhitelistSystem.isWhitelistEnabled())
    setMarketplaceWhitelistStats(MarketplaceWhitelistSystem.getStats())
  }

  const handleToggleMarketplaceWhitelist = (enabled: boolean) => {
    if (!address) return

    const result = MarketplaceWhitelistSystem.setWhitelistEnabled(enabled, address)

    toast({
      title: result.success ? "Whitelist Updated" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadMarketplaceWhitelistData()
    }
  }

  const handleAddToMarketplaceWhitelist = () => {
    if (!newMarketplaceAddress || !address) return

    const result = MarketplaceWhitelistSystem.addToWhitelist(newMarketplaceAddress, address)

    toast({
      title: result.success ? "Address Added" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadMarketplaceWhitelistData()
      setNewMarketplaceAddress("")
    }
  }

  const handleRemoveFromMarketplaceWhitelist = (walletAddress: string) => {
    const result = MarketplaceWhitelistSystem.removeFromWhitelist(walletAddress)

    toast({
      title: result.success ? "Address Removed" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadMarketplaceWhitelistData()
    }
  }

  const handleBulkImportMarketplace = () => {
    if (!bulkMarketplaceAddresses || !address) return

    const addresses = bulkMarketplaceAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0)

    const result = MarketplaceWhitelistSystem.bulkImport(addresses, address)

    toast({
      title: "Bulk Import Complete",
      description: result.message,
    })

    loadMarketplaceWhitelistData()
    setBulkMarketplaceAddresses("")
  }

  const handleExportMarketplaceWhitelist = () => {
    const addresses = marketplaceWhitelist.map((entry) => entry.address).join("\n")
    const blob = new Blob([addresses], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "marketplace-whitelist.txt"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Whitelist Exported",
      description: `Exported ${marketplaceWhitelist.length} wallet addresses`,
    })
  }

  const loadReportsData = () => {
    setReports(ReportsSystem.getAllReports())
    setReportStats(ReportsSystem.getStatistics())
  }

  const loadFeaturedCollectionsData = () => {
    setFeaturedCollections(FeaturedCollectionsSystem.getFeaturedCollections())
  }

  const loadCollectionsData = () => {
    if (typeof window === "undefined") return
    const collections = JSON.parse(localStorage.getItem("voart_collections") || "[]")
    setAllCollections(collections)
  }

  const handleAddToWhitelist = () => {
    if (!newWalletAddress || !address) return

    const result = storageWhitelist.addToWhitelist(newWalletAddress, address)

    toast({
      title: result.success ? "Wallet Added" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadStorageData()
      setNewWalletAddress("")
    }
  }

  const handleRemoveFromWhitelist = (walletAddress: string) => {
    const result = storageWhitelist.removeFromWhitelist(walletAddress)

    toast({
      title: result.success ? "Wallet Removed" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadStorageData()
    }
  }

  const handleBulkImport = () => {
    if (!bulkAddresses || !address) return

    const addresses = bulkAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0)

    const result = storageWhitelist.bulkImport(addresses, address)

    toast({
      title: "Bulk Import Complete",
      description: result.message,
    })

    loadStorageData()
    setBulkAddresses("")
  }

  const handleExportWhitelist = () => {
    const addresses = whitelistEntries.map((entry) => entry.address).join("\n")
    const blob = new Blob([addresses], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "storage-whitelist.txt"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Whitelist Exported",
      description: `Exported ${whitelistEntries.length} wallet addresses`,
    })
  }

  const handleBanUser = () => {
    if (!selectedUser || !address) return

    const duration = banDuration ? Number.parseInt(banDuration) : undefined
    const result = UserManagementSystem.banUser(selectedUser.address, banReason, address, duration)

    toast({
      title: result.success ? "User Banned" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadUserData()
      setBanDialogOpen(false)
      setSelectedUser(null)
      setBanReason("")
      setBanDuration("")
    }
  }

  const handleUnbanUser = (userAddress: string) => {
    if (!address) return

    console.log("[v0] Attempting to unban user:", userAddress)
    console.log("[v0] Admin address:", address)

    const result = UserManagementSystem.unbanUser(userAddress, address)

    console.log("[v0] Unban result:", result)

    toast({
      title: result.success ? "Ban Lifted" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadUserData()
    }
  }

  const handleFixUser = () => {
    if (!selectedUser || !address || !fixType) return

    const result = UserManagementSystem.fixUserIssues(selectedUser.address, address, fixType)

    toast({
      title: result.success ? "User Fixed" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadUserData()
      setFixDialogOpen(false)
      setSelectedUser(null)
      setFixType("")
    }
  }

  const handleNFTAction = () => {
    if (!selectedNFT || !address || !nftActionType) return

    let result: { success: boolean; message: string }

    switch (nftActionType) {
      case "hide":
        result = NFTAdminManagement.hideNFT(selectedNFT.id, address, nftActionReason)
        break
      case "unhide":
        result = NFTAdminManagement.unhideNFT(selectedNFT.id, address)
        break
      case "feature":
        result = NFTAdminManagement.featureNFT(selectedNFT.id, address)
        break
      case "unfeature":
        result = NFTAdminManagement.unfeatureNFT(selectedNFT.id, address)
        break
      case "flag":
        result = NFTAdminManagement.flagNFT(selectedNFT.id, address, nftActionReason)
        break
      default:
        result = { success: false, message: "Unknown action" }
    }

    toast({
      title: result.success ? "Action Completed" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadNFTData()
      setNftActionDialogOpen(false)
      setSelectedNFT(null)
      setNftActionType("")
      setNftActionReason("")
    }
  }

  const handleDeleteNFT = () => {
    if (!selectedNFT || !address) return

    const result = NFTAdminManagement.deleteNFT(selectedNFT.id, address, deleteReason)

    toast({
      title: result.success ? "NFT Deleted" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      setStats(getRealStats())
      loadNFTData()
      setDeleteNFTDialogOpen(false)
      setSelectedNFT(null)
      setDeleteReason("")
    }
  }

  const handleClearAllNFTs = () => {
    try {
      localStorage.removeItem("marketplace-nfts")

      // Clear all user-specific NFT storage
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("user-nfts-") ||
          key.startsWith("user-owned-") ||
          key.startsWith("user-delisted-") ||
          key.startsWith("user-hidden-") ||
          key.startsWith("user-burned-") ||
          key.startsWith("user-transfers-")
        ) {
          localStorage.removeItem(key)
        }
      })

      // Trigger storage event to update UI
      window.dispatchEvent(new Event("storage"))

      toast({
        title: "All NFTs Cleared",
        description: "All NFTs have been removed from the marketplace and user storage.",
      })

      // Reload data
      setStats(getRealStats())
      loadNFTData()
      setClearNFTsDialogOpen(false)
    } catch (error) {
      console.error("Error clearing NFTs:", error)
      toast({
        title: "Error",
        description: "Failed to clear NFTs. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add new handler functions for reports and featured collections
  const handleReviewReport = (status: "resolved" | "dismissed") => {
    if (!selectedReport || !address) return

    const result = ReportsSystem.reviewReport(selectedReport.id, address, status, reportResolution)

    toast({
      title: result.success ? "Report Reviewed" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadReportsData()
      setReportDialogOpen(false)
      setSelectedReport(null)
      setReportResolution("")
    }
  }

  const handleFeatureCollection = () => {
    if (!selectedCollectionToFeature || !address) return

    const collection = allCollections.find((c) => c.id === selectedCollectionToFeature)
    if (!collection) return

    const result = FeaturedCollectionsSystem.featureCollection(
      collection.id,
      collection.name,
      address,
      Number.parseInt(featurePriority),
      featureExpiry || undefined,
    )

    toast({
      title: result.success ? "Collection Featured" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadFeaturedCollectionsData()
      setSelectedCollectionToFeature("")
      setFeaturePriority("5")
      setFeatureExpiry("")
    }
  }

  const handleUnfeatureCollection = (collectionId: string) => {
    const result = FeaturedCollectionsSystem.unfeatureCollection(collectionId)

    toast({
      title: result.success ? "Collection Unfeatured" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })

    if (result.success) {
      loadFeaturedCollectionsData()
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      userFilter === "all" ||
      (userFilter === "verified" && user.isVerified) ||
      (userFilter === "banned" && user.isBanned) ||
      (userFilter === "active" && !user.isBanned)

    return matchesSearch && matchesFilter
  })

  const filteredNFTs = nfts.filter((nft) => {
    const matchesSearch =
      nft.name?.toLowerCase().includes(nftSearchQuery.toLowerCase()) || nft.id.toString().includes(nftSearchQuery)

    const matchesFilter =
      nftFilter === "all" ||
      (nftFilter === "featured" && NFTAdminManagement.getFeaturedNFTs().some((f) => f.nftId === nft.id)) ||
      (nftFilter === "hidden" && NFTAdminManagement.isNFTHidden(nft.id)) ||
      (nftFilter === "flagged" && NFTAdminManagement.getFlaggedNFTs().some((f) => f.nftId === nft.id))

    return matchesSearch && matchesFilter
  })

  // NFTFactory management functions
  const handlePauseFactory = async () => {
    if (!address) return

    toast({
      title: factoryPaused ? "Unpausing Factory" : "Pausing Factory",
      description: "Transaction in progress...",
    })

    // TODO: Implement actual contract call when deployed
    setFactoryPaused(!factoryPaused)

    toast({
      title: "Success",
      description: factoryPaused ? "Factory unpaused successfully" : "Factory paused successfully",
    })
  }

  const handleDisableCollection = async () => {
    if (!address || !collectionToDisable) return

    toast({
      title: "Disabling Collection",
      description: "Transaction in progress...",
    })

    // TODO: Implement actual contract call when deployed
    setDisabledCollections([...disabledCollections, collectionToDisable])
    setCollectionToDisable("")

    toast({
      title: "Success",
      description: "Collection disabled successfully",
    })
  }

  const handleEnableCollection = async (collectionAddress: string) => {
    if (!address) return

    toast({
      title: "Enabling Collection",
      description: "Transaction in progress...",
    })

    // TODO: Implement actual contract call when deployed
    setDisabledCollections(disabledCollections.filter((c) => c !== collectionAddress))

    toast({
      title: "Success",
      description: "Collection enabled successfully",
    })
  }

  const loadTransactionSettings = () => {
    const savedLazyMintFee = localStorage.getItem("admin_lazy_mint_fee")
    const savedCollectionFee = localStorage.getItem("admin_collection_creation_fee")

    if (savedLazyMintFee) setLazyMintFee(savedLazyMintFee)
    if (savedCollectionFee) setCollectionCreationFee(savedCollectionFee)
  }

  const handleUpdateTransactionSettings = () => {
    try {
      // Validate inputs
      const lazyMintValue = Number.parseFloat(lazyMintFee)
      const collectionValue = Number.parseFloat(collectionCreationFee)

      if (isNaN(lazyMintValue) || lazyMintValue < 0) {
        toast({
          title: "Invalid Input",
          description: "Lazy Mint Fee must be a valid positive number",
          variant: "destructive",
        })
        return
      }

      if (isNaN(collectionValue) || collectionValue < 0) {
        toast({
          title: "Invalid Input",
          description: "Collection Creation Fee must be a valid positive number",
          variant: "destructive",
        })
        return
      }

      // Save to localStorage
      localStorage.setItem("admin_lazy_mint_fee", lazyMintFee)
      localStorage.setItem("admin_collection_creation_fee", collectionCreationFee)

      toast({
        title: "Settings Updated",
        description: `Lazy Mint Fee: ${lazyMintFee} QOM, Collection Creation Fee: ${collectionCreationFee} QOM`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction settings",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Admin Panel</span>
              </div>

              {/* Quick Stats Indicators */}
              <div className="hidden md:flex items-center gap-4">
                {verificationStats.pendingRequests > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">
                      {verificationStats.pendingRequests} Pending
                    </span>
                  </div>
                )}

                {userStats.bannedUsers > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                    <Ban className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">{userStats.bannedUsers} Banned</span>
                  </div>
                )}

                {nftStats.flaggedNFTs > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <Flag className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-500">{nftStats.flaggedNFTs} Flagged</span>
                  </div>
                )}

                {verificationStats.pendingRequests === 0 &&
                  userStats.bannedUsers === 0 &&
                  nftStats.flaggedNFTs === 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">All Clear</span>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Total Volume</p>
                <p className="text-sm font-bold text-foreground">{stats.totalVolume} QOM</p>
              </div>
              <Badge className="bg-primary/10 text-primary px-3 py-1">Administrator</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Overview</h1>
            <p className="text-muted-foreground">Monitor and manage your voart NFT marketplace</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="origami-card border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{userStats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-500 mt-1 font-medium">+{userStats.newUsersToday} today</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="origami-card border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total NFTs</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalNFTs.toLocaleString()}</p>
                  <p className="text-xs text-blue-500 mt-1 font-medium">{stats.activeAuctions} for sale</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="origami-card border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Volume</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalVolume} QOM</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">All time</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`origami-card border-2 transition-colors ${
              verificationStats.pendingRequests > 0 ? "border-yellow-500/50 bg-yellow-500/5" : "hover:border-primary/50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Verifications</p>
                  <p
                    className={`text-3xl font-bold mt-1 ${
                      verificationStats.pendingRequests > 0 ? "text-yellow-500" : "text-foreground"
                    }`}
                  >
                    {verificationStats.pendingRequests}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {verificationStats.totalRequests} total
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    verificationStats.pendingRequests > 0 ? "bg-yellow-500/20" : "bg-green-500/10"
                  }`}
                >
                  {verificationStats.pendingRequests > 0 ? (
                    <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {(verificationStats.pendingRequests > 0 || userStats.bannedUsers > 0 || nftStats.flaggedNFTs > 0) && (
          <Card className="origami-card border-2 border-yellow-500/30 bg-yellow-500/5 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <Flag className="w-5 h-5" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {verificationStats.pendingRequests > 0 && (
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{verificationStats.pendingRequests} Pending</p>
                        <p className="text-sm text-muted-foreground">Verification requests</p>
                      </div>
                    </div>
                  </div>
                )}

                {userStats.bannedUsers > 0 && (
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                        <Ban className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{userStats.bannedUsers} Banned</p>
                        <p className="text-sm text-muted-foreground">Users restricted</p>
                      </div>
                    </div>
                  </div>
                )}

                {nftStats.flaggedNFTs > 0 && (
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <Flag className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{nftStats.flaggedNFTs} Flagged</p>
                        <p className="text-sm text-muted-foreground">NFTs need review</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="marketplace-access">Marketplace</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="factory">Factory</TabsTrigger> {/* Added Factory Tab */}
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            {/* Verification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Requests</p>
                      <p className="text-2xl font-bold text-yellow-500">{verificationStats.pendingRequests}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Verified Users</p>
                      <p className="text-2xl font-bold text-green-500">{verificationStats.verifiedUsers}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Verified Collections</p>
                      <p className="text-2xl font-bold text-blue-500">{verificationStats.verifiedCollections}</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Verification Requests */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Verification Requests</span>
                  <Badge className="bg-yellow-500/10 text-yellow-500">
                    {verificationStats.pendingRequests} Pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificationRequests.length > 0 ? (
                  <div className="space-y-4">
                    {verificationRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-start justify-between p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            {request.type === "user" ? (
                              <Users className="w-5 h-5 text-primary" />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-primary" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{request.targetName}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.type === "user" ? "User Verification" : "Collection Verification"}
                              </p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="pl-8 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Requested by:</span> {request.requesterName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Reason:</span> {request.reason}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()} at{" "}
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex gap-2 ml-4">
                            <OrigamiButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveVerification(request.id)}
                              className="text-green-500 hover:text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </OrigamiButton>
                            <OrigamiButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectVerification(request.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </OrigamiButton>
                          </div>
                        )}

                        {request.status === "approved" && (
                          <OrigamiButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeVerification(request.type, request.targetId)}
                            className="text-red-500 hover:text-red-600 ml-4"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Revoke
                          </OrigamiButton>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No verification requests yet</p>
                    <p className="text-sm text-muted-foreground">
                      Verification requests will appear here when users or creators request verification
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="origami-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{activity.item}</p>
                            <p className="text-xs text-muted-foreground">by {activity.user}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground">
                        Activity will appear here as users interact with the marketplace
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="origami-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <OrigamiButton
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("reports")}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Review Pending Reports ({reportStats.pending})
                  </OrigamiButton>
                  <OrigamiButton
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage User Permissions
                  </OrigamiButton>
                  <OrigamiButton
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("featured")}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Featured Collections
                  </OrigamiButton>
                  <OrigamiButton
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("analytics")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics Dashboard
                  </OrigamiButton>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">{userStats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Verified Users</p>
                      <p className="text-2xl font-bold text-green-500">{userStats.verifiedUsers}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Banned Users</p>
                      <p className="text-2xl font-bold text-red-500">{userStats.bannedUsers}</p>
                    </div>
                    <Ban className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold text-blue-500">{userStats.activeUsers}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Input
                    placeholder="Search users by address or username..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.address}
                        className="flex items-start justify-between p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">{user.username}</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {user.address.slice(0, 10)}...{user.address.slice(-8)}
                              </p>
                            </div>
                            {user.isVerified && <Badge className="bg-blue-500/10 text-blue-500">Verified</Badge>}
                            {user.isBanned && <Badge className="bg-red-500/10 text-red-500">Banned</Badge>}
                          </div>

                          <div className="pl-8 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">NFTs Created:</span>
                              <span className="ml-2 font-medium">{user.nftsCreated}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Volume:</span>
                              <span className="ml-2 font-medium">{user.totalVolume.toFixed(2)} QOM</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Joined:</span>
                              <span className="ml-2 font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {user.isBanned && user.banReason && (
                            <div className="pl-8 text-sm">
                              <span className="text-red-500 font-medium">Ban Reason:</span>
                              <span className="ml-2 text-muted-foreground">{user.banReason}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          {!user.isBanned ? (
                            <>
                              <OrigamiButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setBanDialogOpen(true)
                                }}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Ban
                              </OrigamiButton>
                              <OrigamiButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setFixDialogOpen(true)
                                }}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                Fix
                              </OrigamiButton>
                            </>
                          ) : (
                            <OrigamiButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbanUser(user.address)}
                              className="text-green-500 hover:text-green-600"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Lift Ban
                            </OrigamiButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-6">
            {/* NFT Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Featured NFTs</p>
                      <p className="text-2xl font-bold text-yellow-500">{nftStats.featuredNFTs}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Hidden NFTs</p>
                      <p className="text-2xl font-bold text-gray-500">{nftStats.hiddenNFTs}</p>
                    </div>
                    <EyeOff className="w-8 h-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Flagged NFTs</p>
                      <p className="text-2xl font-bold text-red-500">{nftStats.flaggedNFTs}</p>
                    </div>
                    <Flag className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>NFT Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Input
                    placeholder="Search NFTs by name or ID..."
                    className="flex-1"
                    value={nftSearchQuery}
                    onChange={(e) => setNftSearchQuery(e.target.value)}
                  />
                  <Select value={nftFilter} onValueChange={setNftFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All NFTs</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredNFTs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredNFTs.map((nft) => {
                      const isHidden = NFTAdminManagement.isNFTHidden(nft.id)
                      const isFeatured = NFTAdminManagement.getFeaturedNFTs().some((f) => f.nftId === nft.id)
                      const isFlagged = NFTAdminManagement.getFlaggedNFTs().some((f) => f.nftId === nft.id)

                      return (
                        <div
                          key={nft.id}
                          className="flex items-start justify-between p-4 bg-muted/20 rounded-lg border border-border"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <ShoppingBag className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-medium text-foreground">{nft.name || `NFT #${nft.id}`}</p>
                                <p className="text-sm text-muted-foreground">ID: {nft.id}</p>
                              </div>
                              {isFeatured && <Badge className="bg-yellow-500/10 text-yellow-500">Featured</Badge>}
                              {isHidden && <Badge className="bg-gray-500/10 text-gray-500">Hidden</Badge>}
                              {isFlagged && <Badge className="bg-red-500/10 text-red-500">Flagged</Badge>}
                            </div>

                            <div className="pl-8 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Creator:</span>
                                <span className="ml-2 font-medium font-mono">
                                  {nft.creator?.slice(0, 6)}...{nft.creator?.slice(-4)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price:</span>
                                <span className="ml-2 font-medium">{nft.price} QOM</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <span className="ml-2 font-medium">{nft.status || "Active"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4 flex-wrap">
                            {!isFeatured && (
                              <OrigamiButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNFT(nft)
                                  setNftActionType("feature")
                                  setNftActionDialogOpen(true)
                                }}
                                className="text-yellow-500 hover:text-yellow-600"
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Feature
                              </OrigamiButton>
                            )}
                            {isFeatured && (
                              <OrigamiButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNFT(nft)
                                  setNftActionType("unfeature")
                                  setNftActionDialogOpen(true)
                                }}
                                className="text-gray-500 hover:text-gray-600"
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Unfeature
                              </OrigamiButton>
                            )}
                            {!isHidden ? (
                              <OrigamiButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNFT(nft)
                                  setNftActionType("hide")
                                  setNftActionDialogOpen(true)
                                }}
                                className="text-gray-500 hover:text-gray-600"
                              >
                                <EyeOff className="w-4 h-4 mr-1" />
                                Hide
                              </OrigamiButton>
                            ) : (
                              <OrigamiButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNFT(nft)
                                  setNftActionType("unhide")
                                  setNftActionDialogOpen(true)
                                }}
                                className="text-green-500 hover:text-green-600"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Unhide
                              </OrigamiButton>
                            )}
                            <OrigamiButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNFT(nft)
                                setNftActionType("flag")
                                setNftActionDialogOpen(true)
                              }}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Flag className="w-4 h-4 mr-1" />
                              Flag
                            </OrigamiButton>
                            <OrigamiButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNFT(nft)
                                setDeleteNFTDialogOpen(true)
                              }}
                              className="text-red-500 hover:text-red-600 border-red-500/20"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Delete
                            </OrigamiButton>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No NFTs found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Reports</p>
                      <p className="text-2xl font-bold text-yellow-500">{reportStats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold text-green-500">{reportStats.resolved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dismissed</p>
                      <p className="text-2xl font-bold text-gray-500">{reportStats.dismissed}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reports</p>
                      <p className="text-2xl font-bold text-foreground">{reportStats.total}</p>
                    </div>
                    <Flag className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Content Reports</span>
                  <Badge className="bg-yellow-500/10 text-yellow-500">{reportStats.pending} Pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-start justify-between p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Flag className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="font-medium text-foreground">{report.targetName}</p>
                              <p className="text-sm text-muted-foreground">
                                {report.type} • {report.category}
                              </p>
                            </div>
                            {report.status === "pending" && (
                              <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
                            )}
                            {report.status === "resolved" && (
                              <Badge className="bg-green-500/10 text-green-500">Resolved</Badge>
                            )}
                            {report.status === "dismissed" && (
                              <Badge className="bg-gray-500/10 text-gray-500">Dismissed</Badge>
                            )}
                          </div>

                          <div className="pl-8 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Reported by:</span> {report.reporterName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Reason:</span> {report.reason}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Description:</span> {report.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.createdAt).toLocaleDateString()} at{" "}
                              {new Date(report.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {report.status === "pending" && (
                          <div className="flex gap-2 ml-4">
                            <OrigamiButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report)
                                setReportDialogOpen(true)
                              }}
                              className="text-primary hover:text-primary"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </OrigamiButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports submitted</p>
                    <p className="text-sm text-muted-foreground">
                      Content reports will appear here when users flag inappropriate content
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Feature a Collection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="collection-select">Select Collection</Label>
                  <Select value={selectedCollectionToFeature} onValueChange={setSelectedCollectionToFeature}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a collection to feature" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCollections
                        .filter((c) => !FeaturedCollectionsSystem.isCollectionFeatured(c.id))
                        .map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority (1-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="10"
                      value={featurePriority}
                      onChange={(e) => setFeaturePriority(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={featureExpiry}
                      onChange={(e) => setFeatureExpiry(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <OrigamiButton onClick={handleFeatureCollection} disabled={!selectedCollectionToFeature}>
                  <Star className="w-4 h-4 mr-2" />
                  Feature Collection
                </OrigamiButton>
              </CardContent>
            </Card>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Featured Collections</span>
                  <Badge className="bg-primary/10 text-primary">{featuredCollections.length} Featured</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {featuredCollections.length > 0 ? (
                  <div className="space-y-4">
                    {featuredCollections.map((featured) => (
                      <div
                        key={featured.collectionId}
                        className="flex items-start justify-between p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <div>
                              <p className="font-medium text-foreground">{featured.collectionName}</p>
                              <p className="text-sm text-muted-foreground">Priority: {featured.priority}</p>
                            </div>
                          </div>

                          <div className="pl-8 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Featured:</span>
                              <span className="ml-2 font-medium">
                                {new Date(featured.featuredAt).toLocaleDateString()}
                              </span>
                            </div>
                            {featured.expiresAt && (
                              <div>
                                <span className="text-muted-foreground">Expires:</span>
                                <span className="ml-2 font-medium">
                                  {new Date(featured.expiresAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <OrigamiButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfeatureCollection(featured.collectionId)}
                          className="text-red-500 hover:text-red-600 ml-4"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Unfeature
                        </OrigamiButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No featured collections</p>
                    <p className="text-sm text-muted-foreground">
                      Feature collections to highlight them on the homepage
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="origami-card">
                <CardHeader>
                  <CardTitle className="text-lg">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Users</span>
                      <span className="font-bold">{userStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Verified</span>
                      <span className="font-bold text-green-500">{userStats.verifiedUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <span className="font-bold text-blue-500">{userStats.activeUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardHeader>
                  <CardTitle className="text-lg">NFT Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total NFTs</span>
                      <span className="font-bold">{stats.totalNFTs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">For Sale</span>
                      <span className="font-bold text-blue-500">{stats.activeAuctions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Featured</span>
                      <span className="font-bold text-yellow-500">{nftStats.featuredNFTs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending Reports</span>
                      <span className="font-bold text-yellow-500">{reportStats.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Banned Users</span>
                      <span className="font-bold text-red-500">{userStats.bannedUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Flagged NFTs</span>
                      <span className="font-bold text-orange-500">{nftStats.flaggedNFTs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Trading Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Volume</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalVolume} QOM</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Report Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportStats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <Badge>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="origami-card">
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New User Registration</p>
                      <p className="text-sm text-muted-foreground">Allow new users to register</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-approve Collections</p>
                      <p className="text-sm text-muted-foreground">Automatically approve new collections</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardHeader>
                  <CardTitle>Platform Fee Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const feeConfig = getPlatformFeeConfig()
                    const rates = getCommissionRates()
                    return (
                      <>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h4 className="font-medium text-primary mb-3">Current Fee Structure</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Platform Fee:</span>
                              <span className="font-medium text-red-500">{feeConfig.platformFeeRate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buyer Commission:</span>
                              <span className="font-medium text-red-500">{rates.buyer}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seller Commission:</span>
                              <span className="font-medium text-red-500">{rates.seller}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Gas Fee:</span>
                              <span className="font-medium">{rates.gasFee}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between">
                              <span>Revenue Share Rate:</span>
                              <span className="font-medium text-green-500">{feeConfig.revenueShareRate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Update admin budget description to reflect new 7% total fee structure */}
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Admin Budget</h4>
                          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                            <div>
                              <span className="font-medium">Address:</span>
                              <p className="font-mono text-xs mt-1 break-all">{feeConfig.adminBudgetAddress}</p>
                            </div>
                            <div>
                              <span className="font-medium">Chain:</span> {feeConfig.chainInfo}
                            </div>
                            <div>
                              <span className="font-medium">Receives:</span> Platform fees (3% buyer + 3% seller + 1%
                              royalty donation = 7% total)
                            </div>
                          </div>
                        </div>

                        {/* Updated fee example to reflect 3% + 3% + 1% structure */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Fee Example</h4>
                          <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                            <p>For 100 QOM NFT sale:</p>
                            <p>• Buyer pays: 103 QOM (100 + 3% commission)</p>
                            <p>• Seller receives: ~96 QOM (after 3% commission + 1% donation)</p>
                            <p>• Platform receives: 7 QOM total (3% + 3% + 1%)</p>
                            <p>• Creator royalty: Reduced by 1% platform donation</p>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Transaction Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="lazy-mint-fee">Lazy Mint Fee (QOM)</Label>
                  <Input
                    id="lazy-mint-fee"
                    type="number"
                    value={lazyMintFee}
                    onChange={(e) => setLazyMintFee(e.target.value)}
                    step="0.001"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="collection-fee">Collection Creation Fee (QOM)</Label>
                  <Input
                    id="collection-fee"
                    type="number"
                    value={collectionCreationFee}
                    onChange={(e) => setCollectionCreationFee(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                <OrigamiButton variant="primary" className="w-full" onClick={handleUpdateTransactionSettings}>
                  Update Settings
                </OrigamiButton>
              </CardContent>
            </Card>

            {/* Danger Zone Section */}
            <Card className="origami-card mt-6">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-red-500 mb-2">Clear All NFTs</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete all NFTs from the marketplace and all user storage. This action cannot
                    be undone.
                  </p>
                  <OrigamiButton
                    variant="outline"
                    onClick={() => setClearNFTsDialogOpen(true)}
                    className="text-red-500 hover:text-red-600 border-red-500/20 hover:border-red-500/40"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Clear All NFTs
                  </OrigamiButton>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <AdminDebugPanel />
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            {/* Storage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Whitelisted Wallets</p>
                      <p className="text-2xl font-bold text-foreground">{storageStats.totalWallets}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Storage Used</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {(storageStats.totalStorageUsed / 1000).toFixed(2)} GB
                      </p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Storage Limit</p>
                      <p className="text-2xl font-bold text-green-500">
                        {(storageStats.storageLimit / 1000).toFixed(1)} GB
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">NFTs Uploaded</p>
                      <p className="text-2xl font-bold text-purple-500">{storageStats.totalNFTsUploaded}</p>
                    </div>
                    <Star className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storage Usage Progress */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {(storageStats.totalStorageUsed / 1000).toFixed(2)} GB used of{" "}
                      {(storageStats.storageLimit / 1000).toFixed(1)} GB
                    </span>
                    <span className="font-medium">
                      {((storageStats.totalStorageUsed / storageStats.storageLimit) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{
                        width: `${Math.min((storageStats.totalStorageUsed / storageStats.storageLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((storageStats.storageLimit - storageStats.totalStorageUsed) / 1000).toFixed(2)} GB remaining
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Add Wallet to Whitelist */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Add Wallet to Whitelist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="0x... wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="flex-1"
                  />
                  <OrigamiButton onClick={handleAddToWhitelist} disabled={!newWalletAddress}>
                    <Users className="w-4 h-4 mr-2" />
                    Add Wallet
                  </OrigamiButton>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="bulk-import">Bulk Import (one address per line)</Label>
                  <Textarea
                    id="bulk-import"
                    placeholder="0x1234...&#10;0xabcd...&#10;0x5678..."
                    value={bulkAddresses}
                    onChange={(e) => setBulkAddresses(e.target.value)}
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <OrigamiButton onClick={handleBulkImport} disabled={!bulkAddresses} variant="outline">
                      Import Addresses
                    </OrigamiButton>
                    <OrigamiButton onClick={handleExportWhitelist} variant="outline">
                      Export Whitelist
                    </OrigamiButton>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Whitelisted Wallets List */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Whitelisted Wallets</span>
                  <Badge className="bg-primary/10 text-primary">{whitelistEntries.length} Wallets</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {whitelistEntries.length > 0 ? (
                  <div className="space-y-4">
                    {whitelistEntries.map((entry) => (
                      <div
                        key={entry.address}
                        className="flex items-start justify-between p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium font-mono text-sm">
                                {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Added {new Date(entry.addedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="pl-8 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Storage Used:</span>
                              <span className="ml-2 font-medium">{entry.storageUsed.toFixed(2)} MB</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">NFTs Uploaded:</span>
                              <span className="ml-2 font-medium">{entry.nftsUploaded}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Added By:</span>
                              <span className="ml-2 font-medium font-mono text-xs">
                                {entry.addedBy.slice(0, 6)}...{entry.addedBy.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <OrigamiButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromWhitelist(entry.address)}
                          className="text-red-500 hover:text-red-600 ml-4"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Remove
                        </OrigamiButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No whitelisted wallets yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add wallet addresses above to allow them to use marketplace storage
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace-access" className="space-y-6">
            {/* Marketplace Whitelist Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Whitelist Status</p>
                      <p className="text-2xl font-bold text-foreground">
                        {marketplaceWhitelistEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Whitelisted Addresses</p>
                      <p className="text-2xl font-bold text-blue-500">{marketplaceWhitelistStats.totalAddresses}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium text-foreground">
                        {marketplaceWhitelistStats.lastUpdated === "Never"
                          ? "Never"
                          : new Date(marketplaceWhitelistStats.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Whitelist Toggle */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Marketplace Access Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">Require Whitelist for Marketplace</p>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only whitelisted addresses can list and buy NFTs
                    </p>
                  </div>
                  <Switch checked={marketplaceWhitelistEnabled} onCheckedChange={handleToggleMarketplaceWhitelist} />
                </div>

                {marketplaceWhitelistEnabled && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-500">Whitelist Active</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Only {marketplaceWhitelistStats.totalAddresses} whitelisted addresses can list and buy NFTs on
                          the marketplace. Admin wallet is always allowed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Address to Whitelist */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Add Address to Whitelist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="0x... wallet address"
                    value={newMarketplaceAddress}
                    onChange={(e) => setNewMarketplaceAddress(e.target.value)}
                    className="flex-1"
                  />
                  <OrigamiButton onClick={handleAddToMarketplaceWhitelist} variant="primary">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Add Address
                  </OrigamiButton>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="bulk-marketplace-import">Bulk Import (one address per line)</Label>
                  <Textarea
                    id="bulk-marketplace-import"
                    placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                    value={bulkMarketplaceAddresses}
                    onChange={(e) => setBulkMarketplaceAddresses(e.target.value)}
                    rows={5}
                    className="mt-2"
                  />
                  <div className="flex gap-2 mt-4">
                    <OrigamiButton onClick={handleBulkImportMarketplace} variant="outline" className="flex-1">
                      Import Addresses
                    </OrigamiButton>
                    <OrigamiButton onClick={handleExportMarketplaceWhitelist} variant="outline" className="flex-1">
                      Export Whitelist
                    </OrigamiButton>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Whitelisted Addresses List */}
            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Whitelisted Addresses ({marketplaceWhitelist.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {marketplaceWhitelist.length > 0 ? (
                  <div className="space-y-3">
                    {marketplaceWhitelist.map((entry) => (
                      <div
                        key={entry.address}
                        className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium">{entry.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added {new Date(entry.addedAt).toLocaleDateString()} by {entry.addedBy.slice(0, 6)}...
                            {entry.addedBy.slice(-4)}
                          </p>
                        </div>
                        <OrigamiButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromMarketplaceWhitelist(entry.address)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Remove
                        </OrigamiButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No addresses whitelisted yet</p>
                    <p className="text-sm text-muted-foreground">Add addresses above to grant marketplace access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factory" className="space-y-6">
            <Card className="origami-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>NFT Factory Control</span>
                  <Badge variant={factoryPaused ? "destructive" : "default"}>
                    {factoryPaused ? "Paused" : "Active"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg border">
                  <h3 className="font-medium mb-2">Emergency Pause</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pause all collection creation in case of emergency. This will prevent users from creating new
                    collections until unpaused.
                  </p>
                  <OrigamiButton onClick={handlePauseFactory} variant={factoryPaused ? "default" : "destructive"}>
                    {factoryPaused ? "Unpause Factory" : "Pause Factory"}
                  </OrigamiButton>
                </div>

                <div className="p-4 bg-muted/20 rounded-lg border">
                  <h3 className="font-medium mb-2">Disable Collection</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Disable a specific collection to prevent trading on the marketplace.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Collection contract address"
                      value={collectionToDisable}
                      onChange={(e) => setCollectionToDisable(e.target.value)}
                      className="flex-1"
                    />
                    <OrigamiButton
                      onClick={handleDisableCollection}
                      disabled={!collectionToDisable}
                      variant="destructive"
                    >
                      Disable
                    </OrigamiButton>
                  </div>
                </div>

                {disabledCollections.length > 0 && (
                  <div className="p-4 bg-muted/20 rounded-lg border">
                    <h3 className="font-medium mb-2">Disabled Collections</h3>
                    <div className="space-y-2">
                      {disabledCollections.map((collection) => (
                        <div key={collection} className="flex items-center justify-between p-2 bg-background rounded">
                          <code className="text-sm">{collection}</code>
                          <OrigamiButton size="sm" variant="outline" onClick={() => handleEnableCollection(collection)}>
                            Enable
                          </OrigamiButton>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>NFT Collection Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <InfoIcon className="w-4 h-4 text-blue-500" />
                    Collection Limits
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Maximum 10,000 NFTs per collection</p>
                    <p>• Maximum 100 collections per creator</p>
                    <p>• Minimum royalty: 0.1% (10 basis points)</p>
                    <p>• Maximum royalty: 5% (500 basis points)</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-lg border">
                  <h3 className="font-medium mb-2">Pause Individual Collections</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pause minting for specific collections without affecting the entire factory.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Note: This requires calling the pause() function on the individual OrigamiNFT contract.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="origami-card">
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New User Registration</p>
                      <p className="text-sm text-muted-foreground">Allow new users to register</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-approve Collections</p>
                      <p className="text-sm text-muted-foreground">Automatically approve new collections</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card className="origami-card">
                <CardHeader>
                  <CardTitle>Platform Fee Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const feeConfig = getPlatformFeeConfig()
                    const rates = getCommissionRates()
                    return (
                      <>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h4 className="font-medium text-primary mb-3">Current Fee Structure</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Platform Fee:</span>
                              <span className="font-medium text-red-500">{feeConfig.platformFeeRate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buyer Commission:</span>
                              <span className="font-medium text-red-500">{rates.buyer}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seller Commission:</span>
                              <span className="font-medium text-red-500">{rates.seller}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Gas Fee:</span>
                              <span className="font-medium">{rates.gasFee}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between">
                              <span>Revenue Share Rate:</span>
                              <span className="font-medium text-green-500">{feeConfig.revenueShareRate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Update admin budget description to reflect new 7% total fee structure */}
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Admin Budget</h4>
                          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                            <div>
                              <span className="font-medium">Address:</span>
                              <p className="font-mono text-xs mt-1 break-all">{feeConfig.adminBudgetAddress}</p>
                            </div>
                            <div>
                              <span className="font-medium">Chain:</span> {feeConfig.chainInfo}
                            </div>
                            <div>
                              <span className="font-medium">Receives:</span> Platform fees (3% buyer + 3% seller + 1%
                              royalty donation = 7% total)
                            </div>
                          </div>
                        </div>

                        {/* Updated fee example to reflect 3% + 3% + 1% structure */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Fee Example</h4>
                          <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                            <p>For 100 QOM NFT sale:</p>
                            <p>• Buyer pays: 103 QOM (100 + 3% commission)</p>
                            <p>• Seller receives: ~96 QOM (after 3% commission + 1% donation)</p>
                            <p>• Platform receives: 7 QOM total (3% + 3% + 1%)</p>
                            <p>• Creator royalty: Reduced by 1% platform donation</p>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>

            <Card className="origami-card">
              <CardHeader>
                <CardTitle>Transaction Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="lazy-mint-fee">Lazy Mint Fee (QOM)</Label>
                  <Input
                    id="lazy-mint-fee"
                    type="number"
                    value={lazyMintFee}
                    onChange={(e) => setLazyMintFee(e.target.value)}
                    step="0.001"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="collection-fee">Collection Creation Fee (QOM)</Label>
                  <Input
                    id="collection-fee"
                    type="number"
                    value={collectionCreationFee}
                    onChange={(e) => setCollectionCreationFee(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                <OrigamiButton variant="primary" className="w-full" onClick={handleUpdateTransactionSettings}>
                  Update Settings
                </OrigamiButton>
              </CardContent>
            </Card>

            {/* Danger Zone Section */}
            <Card className="origami-card mt-6">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-red-500 mb-2">Clear All NFTs</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete all NFTs from the marketplace and all user storage. This action cannot
                    be undone.
                  </p>
                  <OrigamiButton
                    variant="outline"
                    onClick={() => setClearNFTsDialogOpen(true)}
                    className="text-red-500 hover:text-red-600 border-red-500/20 hover:border-red-500/40"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Clear All NFTs
                  </OrigamiButton>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <AdminDebugPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to ban user {selectedUser?.username} ({selectedUser?.address.slice(0, 10)}...). This action
              will prevent them from accessing the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ban-reason">Reason for ban *</Label>
              <Textarea
                id="ban-reason"
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="ban-duration">Duration (days)</Label>
              <Input
                id="ban-duration"
                type="number"
                placeholder="Leave empty for permanent ban"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for permanent ban</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} disabled={!banReason} className="bg-red-500 hover:bg-red-600">
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fix User Issues</AlertDialogTitle>
            <AlertDialogDescription>
              Select the type of fix to apply to user {selectedUser?.username} ({selectedUser?.address.slice(0, 10)}
              ...).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fix-type">Fix Type *</Label>
              <Select value={fixType} onValueChange={setFixType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select fix type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reset_profile">Reset Profile</SelectItem>
                  <SelectItem value="restore_access">Restore Access</SelectItem>
                  <SelectItem value="clear_violations">Clear Violations</SelectItem>
                  <SelectItem value="reset_stats">Reset Stats</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFixUser} disabled={!fixType} className="bg-blue-500 hover:bg-blue-600">
              Apply Fix
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={nftActionDialogOpen} onOpenChange={setNftActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>NFT Action: {nftActionType}</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {nftActionType} NFT #{selectedNFT?.id} ({selectedNFT?.name}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(nftActionType === "hide" || nftActionType === "flag") && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nft-action-reason">Reason *</Label>
                <Textarea
                  id="nft-action-reason"
                  placeholder={`Enter the reason for ${nftActionType}ing this NFT...`}
                  value={nftActionReason}
                  onChange={(e) => setNftActionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNFTAction}
              disabled={(nftActionType === "hide" || nftActionType === "flag") && !nftActionReason}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteNFTDialogOpen} onOpenChange={setDeleteNFTDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete NFT</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete NFT #{selectedNFT?.id} ({selectedNFT?.name}). This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove the NFT from the marketplace</li>
                <li>Remove it from the creator's collection</li>
                <li>Remove all associated metadata</li>
              </ul>
              <p className="mt-4 font-semibold text-red-500">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delete-reason">Reason for deletion *</Label>
              <Textarea
                id="delete-reason"
                placeholder="Enter the reason for deleting this NFT..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNFT}
              disabled={!deleteReason}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete NFT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearNFTsDialogOpen} onOpenChange={setClearNFTsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Clear All NFTs</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all NFTs from the marketplace and all user storage. This includes:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All marketplace NFTs</li>
                <li>All user-created NFTs</li>
                <li>All user-owned NFTs</li>
                <li>All NFT transaction history</li>
              </ul>
              <p className="mt-4 font-semibold text-red-500">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllNFTs} className="bg-red-500 hover:bg-red-600">
              Yes, Clear All NFTs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review Report</AlertDialogTitle>
            <AlertDialogDescription>
              Report for {selectedReport?.targetName} ({selectedReport?.type})
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Category:</span> {selectedReport?.category}
                </p>
                <p>
                  <span className="font-medium">Reason:</span> {selectedReport?.reason}
                </p>
                <p>
                  <span className="font-medium">Description:</span> {selectedReport?.description}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                id="resolution"
                placeholder="Enter your resolution notes..."
                value={reportResolution}
                onChange={(e) => setReportResolution(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <OrigamiButton
              onClick={() => handleReviewReport("dismissed")}
              variant="outline"
              className="text-gray-500 hover:text-gray-600"
            >
              Dismiss
            </OrigamiButton>
            <OrigamiButton onClick={() => handleReviewReport("resolved")} className="bg-green-500 hover:bg-green-600">
              Resolve
            </OrigamiButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminPage() {
  const { address } = useWallet()

  const isAdmin = isAdminWallet(address)

  return (
    <WalletProtectionGuard
      title="Admin Access Required"
      description="This admin dashboard requires a connected wallet with administrator privileges. Please connect an authorized admin wallet to access marketplace management features."
      icon={<Shield className="w-10 h-10 text-primary" />}
      showFullPage={true}
    >
      {isAdmin ? (
        <AdminDashboardContent />
      ) : (
        <div className="min-h-screen">
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="origami-card">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                      <Ban className="w-10 h-10 text-red-500" />
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
                      <p className="text-muted-foreground text-pretty max-w-md">
                        Your wallet address is not authorized to access the admin dashboard. Only designated
                        administrator wallets can manage the marketplace.
                      </p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <p className="mt-2">Contact support if you believe this is an error.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      )}
    </WalletProtectionGuard>
  )
}
