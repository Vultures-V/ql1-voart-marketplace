"use client"

import { useState, useEffect } from "react"
import {
  CoinsIcon,
  Loader2Icon,
  RefreshCwIcon,
  TrendingUpIcon,
  ActivityIcon,
  GlobeIcon,
} from "@/components/simple-icons"
import { Button } from "@/components/ui/button"
import { QL1_NETWORK } from "@/lib/network-config"

// QOM/QUSDT pool contract ABI (only getReserves function needed)
const POOL_ABI = [
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
]

const POOL_ADDRESS = "0xA21d14Fe48f48556f760Fa173aE9Bc3f6a996C5B"
const QL1_RPC_URL = QL1_NETWORK.rpcUrl
const CHAIN_ID = QL1_NETWORK.chainId
const QOM_DECIMALS = 18
const QUSDT_DECIMALS = 6

interface QOMPriceData {
  price: number
  qomReserve: string
  qusdtReserve: string
  lastUpdated: Date
}

export function QOMPriceFetcher() {
  const [priceData, setPriceData] = useState<QOMPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchQOMPrice = async () => {
    try {
      setLoading(true)
      setError(null)

      // Import ethers dynamically to avoid SSR issues
      const { ethers } = await import("ethers")

      // Create provider for QL1 network
      const provider = new ethers.JsonRpcProvider(QL1_RPC_URL, {
        chainId: CHAIN_ID,
        name: "QL1",
      })

      // Create contract instance
      const poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider)

      // Get reserves from the pool
      const reserves = await poolContract.getReserves()

      const qomReserve = ethers.formatUnits(reserves._reserve0, QOM_DECIMALS)
      const qusdtReserve = ethers.formatUnits(reserves._reserve1, QUSDT_DECIMALS)

      console.log("[v0] QOM Reserve:", qomReserve)
      console.log("[v0] QUSDT Reserve:", qusdtReserve)

      // Calculate price: QUSDT reserve / QOM reserve
      const price = Number.parseFloat(qusdtReserve) / Number.parseFloat(qomReserve)

      console.log("[v0] Calculated QOM price:", price)

      if (typeof window !== "undefined") {
        localStorage.setItem("qom_usd_rate", price.toString())
        console.log("[v0] QOM price saved to localStorage:", price)
      }

      setPriceData({
        price,
        qomReserve,
        qusdtReserve,
        lastUpdated: new Date(),
      })

      setLastRefresh(new Date())
    } catch (err) {
      console.error("Error fetching QOM price:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch QOM price")

      const fallbackPrice = 0.0000000116
      if (typeof window !== "undefined") {
        localStorage.setItem("qom_usd_rate", fallbackPrice.toString())
      }

      setPriceData({
        price: fallbackPrice,
        qomReserve: "0",
        qusdtReserve: "0",
        lastUpdated: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQOMPrice()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQOMPrice, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number, decimals = 10) => {
    return num.toFixed(decimals)
  }

  const formatLargeNumber = (numStr: string) => {
    const num = Number.parseFloat(numStr)
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    }
    return num.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Main QOM Price Card - Beautiful modern design */}
      <div className="market-data-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-qom-gold/20 to-qom-gold/10 border border-qom-gold/20">
              <CoinsIcon className="h-5 w-5 text-qom-gold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Live price from Qomswap</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQOMPrice}
            disabled={loading}
            className="market-refresh-button"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading && !priceData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2Icon className="h-5 w-5 animate-spin text-qom-gold" />
              <span className="text-muted-foreground">Fetching live price data...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Price Display */}
            <div className="text-center py-4">
              <div className="market-price-display mb-2">1 QOM = ${formatNumber(priceData?.price || 0)} USD</div>
              <div className="flex items-center justify-center space-x-2">
                <TrendingUpIcon className="h-4 w-4 text-market-success" />
                <span className="text-sm text-market-success font-medium">Live Price</span>
              </div>
            </div>

            {/* Network & Pool Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="market-badge">
                <GlobeIcon className="h-3 w-3 mr-1" />
                QL1 Network
              </div>
              <div className="market-badge">
                <ActivityIcon className="h-3 w-3 mr-1" />
                QOM/QUSDT Pool
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Last updated: {priceData?.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pool Reserves - Modern stat cards */}
      {priceData && Number.parseFloat(priceData.qomReserve) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="market-stat-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">QOM Reserve</h4>
              <div className="w-2 h-2 rounded-full bg-market-info"></div>
            </div>
            <div className="text-xl font-bold text-white mb-1">{formatLargeNumber(priceData.qomReserve)} QOM</div>
            <p className="text-xs text-muted-foreground">Pool Liquidity</p>
          </div>

          <div className="market-stat-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">QUSDT Reserve</h4>
              <div className="w-2 h-2 rounded-full bg-market-warning"></div>
            </div>
            <div className="text-xl font-bold text-white mb-1">{formatLargeNumber(priceData.qusdtReserve)} QUSDT</div>
            <p className="text-xs text-muted-foreground">Pool Liquidity</p>
          </div>
        </div>
      )}

      {/* Network Info Card */}
      <div className="market-network-info">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-qom-gold mb-1">QL1 Blockchain</h4>
            <p className="text-xs text-muted-foreground">Chain ID: {CHAIN_ID}</p>
          </div>
          <div className="text-right">
            <h4 className="font-medium text-qom-gold mb-1">Qomswap DEX</h4>
            <p className="text-xs text-muted-foreground">Decentralized Exchange</p>
          </div>
        </div>
      </div>
    </div>
  )
}
