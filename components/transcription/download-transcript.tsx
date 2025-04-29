"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download } from "lucide-react"
import type { TranscriptionSegment } from "@/lib/transcription-service"
import { downloadTranscriptAsText, downloadTranscriptAsCSV } from "@/utils/download-utils"
import { useState } from "react"

interface DownloadTranscriptProps {
  segments: TranscriptionSegment[]
  meetingId: string
  disabled?: boolean
}

export function DownloadTranscript({ segments, meetingId, disabled = false }: DownloadTranscriptProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadText = () => {
    setIsDownloading(true)
    try {
      downloadTranscriptAsText(segments, meetingId)
    } catch (error) {
      console.error("Error downloading transcript:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadCSV = () => {
    setIsDownloading(true)
    try {
      downloadTranscriptAsCSV(segments, meetingId)
    } catch (error) {
      console.error("Error downloading transcript as CSV:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled || isDownloading || segments.length === 0}
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadText}>Download as Text</DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCSV}>Download as CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
