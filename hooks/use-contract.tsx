"use client"

import { useState, useCallback } from "react"
import { ethers, type Contract } from "ethers"
import { useWallet } from "./use-wallet"
import { useToast } from "./use-toast"

export interface TransactionStatus {
  status: "idle" | "pending" | "confirming" | "success" | "error"
  hash?: string
  error?: string
}

export function useContract(contractAddress: string, abi: any[]) {
  const { signer, provider, address } = useWallet()
  const { toast } = useToast()
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ status: "idle" })

  // Get contract instance for reading
  const getReadContract = useCallback((): Contract | null => {
    if (!provider || !contractAddress) return null
    return new ethers.Contract(contractAddress, abi, provider)
  }, [provider, contractAddress, abi])

  // Get contract instance for writing
  const getWriteContract = useCallback((): Contract | null => {
    if (!signer || !contractAddress) return null
    return new ethers.Contract(contractAddress, abi, signer)
  }, [signer, contractAddress, abi])

  // Execute a read-only contract call
  const read = useCallback(
    async <T,>(method: string, ...args: any[]): Promise<T | null> => {
      const contract = getReadContract()
      if (!contract) {
        console.error("[v0] No contract available for reading")
        return null
      }

      try {
        console.log(`[v0] Reading ${method} from contract`, contractAddress)
        const result = await contract[method](...args)
        console.log(`[v0] Read result:`, result)
        return result as T
      } catch (error: any) {
        console.error(`[v0] Error reading ${method}:`, error)
        toast({
          title: "Read Error",
          description: error.message || `Failed to read ${method}`,
          variant: "destructive",
        })
        return null
      }
    },
    [getReadContract, contractAddress, toast],
  )

  // Execute a write contract transaction
  const write = useCallback(
    async (method: string, ...args: any[]): Promise<ethers.TransactionReceipt | null> => {
      const contract = getWriteContract()
      if (!contract) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to perform this action",
          variant: "destructive",
        })
        return null
      }

      try {
        console.log(`[v0] Executing ${method} on contract`, contractAddress, "with args:", args)
        setTxStatus({ status: "pending" })

        toast({
          title: "Transaction Pending",
          description: "Please confirm the transaction in your wallet",
        })

        const tx = await contract[method](...args)
        console.log("[v0] Transaction sent:", tx.hash)

        setTxStatus({ status: "confirming", hash: tx.hash })

        toast({
          title: "Transaction Submitted",
          description: `Transaction hash: ${tx.hash.slice(0, 10)}...`,
        })

        const receipt = await tx.wait()
        console.log("[v0] Transaction confirmed:", receipt)

        setTxStatus({ status: "success", hash: tx.hash })

        toast({
          title: "Transaction Successful",
          description: `${method} completed successfully`,
        })

        return receipt
      } catch (error: any) {
        console.error(`[v0] Error executing ${method}:`, error)

        let errorMessage = error.message || `Failed to execute ${method}`

        // Parse common error messages
        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
          errorMessage = "Transaction rejected by user"
        } else if (error.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction"
        } else if (error.message?.includes("user rejected")) {
          errorMessage = "Transaction rejected by user"
        }

        setTxStatus({ status: "error", error: errorMessage })

        toast({
          title: "Transaction Failed",
          description: errorMessage,
          variant: "destructive",
        })

        return null
      }
    },
    [getWriteContract, contractAddress, toast],
  )

  // Listen to contract events
  const listen = useCallback(
    (eventName: string, callback: (...args: any[]) => void) => {
      const contract = getReadContract()
      if (!contract) return () => {}

      console.log(`[v0] Listening to ${eventName} event on contract`, contractAddress)
      contract.on(eventName, callback)

      // Return cleanup function
      return () => {
        console.log(`[v0] Removing listener for ${eventName}`)
        contract.off(eventName, callback)
      }
    },
    [getReadContract, contractAddress],
  )

  // Reset transaction status
  const resetTxStatus = useCallback(() => {
    setTxStatus({ status: "idle" })
  }, [])

  return {
    read,
    write,
    listen,
    txStatus,
    resetTxStatus,
    contract: getReadContract(),
    isConnected: !!address,
  }
}
