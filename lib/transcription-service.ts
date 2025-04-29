import { MOCK_MODE } from "./config"
import { parseMeetingUrl } from "./utils"

// Types for our transcription service
export interface TranscriptionSegment {
  id: string
  text: string
  timestamp: string
  speaker?: string
}

export interface TranscriptionData {
  meetingId: string
  language: string
  segments: TranscriptionSegment[]
  status: "active" | "stopped" | "error"
  lastUpdated: string
}

// Mock data for demonstration
const mockSegments: TranscriptionSegment[] = [
  {
    id: "segment-1",
    text: "Hello everyone, thanks for joining today's meeting.",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    speaker: "John",
  },
  {
    id: "segment-2",
    text: "I wanted to discuss our progress on the new feature.",
    timestamp: new Date(Date.now() - 50000).toISOString(),
    speaker: "John",
  },
  {
    id: "segment-3",
    text: "The development team has completed the backend work.",
    timestamp: new Date(Date.now() - 40000).toISOString(),
    speaker: "Sarah",
  },
  {
    id: "segment-4",
    text: "We're still working on the frontend components.",
    timestamp: new Date(Date.now() - 30000).toISOString(),
    speaker: "Sarah",
  },
  {
    id: "segment-5",
    text: "When do you think we'll be ready for testing?",
    timestamp: new Date(Date.now() - 20000).toISOString(),
    speaker: "Michael",
  },
]

// Mock data storage
const mockTranscriptionData: Record<string, TranscriptionData> = {}

// Vexa API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_VEXA_API_URL || "https://gateway.dev.vexa.ai"

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    // Specific handling for 409 conflict (existing bot)
    if (response.status === 409) {
      const error = new Error(`ExistingBotError: ${errorData.detail || "A bot is already running for this meeting"}`)
      error.name = "ExistingBotError"
      throw error
    }
    
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.detail || errorData.message || "Unknown error"}`)
  }
  return response.json()
}

// Function to get headers with Vexa API key
function getHeaders() {
  // Get API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_VEXA_API_KEY || ""

  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  }
}

/**
 * Start a new transcription session by adding a bot to a meeting
 * @param meetingUrl The URL of the meeting to transcribe
 * @param language The language code (e.g., 'en', 'es'), or 'auto' for auto-detection
 * @param botName Optional name for the bot that will appear in the meeting
 */
export async function startTranscription(
  meetingUrl: string,
  language = "auto",
  botName = "Vexa",
): Promise<{ success: boolean; meetingId: string }> {
  // Use mock implementation if in mock mode
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay

    const meetingId = `mock-meeting-${Date.now()}`

    // Initialize mock transcription data
    mockTranscriptionData[meetingId] = {
      meetingId,
      language: language === "auto" ? "auto-detected" : language,
      segments: [...mockSegments], // Copy initial mock segments
      status: "active",
      lastUpdated: new Date().toISOString(),
    }

    return {
      success: true,
      meetingId,
    }
  }

  // Real API implementation using Vexa API
  try {
    // Parse the meeting URL to get platform and native meeting ID
    const { platform, nativeMeetingId } = parseMeetingUrl(meetingUrl)
    
    // Build request payload for /bots endpoint
    const requestPayload: {
      platform: string;
      native_meeting_id: string;
      language?: string;
      bot_name: string;
    } = {
      platform,
      native_meeting_id: nativeMeetingId,
      bot_name: botName
    }
    
    // Only include language if it's not set to auto (to enable auto-detection)
    if (language !== "auto") {
      requestPayload.language = language;
    }

    const response = await fetch(`${API_BASE_URL}/bots`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(requestPayload),
    })

    const data = await handleApiResponse<any>(response)

    // The response format may vary, adjust as needed based on Vexa API response
    return {
      success: true,
      meetingId: `${platform}/${nativeMeetingId}`, // We're storing the full ID that we need for future calls
    }
  } catch (error) {
    console.error("Error starting transcription:", error)
    throw error
  }
}

/**
 * Stop an active transcription session
 * @param meetingId The ID of the meeting to stop transcribing
 */
export async function stopTranscription(meetingId: string): Promise<{ success: boolean }> {
  // Use mock implementation if in mock mode
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay

    // Update mock data status
    if (mockTranscriptionData[meetingId]) {
      mockTranscriptionData[meetingId].status = "stopped"
    }

    return {
      success: true,
    }
  }

  // Real API implementation using Vexa API
  try {
    // The meetingId should be in the format "platform/nativeMeetingId"
    const [platform, nativeMeetingId] = meetingId.split('/')
    
    if (!platform || !nativeMeetingId) {
      throw new Error("Invalid meeting ID format")
    }

    const response = await fetch(`${API_BASE_URL}/bots/${platform}/${nativeMeetingId}`, {
      method: "DELETE",
      headers: getHeaders(),
    })

    const data = await handleApiResponse<any>(response)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error stopping transcription:", error)
    throw error
  }
}

/**
 * Get the current transcription data for a meeting
 * @param meetingId The ID of the meeting
 */
export async function getTranscription(meetingId: string): Promise<TranscriptionData> {
  // Use mock implementation if in mock mode
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

    // If this meeting doesn't exist in our mock data, create it
    if (!mockTranscriptionData[meetingId]) {
      mockTranscriptionData[meetingId] = {
        meetingId,
        language: "en",
        segments: [...mockSegments], // Copy initial mock segments
        status: "active",
        lastUpdated: new Date().toISOString(),
      }
    }

    // Add a new segment occasionally to simulate real-time updates
    if (Math.random() > 0.5 && mockTranscriptionData[meetingId].status === "active") {
      const newSegment = {
        id: `segment-${Date.now()}`,
        text: `This is a new transcription segment generated at ${new Date().toLocaleTimeString()}.`,
        timestamp: new Date().toISOString(),
        speaker: Math.random() > 0.5 ? "John" : Math.random() > 0.5 ? "Sarah" : "Michael",
      }

      mockTranscriptionData[meetingId].segments.push(newSegment)
      mockTranscriptionData[meetingId].lastUpdated = new Date().toISOString()
    }

    return { ...mockTranscriptionData[meetingId] }
  }

  // Real API implementation using Vexa API
  try {
    // The meetingId should be in the format "platform/nativeMeetingId"
    const [platform, nativeMeetingId] = meetingId.split('/')
    
    if (!platform || !nativeMeetingId) {
      throw new Error("Invalid meeting ID format")
    }

    const response = await fetch(`${API_BASE_URL}/transcripts/${platform}/${nativeMeetingId}`, {
      method: "GET",
      headers: getHeaders(),
    })

    const data = await handleApiResponse<any>(response)

    // Transform the Vexa API response into our TranscriptionData format
    // The segments might need to be mapped based on the actual Vexa API response structure
    return {
      meetingId,
      language: data.language || "en",
      segments: data.segments.map((segment: any) => ({
        id: segment.id || `segment-${Date.now()}-${Math.random()}`,
        text: segment.text || "",
        timestamp: segment.timestamp || new Date().toISOString(),
        speaker: segment.speaker || "Unknown",
      })),
      status: "active", // You might want to get this from the API or another endpoint
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting transcription:", error)
    throw error
  }
}

/**
 * Get the full transcript for a meeting (all segments combined)
 * @param meetingId The ID of the meeting
 */
export async function getFullTranscript(
  meetingId: string,
): Promise<{ text: string; segments: TranscriptionSegment[] }> {
  // Use mock implementation if in mock mode
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 800)) // Simulate API delay

    // If this meeting doesn't exist in our mock data, return empty
    if (!mockTranscriptionData[meetingId]) {
      return {
        text: "",
        segments: [],
      }
    }

    // Combine all segment texts
    const text = mockTranscriptionData[meetingId].segments.map((segment) => segment.text).join(" ")

    return {
      text,
      segments: [...mockTranscriptionData[meetingId].segments],
    }
  }

  // Real API implementation using Vexa API
  try {
    // The meetingId should be in the format "platform/nativeMeetingId"
    const [platform, nativeMeetingId] = meetingId.split('/')
    
    if (!platform || !nativeMeetingId) {
      throw new Error("Invalid meeting ID format")
    }

    // Get the latest transcript data
    const transcriptionData = await getTranscription(meetingId)
    
    // Combine all segment texts
    const text = transcriptionData.segments.map(segment => segment.text).join(" ")

    return {
      text,
      segments: transcriptionData.segments,
    }
  } catch (error) {
    console.error("Error getting full transcript:", error)
    throw error
  }
}
