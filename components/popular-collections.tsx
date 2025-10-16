import { Card, CardContent } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { FolderIcon } from "@/components/simple-icons"
import Image from "next/image"

export function PopularCollections() {
  const collections: any[] = []

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">Popular Collections</h2>
        <OrigamiButton variant="secondary">View All</OrigamiButton>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Popular Collections Yet</h3>
            <p className="text-muted-foreground mb-6">
              Popular collections will appear here based on trading volume and community interest.
            </p>
            <OrigamiButton variant="primary">Browse All Collections</OrigamiButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="origami-card group cursor-pointer">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.name}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                  {collection.verified && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      Verified
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2 text-balance">{collection.name}</h3>
                  <p className="text-muted-foreground mb-4 text-pretty">{collection.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Items</div>
                      <div className="font-semibold text-foreground">{collection.items.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Owners</div>
                      <div className="font-semibold text-foreground">{collection.owners}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Floor Price</div>
                      <div className="font-semibold text-qom-gold">{collection.floorPrice}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Volume</div>
                      <div className="font-semibold text-primary">{collection.volume}</div>
                    </div>
                  </div>

                  <OrigamiButton variant="primary" className="w-full">
                    Explore Collection
                  </OrigamiButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
