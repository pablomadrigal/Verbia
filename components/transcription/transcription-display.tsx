"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Clock } from "lucide-react"
import {
  type TranscriptionData,
  type TranscriptionSegment,
  getTranscription,
  stopTranscription,
} from "@/lib/transcription-service"
import { useEffect, useRef, useState } from "react"
import { DownloadTranscript } from "./download-transcript"
import { TranscriptSearch } from "./transcript-search"
import { cn } from "@/lib/utils"

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

  // Format time for display
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          Live Transcription
          {isPolling && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
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
      <CardContent className="space-y-4 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {segments.length > 0 && <TranscriptSearch segments={segments} onHighlight={handleHighlightSegment} />}

        <div 
          ref={transcriptionRef} 
          className="h-[400px] overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-4"
        >
          {segments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Waiting for transcription to begin...</div>
          ) : (
            <div className="space-y-2 font-light text-gray-800">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  ref={(el) => (segmentRefs.current[segment.id] = el)}
                  className={cn(
                    "px-3 py-2 transition-colors border-l-2 border-l-gray-200 hover:bg-gray-100",
                    highlightedSegmentId === segment.id && "bg-gray-200 border-l-gray-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap pt-1 pl-2 flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {formatTime(segment.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
