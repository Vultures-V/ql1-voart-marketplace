import type { ComponentType } from "react"

export const createDynamicImport = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType,
) => {
  return {
    Component: importFn,
    fallback: fallback || (() => <div className="animate-pulse bg-muted rounded h-20" />),
  }
}

// Pre-configured dynamic imports for heavy components
export const dynamicComponents = {
  AdminPanel: () => import("../app/admin/page"),
  NFTDetail: () => import("../app/nft/[id]/page"),
  MintPage: () => import("../app/mint/page"),
}
