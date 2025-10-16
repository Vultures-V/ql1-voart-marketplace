"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Settings, Ban, XCircle, Upload, ArrowLeft } from "@/components/simple-icons"
import { useToast } from "@/hooks/use-toast"
import { NFTManager } from "@/lib/nft-management"

interface NFTManagementModalProps {
  nft: any
  userAddress: string
  onUpdate: () => void
  children: React.ReactNode
}

export function NFTManagementModal({ nft, userAddress, onUpdate, children }: NFTManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [transferAddress, setTransferAddress] = useState("")
  const [relistPrice, setRelistPrice] = useState(nft.price || "")
  const [isProcessing, setIsProcessing] = useState(false)

  const { toast } = useToast()

  const handleAction = async (action: string) => {
    setIsProcessing(true)
    let success = false
    let message = ""

    try {
      switch (action) {
        case "delist":
          success = NFTManager.delistNFT(nft.id, userAddress)
          message = success ? "NFT delisted successfully" : "Failed to delist NFT"
          break

        case "relist":
          if (!relistPrice || Number.parseFloat(relistPrice) <= 0) {
            toast({
              title: "Invalid price",
              description: "Please enter a valid price",
              variant: "destructive",
            })
            setIsProcessing(false)
            return
          }
          success = NFTManager.relistNFT(nft.id, userAddress, relistPrice)
          message = success ? "NFT relisted successfully" : "Failed to relist NFT"
          break

        case "hide":
          success = NFTManager.hideNFT(nft.id, userAddress)
          message = success ? "NFT hidden from profile" : "Failed to hide NFT"
          break

        case "unhide":
          success = NFTManager.unhideNFT(nft.id, userAddress)
          message = success ? "NFT unhidden from profile" : "Failed to unhide NFT"
          break

        case "transfer":
          if (!transferAddress || transferAddress.length !== 42 || !transferAddress.startsWith("0x")) {
            toast({
              title: "Invalid address",
              description: "Please enter a valid wallet address",
              variant: "destructive",
            })
            setIsProcessing(false)
            return
          }
          success = NFTManager.transferNFT(nft.id, userAddress, transferAddress)
          message = success ? "NFT transferred successfully" : "Failed to transfer NFT"
          break

        case "burn":
          success = NFTManager.burnNFT(nft.id, userAddress)
          message = success ? "NFT burned permanently" : "Failed to burn NFT"
          break
      }

      toast({
        title: success ? "Success" : "Error",
        description: message,
        variant: success ? "default" : "destructive",
      })

      if (success) {
        onUpdate()
        setIsOpen(false)
        setActiveAction(null)
        setTransferAddress("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const nftStatus = NFTManager.getNFTStatus(nft.id, userAddress)

  const ActionButton = ({
    action,
    icon: Icon,
    label,
    variant = "outline",
    disabled = false,
  }: {
    action: string
    icon: any
    label: string
    variant?: "outline" | "destructive" | "default"
    disabled?: boolean
  }) => (
    <Button
      variant={variant}
      size="sm"
      onClick={() => setActiveAction(action)}
      disabled={disabled || isProcessing}
      className="w-full justify-start"
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )

  const renderActionForm = () => {
    switch (activeAction) {
      case "relist":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="relist-price">New Price (QOM)</Label>
              <Input
                id="relist-price"
                type="number"
                step="0.001"
                min="0"
                value={relistPrice}
                onChange={(e) => setRelistPrice(e.target.value)}
                placeholder="Enter new price"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setActiveAction(null)} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => handleAction("relist")} disabled={isProcessing} className="flex-1">
                {isProcessing ? "Processing..." : "Relist NFT"}
              </Button>
            </div>
          </div>
        )

      case "transfer":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-address">Recipient Address</Label>
              <Input
                id="transfer-address"
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter the wallet address of the recipient. This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setActiveAction(null)} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => handleAction("transfer")} disabled={isProcessing} className="flex-1">
                {isProcessing ? "Processing..." : "Transfer NFT"}
              </Button>
            </div>
          </div>
        )

      case "burn":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Permanent Action</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Burning this NFT will permanently destroy it. This action cannot be undone and the NFT will be lost
                    forever.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setActiveAction(null)} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => handleAction("burn")}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                {isProcessing ? "Processing..." : "Burn NFT"}
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            {/* NFT Status */}
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="flex flex-wrap gap-2">
                {nftStatus.isListed && <Badge variant="default">Listed</Badge>}
                {nftStatus.isHidden && <Badge variant="secondary">Hidden</Badge>}
                {nftStatus.isBurned && <Badge variant="destructive">Burned</Badge>}
                {nftStatus.isTransferred && <Badge variant="outline">Transferred</Badge>}
                {!nftStatus.isListed && !nftStatus.isBurned && !nftStatus.isTransferred && (
                  <Badge variant="outline">Delisted</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Label>Available Actions</Label>

              {/* Listing Actions */}
              {nftStatus.isListed && <ActionButton action="delist" icon={Ban} label="Remove from Sale" />}

              {!nftStatus.isListed && !nftStatus.isBurned && !nftStatus.isTransferred && (
                <ActionButton action="relist" icon={Upload} label="List for Sale" />
              )}

              {/* Visibility Actions */}
              {!nftStatus.isHidden && !nftStatus.isBurned && (
                <ActionButton action="hide" icon={XCircle} label="Hide from Profile" />
              )}

              {nftStatus.isHidden && !nftStatus.isBurned && (
                <ActionButton action="unhide" icon={Upload} label="Show on Profile" />
              )}

              {/* Transfer Action */}
              {!nftStatus.isBurned && !nftStatus.isTransferred && (
                <ActionButton action="transfer" icon={Upload} label="Transfer to Another Wallet" />
              )}

              {/* Burn Action */}
              {!nftStatus.isBurned && (
                <ActionButton action="burn" icon={AlertTriangle} label="Burn NFT (Permanent)" variant="destructive" />
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Manage NFT</span>
          </DialogTitle>
        </DialogHeader>

        {/* NFT Preview */}
        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-xs font-mono">#{nft.id}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{nft.name}</p>
            <p className="text-sm text-muted-foreground">
              {nft.price} {nft.currency}
            </p>
          </div>
        </div>

        {renderActionForm()}
      </DialogContent>
    </Dialog>
  )
}
