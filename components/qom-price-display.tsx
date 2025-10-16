"use client"

import { Badge } from "@/components/ui/badge"
import { formatQOM, formatUSD, qomToUSD } from "@/lib/qom-pricing"
import { TrendingUp } from "@/components/simple-icons"

interface QOMPriceDisplayProps {
  qomAmount: number
  showUSD?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function QOMPriceDisplay({ qomAmount, showUSD = true, size = "md", className = "" }: QOMPriceDisplayProps) {
  const usdAmount = qomToUSD(qomAmount)

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`text-primary ${sizeClasses[size]}`}>{formatQOM(qomAmount)}</div>
      {showUSD && (
        <Badge variant="outline" className="text-xs">
          {formatUSD(usdAmount)}
        </Badge>
      )}
    </div>
  )
}

interface QOMPriceTrendProps {
  currentPrice: number
  previousPrice?: number
  className?: string
}

export function QOMPriceTrend({ currentPrice, previousPrice, className = "" }: QOMPriceTrendProps) {
  if (!previousPrice) return <QOMPriceDisplay qomAmount={currentPrice} className={className} />

  const change = currentPrice - previousPrice
  const changePercent = (change / previousPrice) * 100
  const isPositive = change >= 0

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <QOMPriceDisplay qomAmount={currentPrice} />
      <div className={`flex items-center space-x-1 text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
        <TrendingUp className={`w-3 h-3 ${!isPositive ? "rotate-180" : ""}`} />
        <span>
          {isPositive ? "+" : ""}
          {changePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
