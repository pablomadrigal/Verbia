import type { TranscriptionSegment } from "@/lib/transcription-service"

/**
 * Format transcript segments into a readable text format
 */
export function formatTranscriptForDownload(
  segments: TranscriptionSegment[],
  includeTimestamps = true,
  includeSpeakers = true,
): string {
  return segments
    .map((segment) => {
      const timestamp = includeTimestamps ? `[${new Date(segment.timestamp).toLocaleTimeString()}] ` : ""
      const speaker = includeSpeakers && segment.speaker ? `${segment.speaker}: ` : ""
      return `${timestamp}${speaker}${segment.text}`
    })
    .join("\n\n")
}

/**
 * Format transcript segments into a CSV format
 */
export function formatTranscriptAsCSV(segments: TranscriptionSegment[]): string {
  // Create CSV header
  const header = "Timestamp,Speaker,Text"

  // Format each segment as a CSV row
  const rows = segments.map((segment) => {
    const timestamp = new Date(segment.timestamp).toLocaleTimeString()
    const speaker = segment.speaker || "Unknown"
    // Escape quotes in text to prevent CSV issues
    const text = segment.text.replace(/"/g, '""')
    return `"${timestamp}","${speaker}","${text}"`
  })

  return [header, ...rows].join("\n")
}

/**
 * Download content as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string): void {
  // Create a blob with the content
  const blob = new Blob([content], { type: mimeType })

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a temporary link element
  const link = document.createElement("a")
  link.href = url
  link.download = filename

  // Append the link to the body
  document.body.appendChild(link)

  // Trigger the download
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download transcript as a text file
 */
export function downloadTranscriptAsText(
  segments: TranscriptionSegment[],
  meetingId: string,
  includeTimestamps = true,
  includeSpeakers = true,
): void {
  const content = formatTranscriptForDownload(segments, includeTimestamps, includeSpeakers)
  const date = new Date().toISOString().split("T")[0]
  const filename = `transcript-${meetingId}-${date}.txt`

  downloadAsFile(content, filename, "text/plain")
}

/**
 * Download transcript as a CSV file
 */
export function downloadTranscriptAsCSV(segments: TranscriptionSegment[], meetingId: string): void {
  const content = formatTranscriptAsCSV(segments)
  const date = new Date().toISOString().split("T")[0]
  const filename = `transcript-${meetingId}-${date}.csv`

  downloadAsFile(content, filename, "text/csv")
}
