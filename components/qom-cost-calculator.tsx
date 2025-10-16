"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateCollectionDeploymentCost, formatQOM, formatUSD, qomToUSD, getNetworkStatus } from "@/lib/qom-pricing"
import { DollarSign, Zap, TrendingUpIcon, AlertCircle, Info } from "@/components/simple-icons"
import { calculateCommissionBreakdown, formatCommissionDisplay } from "@/lib/commission-system"
import { QL1_NETWORK } from "@/lib/network-config"

const POOL_ADDRESS = "0xA21d14Fe48f48556f760Fa173aE9Bc3f6a996C5B"
const QL1_RPC_URL = QL1_NETWORK.rpcUrl
const CHAIN_ID = QL1_NETWORK.chainId
const QOM_DECIMALS = 18
const QUSDT_DECIMALS = 6

interface QOMCostCalculatorProps {
  type: "minting" | "marketplace" | "collection"
  defaultPrice?: number
  defaultQuantity?: number
  buyerAddress?: string
  sellerAddress?: string
  className?: string
}

function formatSmallNumber(num: number): string {
  if (num === 0) return "$0.00"

  // Convert to string to count leading zeros
  const numStr = num.toFixed(20) // Use high precision
  const match = numStr.match(/^0\.0*/)

  if (match && match[0].length > 3) {
    // Count the zeros after decimal point
    const zeros = match[0].length - 2 // Subtract "0."
    // Get the significant digits
    const significantPart = numStr.slice(match[0].length).slice(0, 3)
    return `$0.0(${zeros})${significantPart}`
  }

  // For normal numbers, use standard formatting
  if (num >= 0.01) {
    return `$${num.toFixed(4)}`
  }

  return `$${num.toFixed(10)}`
}

export function QOMCostCalculator({
  type,
  defaultPrice = 1,
  defaultQuantity = 1,
  buyerAddress = "0x0000000000000000000000000000000000000000",
  sellerAddress = "0x0000000000000000000000000000000000000000",
  className = "",
}: QOMCostCalculatorProps) {
  const [price, setPrice] = useState(defaultPrice)
  const [quantity, setQuantity] = useState(defaultQuantity)
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus())
  const [qomPrice, setQomPrice] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStatus(getNetworkStatus())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updatePrice = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("qom_usd_rate")
        if (stored) {
          const parsedPrice = Number.parseFloat(stored)
          setQomPrice(parsedPrice)
        } else {
          // Fallback to correct current price
          setQomPrice(0.0000000116)
        }
      }
    }

    // Initial load
    updatePrice()

    // Update every 5 seconds to catch changes from QOMPriceFetcher
    const interval = setInterval(updatePrice, 5000)

    // Listen for storage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "qom_usd_rate" && e.newValue) {
        setQomPrice(Number.parseFloat(e.newValue))
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const renderMintingCalculator = () => {
    const baseCostPerNFT = 0.00001
    const totalBaseCost = baseCostPerNFT * quantity
    const platformFee = totalBaseCost * 0.03
    const gasFee = totalBaseCost * 1.5
    const totalCost = totalBaseCost + platformFee + gasFee

    return (
      <Card className={`origami-card ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Minting Cost Calculator</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="bg-qom-gold/10 border-qom-gold/30 text-qom-gold font-mono text-xs px-3 py-1"
              >
                <TrendingUpIcon className="w-3 h-3 mr-1.5" />1 QOM ={" "}
                {qomPrice !== null ? formatSmallNumber(qomPrice) : "Loading..."}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Calculate the cost to mint NFTs on the QL1 chain. Platform fee: 3%
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number of NFTs to Mint</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              min="1"
              max="10000"
              className="mt-2"
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base Minting Cost</span>
              <span className="font-medium">
                {formatQOM(totalBaseCost)} × {quantity} NFT{quantity > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Platform Fee (3%)</span>
              <span className="font-medium text-amber-500">{formatQOM(platformFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Network Gas Fee (Est.)</span>
              <span className="font-medium text-blue-500">{formatQOM(gasFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold text-base">Total Minting Cost</span>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">{formatQOM(totalCost)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatUSD(qomToUSD(totalCost, qomPrice || 0.0000000116))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-200 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-800 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-950 dark:text-blue-200">QL1 Chain Benefits</p>
                <ul className="space-y-1 text-xs text-blue-900 dark:text-blue-300">
                  <li>• Ultra-low minting fees (99.9% cheaper than Ethereum)</li>
                  <li>• Fast confirmation times (5-30 seconds)</li>
                  <li>• Gas fees vary based on network congestion</li>
                  <li className="font-medium text-blue-950 dark:text-blue-100">
                    • Current QOM Price: {qomPrice !== null ? formatSmallNumber(qomPrice) : "Loading..."} (Live from
                    QomSwap DEX)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderMarketplaceCalculator = () => {
    const commissionBreakdown = calculateCommissionBreakdown(price, buyerAddress, sellerAddress)
    const display = formatCommissionDisplay(commissionBreakdown)

    return (
      <Card className={`origami-card ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUpIcon className="w-5 h-5" />
            <span>Commission Calculator</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Calculate earnings and fees for marketplace transactions</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sale-price">Sale Price (QOM)</Label>
            <Input
              id="sale-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sale Price</span>
              <span className="font-medium">{display.sellerView.salePrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Seller Commission (3%)</span>
              <span className="font-medium text-red-500">-{display.sellerView.commission}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Platform Donation (1%)</span>
              <span className="font-medium text-red-500">-{display.sellerView.platformFee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gas Fee</span>
              <span className="font-medium text-red-500">-{display.sellerView.gasFee}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Net Earnings</span>
              <div className="text-right">
                <p className="font-bold text-green-500">{display.sellerView.netEarnings}</p>
                <p className="text-xs text-muted-foreground">
                  {(
                    ((commissionBreakdown.sellerNetEarnings - commissionBreakdown.gasFee) /
                      commissionBreakdown.salePrice) *
                    100
                  ).toFixed(1)}
                  % of sale price
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Buyer pays additional 3% commission</p>
                <p>Total buyer payment: {display.buyerView.total}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCollectionCalculator = () => {
    const costs = calculateCollectionDeploymentCost()

    return (
      <Card className={`origami-card ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Collection Deployment Cost</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Cost to deploy a new collection on QL1 chain</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contract Deployment</span>
              <span className="font-medium">{formatQOM(costs.contractDeployment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Initial Setup</span>
              <span className="font-medium">{formatQOM(costs.initialSetup)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Network Gas Fee</span>
              <span className="font-medium">{formatQOM(costs.gasCost.current)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Estimated Cost</span>
              <div className="text-right">
                <p className="font-bold text-primary">{formatQOM(costs.totalEstimated.current)}</p>
                <p className="text-xs text-muted-foreground">{formatUSD(qomToUSD(costs.totalEstimated.current))}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">
                  Cost Range: {formatQOM(costs.totalEstimated.min)} - {formatQOM(costs.totalEstimated.max)}
                </p>
                <p>Actual costs may vary based on network congestion. Unused gas will be refunded.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="origami-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  networkStatus.status === "healthy"
                    ? "bg-green-500"
                    : networkStatus.status === "congested"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <div>
                <p className="font-medium text-sm">QL1 Network Status</p>
                <p className="text-xs text-muted-foreground">
                  {networkStatus.congestion} congestion • {networkStatus.estimatedConfirmationTime}
                </p>
              </div>
            </div>
            <Badge
              className={
                networkStatus.status === "healthy"
                  ? "bg-green-500/10 text-green-500"
                  : networkStatus.status === "congested"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-red-500/10 text-red-500"
              }
            >
              {networkStatus.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {type === "minting" && renderMintingCalculator()}
      {type === "marketplace" && renderMarketplaceCalculator()}
      {type === "collection" && renderCollectionCalculator()}
    </div>
  )
}
