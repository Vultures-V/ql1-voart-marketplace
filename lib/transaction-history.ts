export interface Transaction {
  id: string
  type: "purchase" | "sale" | "mint" | "transfer" | "offer"
  nftId: number
  nftName: string
  nftImage: string
  price: string
  currency: string
  from: string
  to: string
  timestamp: string
  transactionHash?: string
  commissionPaid?: number
}

export class TransactionHistory {
  private static getStorageKey(address: string): string {
    return `transaction-history-${address}`
  }

  static addTransaction(address: string, transaction: Omit<Transaction, "id" | "timestamp">): boolean {
    try {
      const history = this.getHistory(address)
      const newTransaction: Transaction = {
        ...transaction,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      }

      history.unshift(newTransaction)

      // Keep only last 100 transactions
      const trimmedHistory = history.slice(0, 100)

      localStorage.setItem(this.getStorageKey(address), JSON.stringify(trimmedHistory))
      return true
    } catch (error) {
      console.error("Failed to add transaction:", error)
      return false
    }
  }

  static getHistory(address: string): Transaction[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(address))
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to get transaction history:", error)
      return []
    }
  }

  static getRecentTransactions(address: string, limit = 10): Transaction[] {
    return this.getHistory(address).slice(0, limit)
  }

  static getTransactionsByType(address: string, type: Transaction["type"]): Transaction[] {
    return this.getHistory(address).filter((tx) => tx.type === type)
  }

  static clearHistory(address: string): void {
    localStorage.removeItem(this.getStorageKey(address))
  }
}
