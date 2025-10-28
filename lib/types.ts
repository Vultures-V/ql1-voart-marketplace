export interface NFTAttribute {
  trait_type: string
  value: string
}

export interface NFTCreator {
  address: string
  name?: string
  avatar?: string
  verified?: boolean
}

export interface NFTRoyalty {
  percentage: string
  address: string
}

export interface NFTStatus {
  isBurned?: boolean
  isHidden?: boolean
  isDelisted?: boolean
  isSold?: boolean
}

export interface NFTIPFS {
  imageCID?: string
  metadataCID?: string
  imageUrl?: string
  metadataUrl?: string
}

// Standardized NFT interface used across all pages
export interface NFT {
  // Core identification
  id: number
  name: string
  description: string

  // Media
  image: string
  imageIPFS?: string
  imageGateway?: string
  metadataIPFS?: string
  media?: string
  mediaType?: string

  // Pricing
  price: string
  currency: string

  // Creator info
  creator: string
  creatorName?: string
  creatorAvatar?: string
  creatorVerified?: boolean

  // Stats
  likes: number
  views: number

  // Properties
  category: string
  rarity: string
  contractType?: string
  isLazyMinted: boolean

  // Attributes
  attributes?: NFTAttribute[]
  properties?: {
    color?: string
    tags?: string[]
    [key: string]: any
  }

  // Sale info
  saleType?: string
  auctionDuration?: string
  royalty?: NFTRoyalty

  // Status
  status?: string | NFTStatus
  isBurned?: boolean

  // Metadata
  createdAt?: string
  collectionId?: string
  collectionName?: string
  network?: string

  // IPFS
  ipfs?: NFTIPFS
}

export interface CollectionCreator {
  name: string
  avatar: string
  verified: boolean
}

export interface CollectionStats {
  items: number
  owners: number
  floorPrice: string
  volume: string
}

// Standardized Collection interface
export interface Collection {
  // Core identification
  id: string
  name: string
  description: string
  symbol?: string

  // Images
  image: string // Main display image (logo)
  banner?: string // Banner/cover image
  logoImage?: string // Alternative logo field
  bannerImage?: string // Alternative banner field
  coverImage?: string // Alternative cover field
  logo?: string // Alternative logo field

  // Creator
  creator: CollectionCreator | string
  creatorName?: string
  creatorAvatar?: string
  creatorVerified?: boolean

  // Stats
  stats: CollectionStats
  items?: number // Alternative stats field
  owners?: number
  floorPrice?: string
  volume?: string

  // Properties
  category?: string
  network?: string
  royalties?: number
  totalSupply?: string
  isUnlimited?: boolean
  mintingType?: string
  isVerified?: boolean
  isCollaborative?: boolean

  // Metadata
  createdAt?: number | string
  launchDate?: string

  // Social
  twitter?: string
  discord?: string
  website?: string

  // Traits
  traits?: NFTAttribute[]
}

// Helper function to normalize NFT data
export function normalizeNFT(nft: any): NFT {
  return {
    id: nft.id,
    name: nft.name || "Unnamed NFT",
    description: nft.description || "",
    image: nft.image || nft.imageGateway || "/placeholder.svg",
    imageIPFS: nft.imageIPFS || nft.ipfs?.imageUrl,
    imageGateway: nft.imageGateway || nft.ipfs?.imageUrl,
    metadataIPFS: nft.metadataIPFS || nft.ipfs?.metadataUrl,
    media: nft.media,
    mediaType: nft.mediaType,
    price: nft.price || "0",
    currency: nft.currency || "QOM",
    creator: nft.creator || "",
    creatorName: nft.creatorName,
    creatorAvatar: nft.creatorAvatar,
    creatorVerified: nft.creatorVerified,
    likes: nft.likes || 0,
    views: nft.views || 0,
    category: nft.category || "Art",
    rarity: nft.rarity || "Common",
    contractType: nft.contractType || "ERC721",
    isLazyMinted: nft.isLazyMinted ?? true,
    attributes: nft.attributes || [],
    properties: nft.properties || {},
    saleType: nft.saleType || "fixed",
    auctionDuration: nft.auctionDuration,
    royalty: nft.royalty,
    status: nft.status || "listed",
    isBurned: nft.isBurned || (typeof nft.status === "object" && nft.status?.isBurned) || false,
    createdAt: nft.createdAt,
    collectionId: nft.collectionId,
    collectionName: nft.collectionName,
    network: nft.network || "ql1",
    ipfs: nft.ipfs,
  }
}

// Helper function to normalize Collection data
export function normalizeCollection(col: any): Collection {
  // Handle creator field
  let creator: CollectionCreator
  if (typeof col.creator === "object" && col.creator !== null) {
    creator = {
      name: col.creator.name || col.creatorName || "Unknown Creator",
      avatar: col.creator.avatar || col.creatorAvatar || "/placeholder.svg",
      verified: col.creator.verified || col.creatorVerified || false,
    }
  } else {
    creator = {
      name: col.creatorName || "Unknown Creator",
      avatar: col.creatorAvatar || "/placeholder.svg",
      verified: col.creatorVerified || false,
    }
  }

  // Handle stats field
  let stats: CollectionStats
  if (col.stats && typeof col.stats === "object") {
    stats = {
      items: col.stats.items || col.items || 0,
      owners: col.stats.owners || col.owners || 0,
      floorPrice: col.stats.floorPrice?.toString() || col.floorPrice?.toString() || "0",
      volume: col.stats.volume?.toString() || col.volume?.toString() || "0",
    }
  } else {
    stats = {
      items: col.items || 0,
      owners: col.owners || 0,
      floorPrice: col.floorPrice?.toString() || "0",
      volume: col.volume?.toString() || "0",
    }
  }

  return {
    id: col.id || `collection-${Date.now()}`,
    name: col.name || "Unnamed Collection",
    description: col.description || "",
    symbol: col.symbol,
    image: col.logoImage || col.logo || col.image || "/placeholder.svg",
    banner: col.bannerImage || col.banner || col.coverImage,
    logoImage: col.logoImage || col.logo || col.image,
    bannerImage: col.bannerImage || col.banner || col.coverImage,
    creator,
    stats,
    category: col.category || "art",
    network: col.network || "ql1",
    royalties: col.royalties || 5,
    totalSupply: col.totalSupply,
    isUnlimited: col.isUnlimited || false,
    mintingType: col.mintingType || "lazy",
    isVerified: col.isVerified || false,
    isCollaborative: col.isCollaborative || false,
    createdAt: col.createdAt || Date.now(),
    launchDate: col.launchDate,
    twitter: col.twitter,
    discord: col.discord,
    website: col.website,
    traits: col.traits || [],
  }
}
