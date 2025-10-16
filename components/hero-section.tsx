"use client"

import { Button } from "@/components/ui/button"
import { ArrowRightIcon, SparklesIcon } from "@/components/simple-icons"
import Link from "next/link"
import { useEffect, useState } from "react"

export function HeroSection() {
  const [stats, setStats] = useState({
    newlyListed: 0,
    activeListings: 0,
  })

  useEffect(() => {
    const nfts = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")

    // Count NFTs listed in the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const newlyListed = nfts.filter((nft: any) => {
      const createdAt = new Date(nft.createdAt || nft.mintedAt || 0).getTime()
      return createdAt > oneHourAgo
    }).length

    // Count all active listings (not sold, not deleted)
    const activeListings = nfts.filter((nft: any) => !nft.sold && !nft.deleted && nft.listed !== false).length

    setStats({
      newlyListed,
      activeListings,
    })
  }, [])

  return (
    <section className="relative py-16 lg:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl mb-6 text-balance leading-tight">
                <span className="text-blue-500 font-bold tracking-tight">VOART</span>
                <br />
                <span className="text-white font-bold tracking-tight uppercase">Unleash Your Creative</span>
                <br />
                <span className="text-white font-bold tracking-tight uppercase">Legacy</span>
              </h1>

              <p className="text-sm md:text-base text-muted-foreground mb-8 text-pretty leading-loose max-w-2xl font-normal">
                Discover, create, and trade one-of-a-kind NFTs on the QL1 blockchain. Experience the fusion of boundless
                artistic expression and cutting-edge blockchain technology, powered by QOM cryptocurrency. Join a
                vibrant community where creators and collectors shape the future of digital art.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Link href="/marketplace">
                <Button
                  size="lg"
                  className="origami-button neon-glow flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Button>
              </Link>

              <Link href="/mint">
                <Button
                  variant="secondary"
                  size="lg"
                  className="origami-card flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>Create NFT</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="origami-card text-center p-6">
              <div className="text-2xl font-semibold text-primary mb-2">{stats.newlyListed}</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Newly Listed NFTs</div>
            </div>

            <div className="origami-card text-center p-6">
              <div className="text-2xl font-semibold text-qom-gold mb-2">1 Hour</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Live Duration</div>
            </div>

            <div className="origami-card text-center p-6">
              <div className="text-2xl font-semibold text-origami-highlight mb-2">{stats.activeListings}</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Active Listings</div>
            </div>

            <div className="text-center pt-3">
              <p className="text-xs text-muted-foreground/70 font-normal italic tracking-wide">
                Newly listed NFTs remain live for 1 hour
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
