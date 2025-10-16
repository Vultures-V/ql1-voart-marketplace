"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  formatQOM,
  formatUSD,
  qomToUSD,
  calculateMintingCost,
  calculateMarketplaceCosts,
  calculateCollectionDeploymentCost,
  getNetworkStatus,
  QL1_DISTRIBUTION_COSTS,
  calculateOptimalGasPrice,
  getQL1Advantages,
  getQOMUSDRateFromQomSwap,
  getPriceSourceInfo,
} from "@/lib/qom-pricing"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getQomSwapAnalytics, getQomSwapTradeURL, QomSwapPriceSubscription } from "@/lib/qomswap-integration"

export default function QOMPricingAdmin() {
  const [qomPrice, setQomPrice] = useState(1700) // Current QOM/USD rate
  const [tempPrice, setTempPrice] = useState("1700")
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus())
  const [optimalGas, setOptimalGas] = useState(calculateOptimalGasPrice())
  const [ql1Advantages] = useState(getQL1Advantages())
  const [priceSource, setPriceSource] = useState(getPriceSourceInfo())
  const [qomSwapAnalytics, setQomSwapAnalytics] = useState<any>(null)
  const [isLiveUpdates, setIsLiveUpdates] = useState(false)
  const [priceSubscription, setPriceSubscription] = useState<QomSwapPriceSubscription | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStatus(getNetworkStatus())
      setOptimalGas(calculateOptimalGasPrice())
      setPriceSource(getPriceSourceInfo())
    }, 30000)

    getQomSwapAnalytics().then(setQomSwapAnalytics)

    return () => clearInterval(interval)
  }, [])

  const handleFetchFromQomSwap = async () => {
    try {
      const newPrice = await getQOMUSDRateFromQomSwap()
      setQomPrice(newPrice)
      setTempPrice(newPrice.toString())
      setPriceSource(getPriceSourceInfo())
    } catch (error) {
      console.error("Failed to fetch price from QomSwap:", error)
    }
  }

  const handleToggleLiveUpdates = () => {
    if (isLiveUpdates) {
      if (priceSubscription) {
        priceSubscription.stop()
        setPriceSubscription(null)
      }
      setIsLiveUpdates(false)
    } else {
      const subscription = new QomSwapPriceSubscription((priceData) => {
        setQomPrice(priceData.priceUSD)
        setTempPrice(priceData.priceUSD.toString())
        setPriceSource(getPriceSourceInfo())
      })
      subscription.start()
      setPriceSubscription(subscription)
      setIsLiveUpdates(true)
    }
  }

  const handleUpdatePrice = () => {
    const newPrice = Number.parseFloat(tempPrice)
    if (newPrice > 0) {
      setQomPrice(newPrice)
      localStorage.setItem("qom_usd_rate", newPrice.toString())
      localStorage.setItem("qom_price_source", "manual")
      localStorage.setItem("qom_price_updated", new Date().toISOString())
      setPriceSource(getPriceSourceInfo())
    }
  }

  const mintingCosts = calculateMintingCost(1)
  const marketplaceCosts = calculateMarketplaceCosts(100) // Example: 100 QOM sale
  const deploymentCosts = calculateCollectionDeploymentCost()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QOM Pricing Administration</h1>
          <p className="text-muted-foreground">Manage QOM exchange rates and view cost calculations for QL1 chain</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={networkStatus.status === "healthy" ? "default" : "destructive"}>
            Network: {networkStatus.status}
          </Badge>
          <Badge variant="outline">QL1 Chain</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QL1 Chain Advantages</CardTitle>
          <CardDescription>
            {networkStatus.chainInfo.name} - {networkStatus.chainInfo.type}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Speed</h4>
              <p className="text-sm text-muted-foreground">{ql1Advantages.speed}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Cost</h4>
              <p className="text-sm text-muted-foreground">{ql1Advantages.cost}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Compatibility</h4>
              <p className="text-sm text-muted-foreground">{ql1Advantages.compatibility}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Interoperability</h4>
              <p className="text-sm text-muted-foreground">{ql1Advantages.interoperability}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current QOM Price</CardTitle>
            <CardDescription>{priceSource.isLive ? "Live from QomSwap" : "Manual entry"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(qomPrice)}</div>
            <p className="text-sm text-muted-foreground">per QOM</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Source: {priceSource.source}
              {priceSource.lastUpdated && <div>Updated: {new Date(priceSource.lastUpdated).toLocaleTimeString()}</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Status</CardTitle>
            <CardDescription>QL1 chain congestion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Congestion:</span>
                <Badge variant="outline">{networkStatus.congestion}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Avg Gas:</span>
                <span>{formatQOM(networkStatus.avgGasPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmation:</span>
                <span className="text-sm">{networkStatus.estimatedConfirmationTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update QOM Price</CardTitle>
            <CardDescription>Set new exchange rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="price">QOM/USD Rate</Label>
              <Input
                id="price"
                type="number"
                value={tempPrice}
                onChange={(e) => setTempPrice(e.target.value)}
                placeholder="Enter USD price per QOM"
              />
            </div>
            <Button onClick={handleUpdatePrice} className="w-full">
              Update Price
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimal Gas Pricing</CardTitle>
            <CardDescription>QL1 gas price recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Recommended:</span>
                <span>{formatQOM(optimalGas.recommended)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fast:</span>
                <span>{formatQOM(optimalGas.fast)}</span>
              </div>
              <div className="flex justify-between">
                <span>Instant:</span>
                <span>{formatQOM(optimalGas.instant)}</span>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <div>vs Ethereum: {optimalGas.savings.vsEthereum} cheaper</div>
                <div>vs Polygon: {optimalGas.savings.vsPolygon} cheaper</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QomSwap Integration</CardTitle>
            <CardDescription>Live price from DEX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleFetchFromQomSwap} variant="outline" size="sm" className="w-full bg-transparent">
              Fetch from QomSwap
            </Button>
            <Button
              onClick={handleToggleLiveUpdates}
              variant={isLiveUpdates ? "destructive" : "default"}
              size="sm"
              className="w-full"
            >
              {isLiveUpdates ? "Stop Live Updates" : "Start Live Updates"}
            </Button>
            <div className="text-xs text-center">
              <a
                href={getQomSwapTradeURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Trade on QomSwap →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {qomSwapAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>QomSwap Analytics</CardTitle>
            <CardDescription>DEX performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold">{formatUSD(qomSwapAnalytics.totalValueLocked)}</div>
                <div className="text-sm text-muted-foreground">TVL</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatUSD(qomSwapAnalytics.volume24h)}</div>
                <div className="text-sm text-muted-foreground">24h Volume</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatUSD(qomSwapAnalytics.fees24h)}</div>
                <div className="text-sm text-muted-foreground">24h Fees</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{qomSwapAnalytics.transactions24h.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">24h Txns</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{qomSwapAnalytics.uniqueUsers24h.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">24h Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">QL1 Distribution Costs</TabsTrigger>
          <TabsTrigger value="minting">Minting Costs</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace Costs</TabsTrigger>
          <TabsTrigger value="deployment">Collection Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>QL1 Distribution Costs</CardTitle>
              <CardDescription>Official QL1 chain distribution cost structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Contract Distribution:</span>
                    <div className="text-right">
                      <div>{formatQOM(QL1_DISTRIBUTION_COSTS.contractDistribution)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatUSD(qomToUSD(QL1_DISTRIBUTION_COSTS.contractDistribution))}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Initial Installation:</span>
                    <div className="text-right">
                      <div>{formatQOM(QL1_DISTRIBUTION_COSTS.initialInstallation)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatUSD(qomToUSD(QL1_DISTRIBUTION_COSTS.initialInstallation))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Estimated (Min):</span>
                    <div className="text-right">
                      <div>{formatQOM(QL1_DISTRIBUTION_COSTS.totalEstimatedMin)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatUSD(qomToUSD(QL1_DISTRIBUTION_COSTS.totalEstimatedMin))}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Estimated (Max):</span>
                    <div className="text-right">
                      <div>{formatQOM(QL1_DISTRIBUTION_COSTS.totalEstimatedMax)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatUSD(qomToUSD(QL1_DISTRIBUTION_COSTS.totalEstimatedMax))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Actual costs may vary depending on network congestion. Unused gas will be
                  refunded automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minting">
          <Card>
            <CardHeader>
              <CardTitle>NFT Minting Costs</CardTitle>
              <CardDescription>Cost breakdown for minting NFTs on QL1</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Base Costs</h4>
                  <div className="flex justify-between">
                    <span>Per NFT:</span>
                    <span>{formatQOM(mintingCosts.breakdown.perNFT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>{formatQOM(mintingCosts.breakdown.platformFee)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Gas Estimates</h4>
                  <div className="flex justify-between">
                    <span>Low:</span>
                    <span>{formatQOM(mintingCosts.gasCost.low)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard:</span>
                    <span>{formatQOM(mintingCosts.gasCost.standard)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High:</span>
                    <span>{formatQOM(mintingCosts.gasCost.high)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Current Total:</span>
                    <div className="text-right">
                      <div>{formatQOM(mintingCosts.totalCost.current)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatUSD(qomToUSD(mintingCosts.totalCost.current))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Transaction Costs</CardTitle>
              <CardDescription>Fees for buying/selling NFTs (example: 100 QOM sale)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Sale Price:</span>
                  <span>{formatQOM(marketplaceCosts.salePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketplace Fee (2.5%):</span>
                  <span>{formatQOM(marketplaceCosts.marketplaceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Royalty Fee (10%):</span>
                  <span>{formatQOM(marketplaceCosts.royaltyFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Fee:</span>
                  <span>{formatQOM(marketplaceCosts.gasCost.current)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Creator Net Earnings:</span>
                  <div className="text-right">
                    <div>{formatQOM(marketplaceCosts.netEarnings)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatUSD(qomToUSD(marketplaceCosts.netEarnings))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle>Collection Deployment Costs</CardTitle>
              <CardDescription>Cost to deploy new NFT collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Contract Deployment:</span>
                  <span>{formatQOM(deploymentCosts.contractDeployment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Initial Setup:</span>
                  <span>{formatQOM(deploymentCosts.initialSetup)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Fee:</span>
                  <span>{formatQOM(deploymentCosts.gasCost.current)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Cost:</span>
                  <div className="text-right">
                    <div>{formatQOM(deploymentCosts.totalEstimated.current)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatUSD(qomToUSD(deploymentCosts.totalEstimated.current))}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Range: {formatQOM(deploymentCosts.totalEstimated.min)} -{" "}
                  {formatQOM(deploymentCosts.totalEstimated.max)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
