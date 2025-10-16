// QL1 Network Configuration
export const QL1_NETWORK = {
  chainId: 766,
  chainIdHex: "0x2FE",
  name: "QL1 Network",
  rpcUrl: "https://rpc.qom.one",
  blockExplorerUrl: "https://scan.qom.one",
  nativeCurrency: {
    name: "QOM",
    symbol: "QOM",
    decimals: 18,
  },
  qomTokenAddress: "0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0",
  qomSwapPoolAddress: "0xA21d14Fe48f48556f760Fa173aE9Bc3f6a996C5B",
  betaNftContract: "0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
}

// Helper function to get block explorer URL for address
export function getExplorerAddressUrl(address: string): string {
  return `${QL1_NETWORK.blockExplorerUrl}/address/${address}`
}

// Helper function to get block explorer URL for transaction
export function getExplorerTxUrl(txHash: string): string {
  return `${QL1_NETWORK.blockExplorerUrl}/tx/${txHash}`
}

// Helper function to format chain ID for wallet requests
export function getChainIdHex(): string {
  return QL1_NETWORK.chainIdHex
}

// Validate if connected to correct network
export function isQL1Network(chainId: number | null): boolean {
  return chainId === QL1_NETWORK.chainId
}
