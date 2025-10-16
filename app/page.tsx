import { Suspense } from "react"
import { HeroSection } from "@/components/hero-section"
import { FeaturedNFTs } from "@/components/featured-nfts"
import { PopularCollections } from "@/components/popular-collections"
import { RecentSalesTicker } from "@/components/recent-sales-ticker"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <main>
          <RecentSalesTicker />

          <HeroSection />

          <div className="container mx-auto px-4 py-12 space-y-16">
            <Suspense fallback={<div className="h-64 animate-pulse bg-card rounded-lg" />}>
              <PopularCollections />
            </Suspense>

            <Suspense fallback={<div className="h-64 animate-pulse bg-card rounded-lg" />}>
              <FeaturedNFTs />
            </Suspense>
          </div>
        </main>

        <div className="bg-origami-fold/10 border-y border-border py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-foreground mb-6">Powered by QL1 Blockchain</h3>
              <p className="text-muted-foreground mb-8 font-normal leading-loose">
                All transactions are processed on the QL1 blockchain network using QOM cryptocurrency. Experience fast,
                secure, and low-cost NFT trading.
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <span className="bg-primary/20 text-primary px-4 py-2 rounded-full font-medium tracking-wide">
                  QL1 Network
                </span>
                <span className="bg-qom-gold/20 text-qom-gold px-4 py-2 rounded-full font-medium tracking-wide">
                  QOM Token
                </span>
                <span className="bg-origami-highlight/20 text-origami-highlight px-4 py-2 rounded-full font-medium tracking-wide">
                  Low Fees
                </span>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
