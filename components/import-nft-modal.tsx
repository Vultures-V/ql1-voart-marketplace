"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, RefreshCw } from "@/components/simple-icons"
import { useBlockchainNFTs } from "@/hooks/use-blockchain-nfts"

interface ImportNFTModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportNFTModal({ open, onOpenChange }: ImportNFTModalProps) {
  const [contractAddress, setContractAddress] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const { knownContracts, addContract, removeContract, refresh, isLoading } = useBlockchainNFTs()

  const handleAddContract = () => {
    setAddError(null)
    const success = addContract(contractAddress)
    if (success) {
      setContractAddress("")
      // Trigger refresh to fetch NFTs from new contract
      setTimeout(() => refresh(), 500)
    } else {
      setAddError("Failed to add contract. Please check the address.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import NFTs from QL1 Chain</DialogTitle>
          <DialogDescription>
            Add NFT contract addresses to import your existing NFTs from the QL1 blockchain. Your NFTs will appear in
            the "Owned" tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add Contract Section */}
          <div className="space-y-3">
            <Label htmlFor="contract-address">NFT Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="contract-address"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddContract} disabled={!contractAddress || isLoading}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {addError && (
              <Alert variant="destructive">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Known Contracts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Known Contracts ({knownContracts.length})</Label>
              <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {knownContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No contracts added yet. Add a contract address above to import your NFTs.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {knownContracts.map((contract) => (
                  <div
                    key={contract}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <code className="text-xs font-mono">{contract}</code>
                    <Button variant="ghost" size="sm" onClick={() => removeContract(contract)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertDescription className="text-xs">
              Only ERC-721 compliant contracts are supported. Make sure the contract implements the standard
              tokenOfOwnerByIndex and tokenURI functions.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
