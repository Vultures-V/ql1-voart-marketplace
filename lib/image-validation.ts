// Image validation utility for NFT marketplace
// Based on QL1 blockchain storage optimization standards

export interface ImageRequirements {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  maxFileSize: number // in bytes
  aspectRatio?: number // optional, e.g., 1 for square, 3 for 3:1
  aspectRatioTolerance?: number // tolerance for aspect ratio check
}

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
  dimensions?: { width: number; height: number }
  fileSize?: number
}

// Predefined image requirements for different use cases
export const IMAGE_REQUIREMENTS = {
  NFT_MINT: {
    minWidth: 800,
    minHeight: 800,
    maxWidth: 1200,
    maxHeight: 1200,
    maxFileSize: 2 * 1024 * 1024, // 2 MB
    aspectRatio: 1, // Square
    aspectRatioTolerance: 0.05,
  },
  PROFILE_AVATAR: {
    minWidth: 400,
    minHeight: 400,
    maxWidth: 800,
    maxHeight: 800,
    maxFileSize: 500 * 1024, // 500 KB
    aspectRatio: 1, // Square
    aspectRatioTolerance: 0.05,
  },
  PROFILE_BANNER: {
    minWidth: 1200,
    minHeight: 400,
    maxWidth: 1400,
    maxHeight: 400,
    maxFileSize: 1 * 1024 * 1024, // 1 MB
    aspectRatio: 3, // 3:1 ratio
    aspectRatioTolerance: 0.1,
  },
  COLLECTION_BANNER: {
    minWidth: 1200,
    minHeight: 400,
    maxWidth: 1200,
    maxHeight: 400,
    maxFileSize: 1 * 1024 * 1024, // 1 MB
    aspectRatio: 3, // 3:1 ratio (8:3 is close to 3:1)
    aspectRatioTolerance: 0.1,
  },
  COLLECTION_LOGO: {
    minWidth: 240,
    minHeight: 240,
    maxWidth: 300,
    maxHeight: 300,
    maxFileSize: 1 * 1024 * 1024, // 1 MB
    aspectRatio: 1, // Square
    aspectRatioTolerance: 0.05,
  },
  MARKETPLACE_DISPLAY: {
    minWidth: 800,
    minHeight: 800,
    maxWidth: 1000,
    maxHeight: 1000,
    maxFileSize: 1 * 1024 * 1024, // 1 MB
    aspectRatio: 1, // Square
    aspectRatioTolerance: 0.05,
  },
} as const

/**
 * Validates an image file against specified requirements
 */
export async function validateImage(file: File, requirements: ImageRequirements): Promise<ValidationResult> {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      error: "Invalid file type. Please upload an image file (JPG, PNG, etc.)",
    }
  }

  // Check file size
  if (file.size > requirements.maxFileSize) {
    const maxSizeMB = (requirements.maxFileSize / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB. Please compress your image or choose a smaller file.`,
      fileSize: file.size,
    }
  }

  // Load image to check dimensions
  try {
    const dimensions = await getImageDimensions(file)

    // Check minimum dimensions
    if (dimensions.width < requirements.minWidth || dimensions.height < requirements.minHeight) {
      return {
        valid: false,
        error: `Image is too small. Minimum size: ${requirements.minWidth}x${requirements.minHeight}px. Your image: ${dimensions.width}x${dimensions.height}px`,
        dimensions,
      }
    }

    // Check maximum dimensions
    if (dimensions.width > requirements.maxWidth || dimensions.height > requirements.maxHeight) {
      return {
        valid: false,
        error: `Image is too large. Maximum size: ${requirements.maxWidth}x${requirements.maxHeight}px. Your image: ${dimensions.width}x${dimensions.height}px`,
        dimensions,
      }
    }

    // Check aspect ratio if specified
    if (requirements.aspectRatio && requirements.aspectRatioTolerance) {
      const actualRatio = dimensions.width / dimensions.height
      const expectedRatio = requirements.aspectRatio
      const tolerance = requirements.aspectRatioTolerance

      if (Math.abs(actualRatio - expectedRatio) > tolerance) {
        const expectedRatioStr = expectedRatio === 1 ? "1:1 (square)" : `${expectedRatio}:1`
        return {
          valid: false,
          error: `Image aspect ratio is incorrect. Expected ${expectedRatioStr}, but got ${actualRatio.toFixed(2)}:1`,
          dimensions,
        }
      }
    }

    // All checks passed
    return {
      valid: true,
      dimensions,
      fileSize: file.size,
    }
  } catch (error) {
    return {
      valid: false,
      error: "Failed to load image. Please try a different file.",
    }
  }
}

/**
 * Gets the dimensions of an image file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Gets a user-friendly description of image requirements
 */
export function getRequirementsDescription(requirements: ImageRequirements): string {
  const sizeMB = (requirements.maxFileSize / (1024 * 1024)).toFixed(1)
  const aspectRatioStr = requirements.aspectRatio === 1 ? "square (1:1)" : `${requirements.aspectRatio}:1`

  return `${requirements.minWidth}x${requirements.minHeight} to ${requirements.maxWidth}x${requirements.maxHeight}px, ${aspectRatioStr} ratio, max ${sizeMB}MB`
}
