"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PackageIcon,
  CoinsIcon,
  EyeIcon,
  HeartIcon,
  UsersIcon,
  AwardIcon,
} from "@/components/simple-icons"

const emptyStats = {
  totalCollections: 0,
  totalNFTs: 0,
  tradingVolume: "0 QOM",
  floorPrice: "0 QOM",
  totalViews: 0,
  totalLikes: 0,
  portfolioValue: "0 QOM",
  rank: 0,
  monthlyChange: {
    volume: 0,
    value: 0,
    nfts: 0,
  },
}

export function ProfileStats() {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUpIcon className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDownIcon className="w-4 h-4 text-red-500" />
    )
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500"
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Profile Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Collections */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emptyStats.totalCollections}</div>
              <p className="text-xs text-muted-foreground">Total collections created</p>
            </CardContent>
          </Card>

          {/* Total NFTs */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NFTs</CardTitle>
              <AwardIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emptyStats.totalNFTs}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>+{emptyStats.monthlyChange.nfts} this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Trading Volume */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trading Volume</CardTitle>
              <CoinsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emptyStats.tradingVolume}</div>
              <div className="flex items-center text-xs">
                {getChangeIcon(emptyStats.monthlyChange.volume)}
                <span className={`ml-1 ${getChangeColor(emptyStats.monthlyChange.volume)}`}>
                  {emptyStats.monthlyChange.volume > 0 ? "+" : ""}
                  {emptyStats.monthlyChange.volume}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Floor Price */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Floor Price</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emptyStats.floorPrice}</div>
              <p className="text-xs text-muted-foreground">Lowest NFT price</p>
            </CardContent>
          </Card>

          {/* Portfolio Value */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <CoinsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emptyStats.portfolioValue}</div>
              <div className="flex items-center text-xs">
                {getChangeIcon(emptyStats.monthlyChange.value)}
                <span className={`ml-1 ${getChangeColor(emptyStats.monthlyChange.value)}`}>
                  {emptyStats.monthlyChange.value > 0 ? "+" : ""}
                  {emptyStats.monthlyChange.value}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Views */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <EyeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(emptyStats.totalViews)}</div>
              <p className="text-xs text-muted-foreground">Profile & NFT views</p>
            </CardContent>
          </Card>

          {/* Total Likes */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <HeartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(emptyStats.totalLikes)}</div>
              <p className="text-xs text-muted-foreground">Across all NFTs</p>
            </CardContent>
          </Card>

          {/* Creator Rank */}
          <Card className="origami-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creator Rank</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emptyStats.rank > 0 ? `#${emptyStats.rank}` : "Unranked"}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {emptyStats.rank > 0 ? "Ranked" : "Start creating!"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
