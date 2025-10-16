"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OrigamiCraneIcon } from "@/components/origami-crane-icon"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { ProtectedNavLink } from "@/components/protected-nav-link"
import { useWallet } from "@/hooks/use-wallet"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import { SearchIcon, MenuIcon, XIcon, UserIcon } from "@/components/simple-icons"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const { isConnected } = useWallet()

  const handleProtectedClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      e.preventDefault()
      setShowWalletModal(true)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <OrigamiCraneIcon className="w-8 h-8 text-primary group-hover:text-primary/80 transition-all duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold font-sans bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent drop-shadow-sm">
              VOart
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/marketplace"
              className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
            >
              Marketplace
            </Link>
            <ProtectedNavLink
              href="/mint"
              requireWallet={true}
              className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
            >
              Mint
            </ProtectedNavLink>
            <ProtectedNavLink
              href="/create-collection"
              requireWallet={true}
              className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
            >
              Create Collection
            </ProtectedNavLink>
            <ProtectedNavLink
              href="/collections"
              requireWallet={true}
              className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
            >
              Collections
            </ProtectedNavLink>
            <ProtectedNavLink
              href="/artists"
              requireWallet={true}
              className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
            >
              Artists
            </ProtectedNavLink>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
              <input
                id="nft-search"
                name="search"
                type="text"
                placeholder="Search NFTs, collections..."
                className="nav-search-input pl-10 pr-4 py-2 rounded-lg focus:outline-none w-64 transition-all duration-300"
              />
            </div>

            <WalletConnectButton />

            {isConnected ? (
              <ProtectedNavLink
                href="/profile"
                requireWallet={true}
                className="origami-card hover:scale-105 transition-all duration-300 p-2 rounded-lg"
              >
                <UserIcon className="w-4 h-4" />
              </ProtectedNavLink>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="origami-card hover:scale-105 transition-all duration-300"
                onClick={handleProtectedClick}
              >
                <UserIcon className="w-4 h-4" />
              </Button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-110 rounded-lg hover:bg-accent/20"
          >
            {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 bg-background/95 backdrop-blur-sm rounded-b-lg">
            <div className="flex flex-col space-y-4">
              <Link
                href="/marketplace"
                className="text-foreground hover:text-primary transition-all duration-300 font-medium px-2 py-1 rounded hover:bg-accent/20"
              >
                Marketplace
              </Link>
              <ProtectedNavLink
                href="/mint"
                requireWallet={true}
                className="text-foreground hover:text-primary transition-all duration-300 font-medium px-2 py-1 rounded hover:bg-accent/20"
              >
                Mint
              </ProtectedNavLink>
              <ProtectedNavLink
                href="/create-collection"
                requireWallet={true}
                className="text-foreground hover:text-primary transition-all duration-300 font-medium px-2 py-1 rounded hover:bg-accent/20"
              >
                Create Collection
              </ProtectedNavLink>
              <ProtectedNavLink
                href="/collections"
                requireWallet={true}
                className="text-foreground hover:text-primary transition-all duration-300 font-medium px-2 py-1 rounded hover:bg-accent/20"
              >
                Collections
              </ProtectedNavLink>
              <ProtectedNavLink
                href="/artists"
                requireWallet={true}
                className="text-foreground hover:text-primary transition-all duration-300 font-medium px-2 py-1 rounded hover:bg-accent/20"
              >
                Artists
              </ProtectedNavLink>

              <ProtectedNavLink
                href="/profile"
                requireWallet={true}
                className="text-foreground hover:text-primary transition-all duration-300 font-medium px-2 py-1 rounded hover:bg-accent/20"
              >
                Profile
              </ProtectedNavLink>

              <div className="pt-2">
                <WalletConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>

      <WalletConnectModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </nav>
  )
}
