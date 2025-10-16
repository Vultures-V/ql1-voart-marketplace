// Reports Management System for Admin Panel
export interface ContentReport {
  id: string
  type: "nft" | "user" | "collection"
  targetId: string
  targetName: string
  reporterAddress: string
  reporterName: string
  reason: string
  category: "spam" | "inappropriate" | "copyright" | "scam" | "other"
  description: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  resolution?: string
}

export class ReportsSystem {
  private static STORAGE_KEY = "voart_content_reports"

  // Submit a new report
  static submitReport(report: Omit<ContentReport, "id" | "status" | "createdAt">): {
    success: boolean
    message: string
  } {
    try {
      const reports = this.getAllReports()

      const newReport: ContentReport = {
        ...report,
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      reports.push(newReport)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports))

      return { success: true, message: "Report submitted successfully" }
    } catch (error) {
      console.error("Error submitting report:", error)
      return { success: false, message: "Failed to submit report" }
    }
  }

  // Get all reports
  static getAllReports(): ContentReport[] {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]")
  }

  // Get pending reports
  static getPendingReports(): ContentReport[] {
    return this.getAllReports().filter((r) => r.status === "pending")
  }

  // Review a report
  static reviewReport(
    reportId: string,
    adminAddress: string,
    status: "resolved" | "dismissed",
    resolution: string,
  ): {
    success: boolean
    message: string
  } {
    try {
      const reports = this.getAllReports()
      const reportIndex = reports.findIndex((r) => r.id === reportId)

      if (reportIndex === -1) {
        return { success: false, message: "Report not found" }
      }

      reports[reportIndex] = {
        ...reports[reportIndex],
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminAddress,
        resolution,
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports))

      return { success: true, message: `Report ${status} successfully` }
    } catch (error) {
      console.error("Error reviewing report:", error)
      return { success: false, message: "Failed to review report" }
    }
  }

  // Get report statistics
  static getStatistics() {
    const reports = this.getAllReports()

    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
      byCategory: {
        spam: reports.filter((r) => r.category === "spam").length,
        inappropriate: reports.filter((r) => r.category === "inappropriate").length,
        copyright: reports.filter((r) => r.category === "copyright").length,
        scam: reports.filter((r) => r.category === "scam").length,
        other: reports.filter((r) => r.category === "other").length,
      },
    }
  }
}
