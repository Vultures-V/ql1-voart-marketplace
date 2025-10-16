"use client"

import { useState, useEffect } from "react"

// Format price with (n) notation for consecutive zeros
function formatPriceWithZeros(price: number): string {
  if (price >= 0.01) {
    return price.toFixed(4)
  }

  const priceStr = price.toString()
  const decimalIndex = priceStr.indexOf(".")

  if (decimalIndex === -1) return priceStr

  const afterDecimal = priceStr.substring(decimalIndex + 1)
  let zeroCount = 0

  // Count consecutive zeros after decimal
  for (let i = 0; i < afterDecimal.length; i++) {
    if (afterDecimal[i] === "0") {
      zeroCount++
    } else {
      break
    }
  }

  if (zeroCount >= 3) {
    const significantDigits = afterDecimal.substring(zeroCount, zeroCount + 2)
    return `0.(${zeroCount})${significantDigits}`
  }

  return price.toFixed(6)
}

export function QOMPriceCompact() {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPrice = async () => {
    try {
      // Simulate fetching price from API
      await new Promise((resolve) => setTimeout(resolve, 500))
      const mockPrice = 0.000012 + (Math.random() - 0.5) * 0.000002
      setPrice(mockPrice)
    } catch (error) {
      console.error("Failed to fetch QOM price:", error)
      setPrice(0.000012) // Fallback price
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrice()
    const interval = setInterval(fetchPrice, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-xs text-muted-foreground animate-pulse">Loading QOM...</div>
  }

  return (
    <div className="text-xs text-muted-foreground">
      <span className="font-medium">QOM:</span> ${price ? formatPriceWithZeros(price) : "0.00"}
    </div>
  )
}
