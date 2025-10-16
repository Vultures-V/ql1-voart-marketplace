import Link from "next/link"
import { OrigamiCraneIcon } from "@/components/origami-crane-icon"
import { TwitterIcon, InstagramIcon, MessageCircleIcon, MailIcon } from "@/components/simple-icons"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <OrigamiCraneIcon className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-origami-highlight bg-clip-text text-transparent">
                VOart
              </span>
            </div>
            <p className="text-muted-foreground mb-6 text-pretty max-w-md">
              The premier NFT marketplace on the QL1 blockchain. Where creativity meets cutting-edge blockchain
              technology with QOM cryptocurrency.
            </p>
            <div className="flex space-x-4">
              <Link href="https://x.com/VVOART" className="text-muted-foreground hover:text-primary transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircleIcon className="w-5 h-5" />
              </Link>
              <Link
                href="mailto:Venturesvone@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <MailIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse NFTs
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-muted-foreground hover:text-primary transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/artists" className="text-muted-foreground hover:text-primary transition-colors">
                  Artists
                </Link>
              </li>
              <li>
                <Link href="/trending" className="text-muted-foreground hover:text-primary transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Create</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mint" className="text-muted-foreground hover:text-primary transition-colors">
                  Mint NFT
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2025 VOart Marketplace. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
