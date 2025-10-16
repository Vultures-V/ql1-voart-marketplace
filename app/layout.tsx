import type React from "react"
import type { Metadata } from "next"
import { Cinzel } from "next/font/google"
import { Navigation } from "@/components/navigation"
import { WalletProvider } from "@/hooks/use-wallet"
import { Toaster } from "@/components/ui/toaster"
import { BetaAccessGuard } from "@/components/beta-access-guard"
import "./globals.css"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "VOart NFT Marketplace - Your Digital Art Destination",
  description:
    "Discover, create, and trade unique NFTs on the QL1 blockchain. Experience the future of digital art with blockchain technology and QOM cryptocurrency.",
  keywords: ["NFT", "marketplace", "digital art", "blockchain", "QOM", "cryptocurrency", "VOart"],
  authors: [{ name: "VOart Team" }],
  creator: "VOart NFT Marketplace",
  publisher: "VOart",
  robots: "index, follow",
  manifest: "/manifest.json",
  applicationName: "VOart NFT Marketplace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://origami-nft.vercel.app",
    title: "VOart NFT Marketplace - Your Digital Art Destination",
    description: "Discover, create, and trade unique NFTs on the QL1 blockchain.",
    siteName: "VOart NFT Marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOart NFT Marketplace - Your Digital Art Destination",
    description: "Discover, create, and trade unique NFTs on the QL1 blockchain.",
    creator: "@VVOARTposta",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased ${cinzel.variable}`}>
        <WalletProvider>
          <BetaAccessGuard>
            <Navigation />
            {children}
            <Toaster />
          </BetaAccessGuard>
        </WalletProvider>
      </body>
    </html>
  )
}
