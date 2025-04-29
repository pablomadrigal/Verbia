"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  type TranscriptionData,
  type TranscriptionSegment,
  getTranscription,
  stopTranscription,
} from "@/lib/transcription-service"
import { useEffect, useRef, useState } from "react"
import { DownloadTranscript } from "./download-transcript"
import { TranscriptSearch } from "./transcript-search"

// Speaker colors for visual distinction
const SPEAKER_COLORS = [
  "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
  "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
  "bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800",
  "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800",
]

interface TranscriptionDisplayProps {
  meetingId: string | null
  onStop: () => void
}

export function TranscriptionDisplay({ meetingId, onStop }: TranscriptionDisplayProps) {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | null>(null)
  const [speakerColors, setSpeakerColors] = useState<Record<string, string>>({})
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptionRef = useRef<HTMLDivElement>(null)
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const retryCount = useRef(0)
  const MAX_RETRIES = 3

  const shouldDisplay = !!meetingId

  // Function to poll for transcription updates
  const pollForUpdates = async () => {
    if (!meetingId) return

    setIsPolling(true)
    try {
      const data = await getTranscription(meetingId)

      // Reset retry count on successful request
      retryCount.current = 0

      // Update our segments with any new ones
      setSegments((prevSegments) => {
        // Combine existing segments with new ones, avoiding duplicates
        const existingIds = new Set(prevSegments.map((s) => s.id))
        const newSegments = data.segments.filter((s) => !existingIds.has(s.id))

        // Assign colors to new speakers
        const updatedSpeakerColors = { ...speakerColors }
        newSegments.forEach((segment) => {
          if (segment.speaker && !updatedSpeakerColors[segment.speaker]) {
            const colorIndex = Object.keys(updatedSpeakerColors).length % SPEAKER_COLORS.length
            updatedSpeakerColors[segment.speaker] = SPEAKER_COLORS[colorIndex]
          }
        })

        // Update speaker colors if new speakers were found
        if (Object.keys(updatedSpeakerColors).length !== Object.keys(speakerColors).length) {
          setSpeakerColors(updatedSpeakerColors)
        }

        return [...prevSegments, ...newSegments]
      })

      setTranscription(data)

      // If the status is no longer active, stop polling
      if (data.status !== "active") {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
          pollingInterval.current = null
        }

        if (data.status === "error") {
          setError("Transcription service reported an error. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error polling for transcription:", err)

      // Implement retry logic
      retryCount.current += 1
      if (retryCount.current >= MAX_RETRIES) {
        setError("Failed to update transcription after multiple attempts")

        // Stop polling after max retries
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
          pollingInterval.current = null
        }
      } else {
        setError(`Failed to update transcription. Retrying... (${retryCount.current}/${MAX_RETRIES})`)
      }
    } finally {
      setIsPolling(false)
    }
  }

  // Start polling when component mounts
  useEffect(() => {
    if (shouldDisplay) {
      // Initial poll
      pollForUpdates()

      // Set up interval for polling every 2 seconds
      pollingInterval.current = setInterval(pollForUpdates, 2000)
    }

    // Clean up interval when component unmounts
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [shouldDisplay, meetingId])

  // Scroll to bottom when new segments are added
  useEffect(() => {
    if (transcriptionRef.current && !highlightedSegmentId) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight
    }
  }, [segments, highlightedSegmentId])

  // Scroll to highlighted segment
  useEffect(() => {
    if (highlightedSegmentId && segmentRefs.current[highlightedSegmentId]) {
      segmentRefs.current[highlightedSegmentId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [highlightedSegmentId])

  const handleStop = async () => {
    if (!meetingId) return
    try {
      setIsLoading(true)

      // Clear polling interval
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        pollingInterval.current = null
      }

      await stopTranscription(meetingId)
      onStop()
    } catch (err) {
      console.error("Error stopping transcription:", err)
      setError("Failed to stop transcription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleHighlightSegment = (segmentId: string) => {
    setHighlightedSegmentId(segmentId)
  }

  if (!shouldDisplay) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          Live Transcription
          {isPolling && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <div className="flex items-center gap-2">
          {meetingId && (
            <DownloadTranscript
              segments={segments}
              meetingId={meetingId}
              disabled={segments.length === 0 || isLoading}
            />
          )}
          <Button onClick={handleStop} variant="destructive" size="sm" disabled={isLoading}>
            {isLoading ? "Stopping..." : "Stop Bot"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {segments.length > 0 && <TranscriptSearch segments={segments} onHighlight={handleHighlightSegment} />}

        <div ref={transcriptionRef} className="h-[400px] overflow-y-auto border rounded-md p-4 space-y-4">
          {segments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Waiting for transcription to begin...</div>
          ) : (
            segments.map((segment) => (
              <div
                key={segment.id}
                ref={(el) => (segmentRefs.current[segment.id] = el)}
                className={`space-y-1 p-2 rounded-md transition-colors border-l-4 ${
                  highlightedSegmentId === segment.id
                    ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400"
                    : segment.speaker && speakerColors[segment.speaker]
                      ? speakerColors[segment.speaker]
                      : "border-transparent"
                }`}
              >
                {segment.speaker && <div className="text-sm font-medium text-primary">{segment.speaker}</div>}
                <div className="text-base">{segment.text}</div>
                <div className="text-xs text-muted-foreground">{new Date(segment.timestamp).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
