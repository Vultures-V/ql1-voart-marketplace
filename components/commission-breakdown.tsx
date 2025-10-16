"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Info, DollarSign, TrendingUp, Zap } from "@/components/simple-icons"
import { calculateCommissionBreakdown, formatCommissionDisplay, getCommissionRates } from "@/lib/commission-system"

interface CommissionBreakdownProps {
  salePrice: number
  buyerAddress?: string
  sellerAddress?: string
  viewType: "buyer" | "seller" | "platform"
  className?: string
}

export function CommissionBreakdown({
  salePrice,
  buyerAddress = "0x0000000000000000000000000000000000000000",
  sellerAddress = "0x0000000000000000000000000000000000000000",
  viewType,
  className = "",
}: CommissionBreakdownProps) {
  const breakdown = calculateCommissionBreakdown(salePrice, buyerAddress, sellerAddress)
  const display = formatCommissionDisplay(breakdown)
  const rates = getCommissionRates()

  const renderBuyerView = () => (
    <Card className={`origami-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Purchase Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Item Price</span>
            <span className="font-medium">{display.buyerView.itemPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Buyer Commission ({rates.buyer})</span>
            <span className="font-medium text-red-500">+{display.buyerView.commission}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network Gas Fee</span>
            <span className="font-medium text-red-500">+{display.buyerView.gasFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Payment</span>
            <div className="text-right">
              <p className="font-bold text-primary">{display.buyerView.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Commission Structure</p>
              <p>3% buyer commission helps maintain platform quality and security</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSellerView = () => (
    <Card className={`origami-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Earnings Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Sale Price</span>
            <span className="font-medium">{display.sellerView.salePrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Seller Commission ({rates.seller})</span>
            <span className="font-medium text-red-500">-{display.sellerView.commission}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Platform Donation ({rates.platform})</span>
            <span className="font-medium text-red-500">-{display.sellerView.platformFee}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network Gas Fee</span>
            <span className="font-medium text-red-500">-{display.sellerView.gasFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">Net Earnings</span>
            <div className="text-right">
              <p className="font-bold text-green-500">{display.sellerView.netEarnings}</p>
              <p className="text-xs text-muted-foreground">
                {(((breakdown.sellerNetEarnings - breakdown.gasFee) / breakdown.salePrice) * 100).toFixed(1)}% of sale
                price
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 border rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">Fee Breakdown</p>
              <p>
                Total deductions:{" "}
                {(
                  ((breakdown.sellerCommission + breakdown.platformFee + breakdown.gasFee) / breakdown.salePrice) *
                  100
                ).toFixed(1)}
                % (3% commission + 1% donation + gas)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPlatformView = () => (
    <Card className={`origami-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Platform Revenue</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Commission Revenue</span>
            <span className="font-medium">{display.platformView.fromCommissions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Platform Donation Revenue</span>
            <span className="font-medium">{display.platformView.fromPlatformFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Platform Earnings</span>
            <div className="text-right">
              <p className="font-bold text-primary">{display.platformView.netEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Revenue Distribution</p>
            <p>
              Commissions: {rates.buyer} + {rates.seller} ={" "}
              {(Number.parseFloat(rates.buyer) + Number.parseFloat(rates.seller)).toFixed(1)}%
            </p>
            <p>Platform Donation: {rates.platform}</p>
            <p>All earnings go to admin budget</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  switch (viewType) {
    case "buyer":
      return renderBuyerView()
    case "seller":
      return renderSellerView()
    case "platform":
      return renderPlatformView()
    default:
      return renderBuyerView()
  }
}
