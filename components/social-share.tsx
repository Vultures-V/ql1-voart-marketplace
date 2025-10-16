"use client"

import { useState } from "react"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Twitter, MessageCircle, Copy, ExternalLink } from "@/components/simple-icons"
import { useToast } from "@/hooks/use-toast"

interface SocialShareProps {
  title: string
  url: string
  description?: string
}

export function SocialShare({ title, url, description }: SocialShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const { toast } = useToast()

  const shareOnTwitter = () => {
    const text = `Check out this amazing NFT: ${title}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, "_blank")
    setShowShareMenu(false)
  }

  const shareOnDiscord = () => {
    // Discord doesn't have a direct share URL, so we copy the link
    copyToClipboard()
    toast({
      title: "Link copied!",
      description: "Share it in your Discord server",
    })
    setShowShareMenu(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied to clipboard",
    })
    setShowShareMenu(false)
  }

  const openInNewTab = () => {
    window.open(url, "_blank")
    setShowShareMenu(false)
  }

  return (
    <div className="relative">
      <OrigamiButton variant="outline" size="sm" onClick={() => setShowShareMenu(!showShareMenu)}>
        <Share2 className="w-4 h-4 mr-1" />
        Share
      </OrigamiButton>

      {showShareMenu && (
        <div className="absolute top-full mt-2 right-0 z-50">
          <Card className="origami-card w-48">
            <CardContent className="p-2">
              <div className="space-y-1">
                <button
                  onClick={shareOnTwitter}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Twitter className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Share on Twitter</span>
                </button>

                <button
                  onClick={shareOnDiscord}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm">Share on Discord</span>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Copy Link</span>
                </button>

                <button
                  onClick={openInNewTab}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Open in New Tab</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
