"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Clock, History } from "lucide-react"
import {
  type TranscriptionData,
  type TranscriptionSegment,
  getTranscription,
  stopTranscription,
  getMeetingTranscript
} from "@/lib/transcription-service"
import { useEffect, useRef, useState } from "react"
import { DownloadTranscript } from "./download-transcript"
import { TranscriptSearch } from "./transcript-search"
import { cn } from "@/lib/utils"

interface TranscriptionDisplayProps {
  meetingId: string | null
  onStop?: () => void
  isLive?: boolean
  title?: string
}

export function TranscriptionDisplay({ 
  meetingId, 
  onStop, 
  isLive = true,
  title
}: TranscriptionDisplayProps) {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | null>(null)
  const [newSegmentIds, setNewSegmentIds] = useState<Set<string>>(new Set())
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptionRef = useRef<HTMLDivElement>(null)
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const retryCount = useRef(0)
  const MAX_RETRIES = 3

  const shouldDisplay = !!meetingId

  // Clear highlight effect after a delay
  useEffect(() => {
    if (newSegmentIds.size > 0) {
      const timer = setTimeout(() => {
        setNewSegmentIds(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newSegmentIds]);

  // Function to poll for transcription updates in live mode
  const pollForUpdates = async () => {
    if (!meetingId) return

    setIsPolling(true)
    try {
      console.log("Polling for updates with meetingId:", meetingId);
      const data = await getTranscription(meetingId)
      console.log("Polling update received:", data.segments.length, "segments");

      // Reset retry count on successful request
      retryCount.current = 0

      // Track new segment IDs for highlight effect
      const justAddedSegmentIds = new Set<string>();

      // Update our segments with any new ones
      setSegments((prevSegments) => {
        // Create a map of existing segments by ID for easy lookup
        const existingSegmentsMap = new Map(prevSegments.map(s => [s.id, s]));
        
        // Add any segments that don't already exist
        let hasNewSegments = false;
        data.segments.forEach(segment => {
          if (!existingSegmentsMap.has(segment.id)) {
            existingSegmentsMap.set(segment.id, segment);
            hasNewSegments = true;
            justAddedSegmentIds.add(segment.id);
          }
        });
        
        // If no new segments, just return the previous array to avoid re-renders
        if (!hasNewSegments) {
          return prevSegments;
        }
        
        console.log(`Added ${justAddedSegmentIds.size} new segments`);
        
        // Convert map back to array and sort by timestamp
        return Array.from(existingSegmentsMap.values())
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      })

      // Update the highlight state if we have new segments
      if (justAddedSegmentIds.size > 0) {
        setNewSegmentIds(justAddedSegmentIds);
      }

      setTranscription(data)

      // If the status is no longer active, stop polling
      if (data.status !== "active") {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
          pollingInterval.current = null
          console.log("Stopping polling because status is:", data.status);
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
          console.log("Stopping polling after max retries");
        }
      } else {
        setError(`Failed to update transcription. Retrying... (${retryCount.current}/${MAX_RETRIES})`)
      }
    } finally {
      setIsPolling(false)
    }
  }

  // Function to fetch historical transcripts (non-polling)
  const fetchHistoricalTranscript = async () => {
    if (!meetingId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getMeetingTranscript(meetingId)
      setSegments(data.segments)
      setTranscription(data)
    } catch (err) {
      console.error("Error fetching historical transcript:", err)
      setError("Failed to load transcript")
    } finally {
      setIsLoading(false)
    }
  }

  // Start polling when component mounts in live mode
  useEffect(() => {
    // Clean up any existing polling interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
      console.log("Cleared existing polling interval");
    }
    
    // Reset state when meeting ID changes
    setSegments([])
    setTranscription(null)
    setError(null)
    
    if (shouldDisplay) {
      if (isLive) {
        // Live mode: start polling
        console.log("Starting polling for meetingId:", meetingId);
        pollForUpdates()
        pollingInterval.current = setInterval(pollForUpdates, 800) // Poll more frequently
      } else {
        // Historical mode: just fetch once
        console.log("Fetching historical transcript for meetingId:", meetingId);
        fetchHistoricalTranscript()
      }
    }

    // Clean up interval when component unmounts
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        console.log("Cleaned up polling interval on unmount");
      }
    }
  }, [shouldDisplay, meetingId, isLive])

  // Scroll to bottom when new segments are added
  useEffect(() => {
    if (transcriptionRef.current && !highlightedSegmentId && isLive) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight
    }
  }, [segments, highlightedSegmentId, isLive])

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
    if (!meetingId || !onStop) return
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
          {isLive ? (
            <>
              Live Transcription
              {isPolling && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
            </>
          ) : (
            <>
              <History className="h-5 w-5 text-gray-500" />
              {title || "Meeting Transcript"}
            </>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {meetingId && (
            <DownloadTranscript
              segments={segments}
              meetingId={meetingId}
              disabled={segments.length === 0 || isLoading}
            />
          )}
          {isLive && onStop && (
            <Button onClick={handleStop} variant="destructive" size="sm" disabled={isLoading}>
              {isLoading ? "Stopping..." : "Stop Bot"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {isLoading && !isLive && segments.length === 0 && (
          <div className="flex justify-center my-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        )}
        
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
          {segments.length === 0 && !isLoading ? (
            <div className="text-center text-gray-500 py-8">
              {isLive 
                ? "Waiting for transcription to begin..." 
                : "No transcript available for this meeting."
              }
            </div>
          ) : (
            <div className="space-y-2 font-light text-gray-800">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  ref={(el) => (segmentRefs.current[segment.id] = el)}
                  className={cn(
                    "px-3 py-2 transition-colors border-l-2 border-l-gray-200 hover:bg-gray-100",
                    highlightedSegmentId === segment.id && "bg-gray-200 border-l-gray-500",
                    newSegmentIds.has(segment.id) && "bg-green-50 border-l-green-500 animate-pulse"
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
