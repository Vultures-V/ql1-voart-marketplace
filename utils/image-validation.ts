// Image validation utilities for NFT marketplace

export interface ImageRequirements {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  maxFileSize: number // in bytes
  aspectRatio?: number // optional aspect ratio (width/height)
  aspectRatioTolerance?: number // tolerance for aspect ratio check
}

export interface ImageValidationResult {
  valid: boolean
  error?: string
  dimensions?: {
    width: number
    height: number
  }
  fileSize?: number
}

// Image requirements for different use cases
export const IMAGE_REQUIREMENTS = {
  // Collection images
  COLLECTION_BANNER: {
    minWidth: 1200,
    maxWidth: 1400,
    minHeight: 400,
    maxHeight: 400,
    maxFileSize: 1024 * 1024, // 1MB
    aspectRatio: 3, // 3:1 ratio
    aspectRatioTolerance: 0.1,
  },
  COLLECTION_LOGO: {
    minWidth: 240,
    maxWidth: 300,
    minHeight: 240,
    maxHeight: 300,
    maxFileSize: 1024 * 1024, // 1MB
    aspectRatio: 1, // 1:1 ratio (square)
    aspectRatioTolerance: 0.05,
  },
  // Profile images
  PROFILE_AVATAR: {
    minWidth: 400,
    maxWidth: 800,
    minHeight: 400,
    maxHeight: 800,
    maxFileSize: 500 * 1024, // 500KB
    aspectRatio: 1, // 1:1 ratio (square)
    aspectRatioTolerance: 0.05,
  },
  PROFILE_BANNER: {
    minWidth: 1200,
    maxWidth: 1400,
    minHeight: 400,
    maxHeight: 400,
    maxFileSize: 1024 * 1024, // 1MB
    aspectRatio: 3, // 3:1 ratio
    aspectRatioTolerance: 0.1,
  },
  // NFT images
  NFT_IMAGE: {
    minWidth: 500,
    maxWidth: 4000,
    minHeight: 500,
    maxHeight: 4000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
}

/**
 * Validates an image file against specified requirements
 * @param file - The image file to validate
 * @param requirements - The requirements to validate against
 * @returns Promise with validation result
 */
export async function validateImage(file: File, requirements: ImageRequirements): Promise<ImageValidationResult> {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      error: "File must be an image (JPG, PNG, GIF, etc.)",
    }
  }

  // Check file size
  if (file.size > requirements.maxFileSize) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(requirements.maxFileSize)}. Current size: ${formatFileSize(file.size)}`,
    }
  }

  // Load image to check dimensions
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const { width, height } = img

      // Check minimum dimensions
      if (width < requirements.minWidth || height < requirements.minHeight) {
        resolve({
          valid: false,
          error: `Image must be at least ${requirements.minWidth}x${requirements.minHeight}px. Current: ${width}x${height}px`,
          dimensions: { width, height },
          fileSize: file.size,
        })
        return
      }

      // Check maximum dimensions
      if (width > requirements.maxWidth || height > requirements.maxHeight) {
        resolve({
          valid: false,
          error: `Image must be at most ${requirements.maxWidth}x${requirements.maxHeight}px. Current: ${width}x${height}px`,
          dimensions: { width, height },
          fileSize: file.size,
        })
        return
      }

      // Check aspect ratio if specified
      if (requirements.aspectRatio && requirements.aspectRatioTolerance) {
        const actualRatio = width / height
        const expectedRatio = requirements.aspectRatio
        const tolerance = requirements.aspectRatioTolerance

        if (Math.abs(actualRatio - expectedRatio) > tolerance) {
          const expectedRatioStr = expectedRatio === 1 ? "1:1 (square)" : `${expectedRatio}:1`
          resolve({
            valid: false,
            error: `Image aspect ratio should be approximately ${expectedRatioStr}. Current: ${actualRatio.toFixed(2)}:1`,
            dimensions: { width, height },
            fileSize: file.size,
          })
          return
        }
      }

      // All checks passed
      resolve({
        valid: true,
        dimensions: { width, height },
        fileSize: file.size,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        valid: false,
        error: "Failed to load image. Please ensure the file is a valid image.",
      })
    }

    img.src = objectUrl
  })
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
