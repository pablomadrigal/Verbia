import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract meeting ID and platform from URL
 * @param url The meeting URL (e.g., https://meet.google.com/xxx-xxxx-xxx)
 * @returns Object containing platform and nativeMeetingId
 */
export function parseMeetingUrl(url: string): { platform: string; nativeMeetingId: string } {
  try {
    const urlObj = new URL(url)
    
    // Handle Google Meet URLs
    if (urlObj.hostname === "meet.google.com") {
      // Extract meeting ID from URL path
      const meetingId = urlObj.pathname.substring(1) // Remove leading slash
      return { platform: "google_meet", nativeMeetingId: meetingId }
    }
    
    // Add support for other platforms here as needed
    
    throw new Error("Unsupported meeting platform. Currently only Google Meet is supported.")
  } catch (error) {
    throw new Error("Invalid meeting URL. Please provide a valid Google Meet URL.")
  }
}
