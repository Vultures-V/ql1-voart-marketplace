// QOM Pricing and Cost Calculation Utilities for QL1 Chain

export interface QOMCosts {
  contractDistribution: number
  initialInstallation: number
  totalEstimatedMin: number
  totalEstimatedMax: number
}

export interface TransactionCosts {
  mintingFee: number
  listingFee: number
  transferFee: number
  marketplaceFee: number
  royaltyFee: number
}

export interface GasEstimate {
  low: number
  standard: number
  high: number
  current: number
}

// QL1 Distribution Costs (from user specification)
export const QL1_DISTRIBUTION_COSTS: QOMCosts = {
  contractDistribution: 250_000_000, // 250M QOM
  initialInstallation: 250_000_000_000, // 250B QOM
  totalEstimatedMin: 500_000_000, // 500M QOM
  totalEstimatedMax: 1_000_000_000_000, // 1T QOM
}

// Network congestion multipliers
export const CONGESTION_MULTIPLIERS = {
  low: 1.0,
  standard: 1.5,
  high: 2.0,
  extreme: 3.0,
}

/**
 * Get current network congestion level (mock implementation)
 */
export function getNetworkCongestion(): "low" | "standard" | "high" | "extreme" {
  // In production, this would query the QL1 network
  const random = Math.random()
  if (random < 0.3) return "low"
  if (random < 0.7) return "standard"
  if (random < 0.9) return "high"
  return "extreme"
}

import { fetchQOMPriceFromQomSwap } from "./qomswap-integration"

/**
 * Get QOM/USD rate with QomSwap integration
 */
export async function getQOMUSDRateFromQomSwap(): Promise<number> {
  try {
    const qomSwapPrice = await fetchQOMPriceFromQomSwap()
    if (qomSwapPrice) {
      // Update localStorage with fresh price
      if (typeof window !== "undefined") {
        localStorage.setItem("qom_usd_rate", qomSwapPrice.priceUSD.toString())
        localStorage.setItem("qom_price_source", "qomswap")
        localStorage.setItem("qom_price_updated", qomSwapPrice.lastUpdated)
      }
      return qomSwapPrice.priceUSD
    }
  } catch (error) {
    console.error("Failed to fetch QOM price from QomSwap:", error)
  }

  // Fallback to stored or default price
  return getQOMUSDRate()
}

/**
 * Enhanced QOM USD rate getter with source tracking
 */
export function getQOMUSDRate(): number {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("qom_usd_rate")
    if (stored) {
      return Number.parseFloat(stored)
    }
  }
  return 1700 // Default rate matches QomSwap base price
}

/**
 * Get price source information
 */
export function getPriceSourceInfo(): {
  source: string
  lastUpdated: string | null
  isLive: boolean
} {
  if (typeof window !== "undefined") {
    const source = localStorage.getItem("qom_price_source") || "manual"
    const lastUpdated = localStorage.getItem("qom_price_updated")
    const isLive = source === "qomswap"

    return {
      source: source === "qomswap" ? "QomSwap DEX" : "Manual Entry",
      lastUpdated,
      isLive,
    }
  }

  return {
    source: "Manual Entry",
    lastUpdated: null,
    isLive: false,
  }
}

/**
 * Get current QOM price in USD (alias for getQOMUSDRate)
 */
export function getQOMPrice(): number {
  return getQOMUSDRate()
}

// Base transaction costs on QL1 network
export const BASE_TRANSACTION_COSTS: TransactionCosts = {
  mintingFee: 0.00001, // QOM per mint - extremely low on QL1
  listingFee: 0.000005, // QOM per listing - ultra-low fees
  transferFee: 0.000002, // QOM per transfer - minimal cost
  marketplaceFee: 0.025, // 2.5% of sale price
  royaltyFee: 0.1, // 10% default royalty
}

/**
 * Calculate gas estimate based on network congestion
 */
export function calculateGasEstimate(baseCost: number): GasEstimate {
  const congestion = getNetworkCongestion()
  const multiplier = CONGESTION_MULTIPLIERS[congestion]

  return {
    low: baseCost * CONGESTION_MULTIPLIERS.low,
    standard: baseCost * CONGESTION_MULTIPLIERS.standard,
    high: baseCost * CONGESTION_MULTIPLIERS.high,
    current: baseCost * multiplier,
  }
}

/**
 * Calculate minting costs including gas fees
 */
export function calculateMintingCost(quantity = 1): {
  baseCost: number
  gasCost: GasEstimate
  totalCost: GasEstimate
  breakdown: {
    perNFT: number
    totalNFTs: number
    platformFee: number
    networkFee: GasEstimate
  }
} {
  const baseCost = BASE_TRANSACTION_COSTS.mintingFee * quantity
  const gasCost = calculateGasEstimate(baseCost)

  return {
    baseCost,
    gasCost,
    totalCost: {
      low: baseCost + gasCost.low,
      standard: baseCost + gasCost.standard,
      high: baseCost + gasCost.high,
      current: baseCost + gasCost.current,
    },
    breakdown: {
      perNFT: BASE_TRANSACTION_COSTS.mintingFee,
      totalNFTs: quantity,
      platformFee: baseCost,
      networkFee: gasCost,
    },
  }
}

/**
 * Calculate marketplace transaction costs
 */
export function calculateMarketplaceCosts(salePrice: number): {
  salePrice: number
  marketplaceFee: number
  creatorEarnings: number
  royaltyFee: number
  netEarnings: number
  gasCost: GasEstimate
  totalCost: GasEstimate
} {
  const marketplaceFee = salePrice * BASE_TRANSACTION_COSTS.marketplaceFee
  const royaltyFee = salePrice * 0.1 // 10% default royalty
  const creatorEarnings = salePrice - marketplaceFee
  const netEarnings = creatorEarnings - royaltyFee
  const gasCost = calculateGasEstimate(BASE_TRANSACTION_COSTS.listingFee)

  return {
    salePrice,
    marketplaceFee,
    creatorEarnings,
    royaltyFee,
    netEarnings,
    gasCost,
    totalCost: {
      low: gasCost.low,
      standard: gasCost.standard,
      high: gasCost.high,
      current: gasCost.current,
    },
  }
}

/**
 * Calculate collection deployment costs
 */
export function calculateCollectionDeploymentCost(): {
  contractDeployment: number
  initialSetup: number
  totalEstimated: {
    min: number
    max: number
    current: number
  }
  gasCost: GasEstimate
  breakdown: {
    contractDistribution: number
    initialInstallation: number
    networkCongestionFactor: number
  }
} {
  const congestion = getNetworkCongestion()
  const multiplier = CONGESTION_MULTIPLIERS[congestion]

  const contractDeployment = 0.5 * multiplier // Base deployment cost
  const initialSetup = 0.2 * multiplier // Setup cost
  const gasCost = calculateGasEstimate(contractDeployment + initialSetup)

  return {
    contractDeployment,
    initialSetup,
    totalEstimated: {
      min: 0.7 * multiplier,
      max: 1.5 * multiplier,
      current: (contractDeployment + initialSetup) * multiplier,
    },
    gasCost,
    breakdown: {
      contractDistribution: QL1_DISTRIBUTION_COSTS.contractDistribution,
      initialInstallation: QL1_DISTRIBUTION_COSTS.initialInstallation,
      networkCongestionFactor: multiplier,
    },
  }
}

/**
 * Convert QOM to USD
 */
export function qomToUSD(qomAmount: number): number {
  return qomAmount * getQOMUSDRate()
}

/**
 * Convert USD to QOM
 */
export function usdToQOM(usdAmount: number): number {
  return usdAmount / getQOMUSDRate()
}

/**
 * Format QOM amount for display
 */
export function formatQOM(amount: number, decimals = 4): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(decimals)}B QOM`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(decimals)}M QOM`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(decimals)}K QOM`
  }
  return `${amount.toFixed(decimals)} QOM`
}

/**
 * Format USD amount for display
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get network status information for QL1 chain
 */
export function getNetworkStatus(): {
  congestion: string
  avgGasPrice: number
  estimatedConfirmationTime: string
  status: "healthy" | "congested" | "slow"
  chainInfo: {
    name: string
    type: string
    features: string[]
  }
} {
  const congestion = getNetworkCongestion()
  const baseGasPrice = 0.00001 // Ultra-low base gas price for QL1
  const multiplier = CONGESTION_MULTIPLIERS[congestion]

  return {
    congestion: congestion.charAt(0).toUpperCase() + congestion.slice(1),
    avgGasPrice: baseGasPrice * multiplier,
    estimatedConfirmationTime:
      congestion === "low"
        ? "~5-10 seconds" // Lightning-fast confirmation on QL1
        : congestion === "standard"
          ? "~15-30 seconds"
          : congestion === "high"
            ? "~1-2 minutes"
            : "~2-5 minutes",
    status:
      congestion === "low"
        ? "healthy"
        : congestion === "standard"
          ? "healthy"
          : congestion === "high"
            ? "congested"
            : "slow",
    chainInfo: {
      name: "QOM Layer One (QL1)",
      type: "EVM-Compatible with IBC",
      features: ["Lightning-fast transactions", "Extremely low fees", "EVM compatibility", "IBC enabled"],
    },
  }
}

/**
 * Calculate optimal gas price based on QL1 network conditions
 */
export function calculateOptimalGasPrice(): {
  recommended: number
  fast: number
  instant: number
  savings: {
    vsEthereum: string
    vsPolygon: string
  }
} {
  const congestion = getNetworkCongestion()
  const basePrice = 0.00001
  const multiplier = CONGESTION_MULTIPLIERS[congestion]

  return {
    recommended: basePrice * multiplier,
    fast: basePrice * multiplier * 1.5,
    instant: basePrice * multiplier * 2,
    savings: {
      vsEthereum: "99.9%", // Compared to Ethereum mainnet
      vsPolygon: "95%", // Compared to Polygon
    },
  }
}

/**
 * Get QL1 network advantages
 */
export function getQL1Advantages(): {
  speed: string
  cost: string
  compatibility: string
  interoperability: string
} {
  return {
    speed: "Lightning-fast transaction times (5-30 seconds)",
    cost: "Extremely low fees (99.9% cheaper than Ethereum)",
    compatibility: "Full EVM compatibility - use existing Ethereum tools",
    interoperability: "IBC enabled for cross-chain communication",
  }
}
