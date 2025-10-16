"use client"

import { useEffect } from "react"
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { TransactionStatus } from "@/hooks/use-contract"

interface TransactionStatusProps {
  status: TransactionStatus
  onClose?: () => void
}

export function TransactionStatusAlert({ status, onClose }: TransactionStatusProps) {
  // Auto-close success messages after 5 seconds
  useEffect(() => {
    if (status.status === "success" && onClose) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [status.status, onClose])

  if (status.status === "idle") return null

  const getStatusConfig = () => {
    switch (status.status) {
      case "pending":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
          title: "Transaction Pending",
          description: "Please confirm the transaction in your wallet",
          variant: "default" as const,
        }
      case "confirming":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
          title: "Transaction Confirming",
          description: "Waiting for blockchain confirmation...",
          variant: "default" as const,
        }
      case "success":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: "Transaction Successful",
          description: "Your transaction has been confirmed on the blockchain",
          variant: "default" as const,
        }
      case "error":
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          title: "Transaction Failed",
          description: status.error || "An error occurred during the transaction",
          variant: "destructive" as const,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Alert variant={config.variant} className="relative">
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription className="mt-1">{config.description}</AlertDescription>
          {status.hash && (
            <div className="mt-2 flex items-center gap-2">
              <a
                href={`https://scan.qom.one/tx/${status.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        )}
      </div>
    </Alert>
  )
}
