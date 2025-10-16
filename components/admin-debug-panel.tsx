"use client"
import { useWallet } from "@/hooks/use-wallet"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCwIcon } from "@/components/simple-icons"

export function AdminDebugPanel() {
  const { address } = useWallet()

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!address) {
    return null
  }

  return (
    <Card className="origami-card">
      <CardHeader>
        <CardTitle className="text-lg">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-2">
          <p>
            <strong>Address:</strong> {address}
          </p>
        </div>

        <div className="flex gap-2">
          <OrigamiButton variant="secondary" size="sm" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCwIcon className="w-4 h-4" />
            Refresh Page
          </OrigamiButton>
        </div>
      </CardContent>
    </Card>
  )
}
