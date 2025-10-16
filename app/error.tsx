"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircleIcon, RefreshCwIcon } from "@/components/simple-icons"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[v0] Error boundary caught:", error)
  }, [error])

  const handleRefresh = () => {
    // Clear any cached data
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md border-destructive/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircleIcon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Application Error</CardTitle>
          <CardDescription className="text-base">Something went wrong</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try refreshing the page."}
          </p>
          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" className="flex-1 bg-transparent">
              Try Again
            </Button>
            <Button onClick={handleRefresh} className="flex-1 flex items-center gap-2">
              <RefreshCwIcon className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
