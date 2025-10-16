import { Card, CardContent } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { UsersIcon, MailIcon, ExternalLinkIcon } from "@/components/simple-icons"
import Image from "next/image"

export function ArtistSpotlight() {
  const artists: any[] = []

  return (
    <section>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4 font-sans">Featured Artists</h2>
        <p className="text-muted-foreground text-lg clay-tablet inline-block px-6 py-3">
          Discover the masters behind our most treasured digital creations
        </p>
      </div>

      {artists.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Featured Artists Yet</h3>
            <p className="text-muted-foreground mb-6">
              Featured artists will be showcased here once they are selected by the community.
            </p>
            <OrigamiButton variant="primary">Browse All Artists</OrigamiButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {artists.map((artist) => (
            <Card key={artist.id} className="origami-card text-center group">
              <CardContent className="p-6">
                <div className="mb-6">
                  <Image
                    src={artist.avatar || "/placeholder.svg"}
                    alt={artist.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-primary/20 group-hover:border-primary transition-colors"
                    sizes="96px"
                    loading="lazy"
                  />
                  <h3 className="text-xl font-semibold text-foreground mb-2 font-sans">{artist.name}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{artist.bio}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-primary">{artist.nfts}</div>
                    <div className="text-muted-foreground">NFTs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-origami-highlight">{artist.followers}</div>
                    <div className="text-muted-foreground">Followers</div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <OrigamiButton variant="primary" className="w-full">
                    View Profile
                  </OrigamiButton>

                  <div className="flex space-x-2">
                    <OrigamiButton
                      variant="secondary"
                      size="sm"
                      className="flex-1 flex items-center justify-center space-x-1"
                    >
                      <MailIcon className="w-4 h-4" />
                      <span>Contact</span>
                    </OrigamiButton>
                    <OrigamiButton
                      variant="secondary"
                      size="sm"
                      className="flex-1 flex items-center justify-center space-x-1"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      <span>Portfolio</span>
                    </OrigamiButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
