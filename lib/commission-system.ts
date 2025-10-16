// Commission System for NFT Marketplace

export interface CommissionConfig {
  platformFeeRate: number // No longer used - replaced by buyer/seller commissions
  buyerCommissionRate: number // 3% buyer commission
  sellerCommissionRate: number // 3% seller commission
  platformDonationRate: number // 1% platform donation from royalty
  gasFee: number // Network gas fee
  adminBudgetAddress: string // Admin budget wallet address
}

export interface CommissionBreakdown {
  salePrice: number
  platformFee: number // Deprecated - kept for compatibility
  buyerCommission: number
  sellerCommission: number
  platformDonation: number
  gasFee: number
  totalBuyerPayment: number
  sellerNetEarnings: number
  platformEarnings: number
  adminBudgetTransfer: number
}

export interface CommissionRates {
  platform: string
  buyer: string
  seller: string
  gasFee: string
}

export const COMMISSION_CONFIG: CommissionConfig = {
  platformFeeRate: 0, // Deprecated - no longer used
  buyerCommissionRate: 0.03, // 3% buyer commission (was 1%)
  sellerCommissionRate: 0.03, // 3% seller commission (was 1%)
  platformDonationRate: 0.01, // 1% platform donation from sale price
  gasFee: 0.00001, // QL1 chain gas fee
  adminBudgetAddress: "0x4A6c64a453BBF65E45C1c778241777d3ee4ddD1C", // Admin budget address
}

/**
 * Calculate complete commission breakdown with platform fees
 */
export function calculateCommissionBreakdown(
  salePrice: number,
  buyerAddress: string,
  sellerAddress: string,
  customGasFee?: number,
): CommissionBreakdown {
  const config = COMMISSION_CONFIG
  const gasFee = customGasFee || config.gasFee

  const buyerCommission = salePrice * config.buyerCommissionRate
  const sellerCommission = salePrice * config.sellerCommissionRate
  const platformDonation = salePrice * config.platformDonationRate

  // Platform earnings from fees (all goes to admin budget)
  const platformEarnings = buyerCommission + sellerCommission + platformDonation

  // Calculate totals
  const totalBuyerPayment = salePrice + buyerCommission + gasFee
  const sellerNetEarnings = salePrice - sellerCommission - gasFee

  const adminBudgetTransfer = platformEarnings

  return {
    salePrice,
    platformFee: 0, // Deprecated
    buyerCommission,
    sellerCommission,
    platformDonation,
    gasFee,
    totalBuyerPayment,
    sellerNetEarnings,
    platformEarnings,
    adminBudgetTransfer,
  }
}

/**
 * Format commission breakdown for display
 */
export function formatCommissionDisplay(breakdown: CommissionBreakdown): {
  buyerView: {
    itemPrice: string
    commission: string
    gasFee: string
    total: string
  }
  sellerView: {
    salePrice: string
    commission: string
    platformFee: string
    gasFee: string
    netEarnings: string
  }
  platformView: {
    fromCommissions: string
    fromPlatformFee: string
    netEarnings: string
  }
} {
  const formatQOM = (amount: number) => `${amount.toFixed(6)} QOM`

  return {
    buyerView: {
      itemPrice: formatQOM(breakdown.salePrice),
      commission: formatQOM(breakdown.buyerCommission),
      gasFee: formatQOM(breakdown.gasFee),
      total: formatQOM(breakdown.totalBuyerPayment),
    },
    sellerView: {
      salePrice: formatQOM(breakdown.salePrice),
      commission: formatQOM(breakdown.sellerCommission),
      platformFee: formatQOM(breakdown.platformFee),
      gasFee: formatQOM(breakdown.gasFee),
      netEarnings: formatQOM(breakdown.sellerNetEarnings),
    },
    platformView: {
      fromCommissions: formatQOM(breakdown.buyerCommission + breakdown.sellerCommission),
      fromPlatformFee: formatQOM(breakdown.platformFee),
      netEarnings: formatQOM(breakdown.adminBudgetTransfer),
    },
  }
}

/**
 * Process QL1 chain transaction with platform fees
 */
export async function processCommissionTransaction(
  buyerAddress: string,
  sellerAddress: string,
  salePrice: number,
  nftId: string,
): Promise<{
  success: boolean
  transactionHash?: string
  breakdown: CommissionBreakdown
  error?: string
}> {
  try {
    const breakdown = calculateCommissionBreakdown(salePrice, buyerAddress, sellerAddress)

    // Simulate QL1 chain transaction processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate successful transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

    return {
      success: true,
      transactionHash: mockTxHash,
      breakdown,
    }
  } catch (error) {
    return {
      success: false,
      breakdown: calculateCommissionBreakdown(salePrice, buyerAddress, sellerAddress),
      error: error instanceof Error ? error.message : "QL1 transaction failed",
    }
  }
}

/**
 * Get commission rates for display
 */
export function getCommissionRates(): CommissionRates {
  const config = COMMISSION_CONFIG
  return {
    platform: `${(config.platformDonationRate * 100).toFixed(1)}%`, // Show donation rate
    buyer: `${(config.buyerCommissionRate * 100).toFixed(1)}%`, // Now 3%
    seller: `${(config.sellerCommissionRate * 100).toFixed(1)}%`, // Now 3%
    gasFee: `${config.gasFee.toFixed(6)} QOM`,
  }
}

/**
 * Get platform fee configuration for admin panel
 */
export function getPlatformFeeConfig(): {
  platformFeeRate: string
  adminBudgetAddress: string
  totalFeeStructure: string
  chainInfo: string
} {
  const config = COMMISSION_CONFIG
  return {
    platformFeeRate: `${((config.buyerCommissionRate + config.sellerCommissionRate) * 100).toFixed(1)}%`, // 6% total
    adminBudgetAddress: config.adminBudgetAddress,
    totalFeeStructure: `Buyer: ${(config.buyerCommissionRate * 100).toFixed(1)}% + Seller: ${(config.sellerCommissionRate * 100).toFixed(1)}% + Donation: ${(config.platformDonationRate * 100).toFixed(1)}%`, // Updated structure
    chainInfo: "QL1 Chain",
  }
}
