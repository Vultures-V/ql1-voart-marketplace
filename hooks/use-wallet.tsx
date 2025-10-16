"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { ethers } from "ethers"
import { useToast } from "./use-toast"
import { QL1_NETWORK } from "@/lib/network-config"

// Wallet types and interfaces
export interface WalletInfo {
  name: string
  icon: string
  installed: boolean
  connector: () => Promise<any>
  isWalletConnect?: boolean
}

export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string | null
  walletName: string | null
  qomBalance: string | null
  qomBalanceUSD: string | null
}

interface WalletContextType extends WalletState {
  availableWallets: WalletInfo[]
  connectWallet: (walletName: string) => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<void>
  isConnecting: boolean
  isReconnecting: boolean
  error: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const detectWallets = (): WalletInfo[] => {
  const wallets: WalletInfo[] = []

  // MetaMask detection
  if (typeof window !== "undefined") {
    const ethereum = (window as any).ethereum

    // MetaMask
    if (ethereum?.isMetaMask) {
      wallets.push({
        name: "MetaMask",
        icon: "🦊",
        installed: true,
        connector: async () => ethereum,
      })
    }

    // Trust Wallet
    if (ethereum?.isTrust) {
      wallets.push({
        name: "Trust Wallet",
        icon: "🛡️",
        installed: true,
        connector: async () => ethereum,
      })
    }

    // Coinbase Wallet
    if (ethereum?.isCoinbaseWallet || ethereum?.selectedProvider?.isCoinbaseWallet) {
      wallets.push({
        name: "Coinbase Wallet",
        icon: "🔵",
        installed: true,
        connector: async () => ethereum,
      })
    }

    // Generic Ethereum provider (fallback)
    if (ethereum && wallets.length === 0) {
      wallets.push({
        name: "Ethereum Wallet",
        icon: "⚡",
        installed: true,
        connector: async () => ethereum,
      })
    }
  }

  wallets.push({
    name: "WalletConnect",
    icon: "🔗",
    installed: true,
    isWalletConnect: true,
    connector: async () => {
      // Create a mock WalletConnect provider for demonstration
      // In a real implementation, you would use @walletconnect/ethereum-provider
      return {
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          if (method === "eth_requestAccounts") {
            // Simulate WalletConnect connection flow
            return new Promise((resolve, reject) => {
              // Show QR code modal or deep link
              const confirmed = window.confirm(
                "WalletConnect: This will open your mobile wallet app or show a QR code to scan. Continue?",
              )
              if (confirmed) {
                reject(
                  new Error("WalletConnect requires actual wallet connection. Please use a browser wallet extension."),
                )
              } else {
                reject(new Error("User cancelled WalletConnect"))
              }
            })
          }
          if (method === "eth_chainId") {
            return QL1_NETWORK.chainIdHex
          }
          if (method === "eth_getBalance") {
            return "0x1bc16d674ec80000" // 2 ETH in wei
          }
          if (method === "wallet_switchEthereumChain") {
            return null
          }
          throw new Error(`Unsupported method: ${method}`)
        },
        on: (event: string, handler: Function) => {
          console.log(`[v0] WalletConnect event listener added for: ${event}`)
        },
        removeListener: (event: string, handler: Function) => {
          console.log(`[v0] WalletConnect event listener removed for: ${event}`)
        },
      }
    },
  })

  // Add uninstalled wallet options
  const installedNames = wallets.map((w) => w.name)

  if (!installedNames.includes("MetaMask")) {
    wallets.push({
      name: "MetaMask",
      icon: "🦊",
      installed: false,
      connector: async () => {
        throw new Error("MetaMask not installed")
      },
    })
  }

  if (!installedNames.includes("Trust Wallet")) {
    wallets.push({
      name: "Trust Wallet",
      icon: "🛡️",
      installed: false,
      connector: async () => {
        throw new Error("Trust Wallet not installed")
      },
    })
  }

  if (!installedNames.includes("Coinbase Wallet")) {
    wallets.push({
      name: "Coinbase Wallet",
      icon: "🔵",
      installed: false,
      connector: async () => {
        throw new Error("Coinbase Wallet not installed")
      },
    })
  }

  return wallets
}

const APP_VERSION = "1.0.0" // Increment this version when deploying updates

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    walletName: null,
    qomBalance: null,
    qomBalanceUSD: null,
  })

  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const wallets = detectWallets()
    setAvailableWallets(wallets)

    // Auto-reconnect is already disabled, so no need to clear storage
  }, [])

  const connectWalletInternal = async (wallet: WalletInfo, walletName: string) => {
    if (isConnecting || walletState.isConnected) {
      console.log("[v0] Connection already in progress or wallet already connected")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      console.log("[v0] Starting wallet connection for:", walletName)

      if (!wallet.installed) {
        throw new Error(`${walletName} is not installed. Please install it first.`)
      }

      const ethereumProvider = await wallet.connector()
      console.log("[v0] Provider obtained:", !!ethereumProvider)

      if (wallet.isWalletConnect) {
        toast({
          title: "Connecting via WalletConnect",
          description: "Please check your mobile wallet or scan the QR code",
        })
      }

      console.log("[v0] Requesting account access...")
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      })
      console.log("[v0] Accounts received:", accounts)

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }

      console.log("[v0] Getting chain ID...")
      const chainId = await ethereumProvider.request({
        method: "eth_chainId",
      })
      console.log("[v0] Chain ID:", chainId, "Decimal:", Number.parseInt(chainId, 16))

      const currentChainId = Number.parseInt(chainId, 16)
      if (currentChainId !== QL1_NETWORK.chainId) {
        console.log("[v0] Not on QL1 Network, attempting to switch...")
        try {
          await ethereumProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: QL1_NETWORK.chainIdHex }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            console.log("[v0] QL1 Network not found, adding it...")
            await ethereumProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: QL1_NETWORK.chainIdHex,
                  chainName: QL1_NETWORK.name,
                  nativeCurrency: QL1_NETWORK.nativeCurrency,
                  rpcUrls: [QL1_NETWORK.rpcUrl],
                  blockExplorerUrls: [QL1_NETWORK.blockExplorerUrl],
                },
              ],
            })
            console.log("[v0] QL1 Network added successfully")
          } else {
            console.log("[v0] Network switch failed:", switchError.message)
            throw new Error("Please switch to QL1 Network manually in your wallet")
          }
        }

        const newChainId = await ethereumProvider.request({ method: "eth_chainId" })
        console.log("[v0] New chain ID after switch:", newChainId)
      }

      console.log("[v0] Getting balance...")
      const balance = await ethereumProvider.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })

      const balanceInEth = Number.parseInt(balance, 16) / Math.pow(10, 18)
      console.log("[v0] Balance:", balanceInEth, "QOM")

      const ethersProvider = new ethers.BrowserProvider(ethereumProvider)
      const ethersSigner = await ethersProvider.getSigner()
      setProvider(ethersProvider)
      setSigner(ethersSigner)

      const { qomBalance, qomBalanceUSD } = await fetchQOMBalance(accounts[0], ethersProvider)
      console.log("[v0] QOM Token Balance:", qomBalance, "QOM ($", qomBalanceUSD, ")")

      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId: QL1_NETWORK.chainId,
        balance: balanceInEth.toFixed(4),
        walletName,
        qomBalance,
        qomBalanceUSD,
      })

      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletName} on QL1 Network`,
      })

      if (!wallet.isWalletConnect) {
        ethereumProvider.on("accountsChanged", (accounts: string[]) => {
          console.log("[v0] Accounts changed:", accounts)
          if (accounts.length === 0) {
            disconnectWallet()
          } else {
            disconnectWallet()
            toast({
              title: "Account Changed",
              description: "Please reconnect your wallet with the new account",
            })
          }
        })

        ethereumProvider.on("chainChanged", (chainId: string) => {
          console.log("[v0] Chain changed:", chainId)
          const newChainId = Number.parseInt(chainId, 16)
          setWalletState((prev) => ({ ...prev, chainId: newChainId }))

          if (newChainId !== QL1_NETWORK.chainId) {
            toast({
              title: "Network Changed",
              description: "You've switched away from QL1 Network. Some features may not work correctly.",
              variant: "destructive",
            })
          }
        })
      }
    } catch (err: any) {
      console.log("[v0] Wallet connection failed:", err.message)
      let errorMessage = "Failed to connect wallet"

      if (err.code === 4001) {
        errorMessage = "Connection request was rejected. Please try again."
      } else if (err.code === -32002) {
        errorMessage = "Connection request is already pending. Please check your wallet."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })

      throw err
    } finally {
      setIsConnecting(false)
    }
  }

  const connectWallet = async (walletName: string) => {
    const wallet = availableWallets.find((w) => w.name === walletName)
    if (!wallet) {
      throw new Error("Wallet not found")
    }
    await connectWalletInternal(wallet, walletName)
  }

  const disconnectWallet = () => {
    console.log("[v0] Disconnecting wallet")
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      walletName: null,
      qomBalance: null,
      qomBalanceUSD: null,
    })

    setProvider(null)
    setSigner(null)

    localStorage.removeItem("connectedWallet")
    localStorage.removeItem("walletAddress")

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const switchNetwork = async (targetChainId: number) => {
    if (!walletState.isConnected || !walletState.walletName) {
      throw new Error("No wallet connected")
    }

    try {
      const wallet = availableWallets.find((w) => w.name === walletState.walletName)
      if (!wallet) throw new Error("Wallet not found")

      const provider = await wallet.connector()

      if (targetChainId === QL1_NETWORK.chainId) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: QL1_NETWORK.name,
                  nativeCurrency: QL1_NETWORK.nativeCurrency,
                  rpcUrls: [QL1_NETWORK.rpcUrl],
                  blockExplorerUrls: [QL1_NETWORK.blockExplorerUrl],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      } else {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })
      }

      toast({
        title: "Network Switched",
        description: `Switched to chain ID ${targetChainId}`,
      })
    } catch (err: any) {
      toast({
        title: "Network Switch Failed",
        description: err.message,
        variant: "destructive",
      })
      throw err
    }
  }

  const fetchQOMBalance = async (address: string, ethersProvider: ethers.BrowserProvider) => {
    try {
      const QOM_TOKEN_ADDRESS = QL1_NETWORK.qomTokenAddress
      const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ]

      const qomContract = new ethers.Contract(QOM_TOKEN_ADDRESS, ERC20_ABI, ethersProvider)
      const balance = await qomContract.balanceOf(address)
      const decimals = await qomContract.decimals()
      const qomBalance = ethers.formatUnits(balance, decimals)

      const qomPriceData = localStorage.getItem("qom-price")
      let qomBalanceUSD = "0.00"
      if (qomPriceData) {
        try {
          const priceData = JSON.parse(qomPriceData)
          const usdValue = Number.parseFloat(qomBalance) * Number.parseFloat(priceData.price)
          qomBalanceUSD = usdValue.toFixed(2)
        } catch (e) {
          // Silent fail for price parsing
        }
      }

      return { qomBalance: Number.parseFloat(qomBalance).toFixed(4), qomBalanceUSD }
    } catch (err) {
      return { qomBalance: "0.0000", qomBalanceUSD: "0.00" }
    }
  }

  const contextValue: WalletContextType = {
    ...walletState,
    availableWallets,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnecting,
    isReconnecting,
    error,
    provider,
    signer,
  }

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
