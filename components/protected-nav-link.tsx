"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useWallet } from "@/hooks/use-wallet"
import { WalletConnectModal } from "@/components/wallet-connect-modal"

interface ProtectedNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  requireWallet?: boolean
}

export function ProtectedNavLink({ href, children, className = "", requireWallet = false }: ProtectedNavLinkProps) {
  const { isConnected, isReconnecting } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  // If wallet is not required or user is connected/reconnecting, render normal link
  if (!requireWallet || isConnected || isReconnecting) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  // If wallet is required but user is not connected, show wallet modal on click
  return (
    <>
      <button onClick={() => setShowWalletModal(true)} className={className}>
        {children}
      </button>
      <WalletConnectModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </>
  )
}
