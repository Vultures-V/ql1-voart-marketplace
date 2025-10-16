"use client"

import { useState } from "react"
import { TrendingUpIcon } from "@/components/simple-icons"

export function RecentSalesTicker() {
  const [sales] = useState<any[]>([])

  const [isHovered, setIsHovered] = useState(false)

  if (sales.length === 0) {
    return (
      <div className="bg-origami-fold/20 border-y border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-6 text-muted-foreground">
            <TrendingUpIcon className="w-5 h-5" />
            <span className="text-sm">Recent sales will appear here once trading begins</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-origami-fold/20 border-y border-border py-3 overflow-hidden">
      <div className="flex whitespace-nowrap">
        <div
          className={`scroll-ticker flex items-center space-x-8 ${isHovered ? "paused" : ""}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {[...sales, ...sales].map((sale, index) => (
            <div key={`${sale.id}-${index}`} className="flex items-center space-x-2 text-sm">
              <span className="text-foreground font-medium">{sale.name}</span>
              <span className="text-muted-foreground">sold for</span>
              <span className="text-qom-gold font-bold">{sale.price}</span>
              <span className="text-muted-foreground">to</span>
              <span className="text-primary">{sale.buyer}</span>
              <span className="text-muted-foreground">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
