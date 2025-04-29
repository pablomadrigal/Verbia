"use client"

import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu"
import { Download, Clipboard, Check } from "lucide-react"
import type { TranscriptionSegment } from "@/lib/transcription-service"
import { downloadTranscriptAsText, downloadTranscriptAsCSV, formatTranscriptForDownload } from "@/utils/download-utils"
import { useState, useEffect, useCallback } from "react"

interface DownloadTranscriptProps {
  segments: TranscriptionSegment[]
  meetingId: string
  disabled?: boolean
}

export function DownloadTranscript({ segments, meetingId, disabled = false }: DownloadTranscriptProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Memoize copy function to avoid dependency issues
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const text = formatTranscriptForDownload(segments, true, true)
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
    } catch (error) {
      console.error("Error copying transcript to clipboard:", error)
    }
  }, [segments])

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [isCopied])

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Command+C (Mac) or Ctrl+C (Windows/Linux) is pressed while dropdown is open
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && isDropdownOpen && !disabled && segments.length > 0) {
        e.preventDefault() // Prevent default copy behavior
        handleCopyToClipboard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDropdownOpen, disabled, segments.length, handleCopyToClipboard])

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
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs py-0 px-2 gap-1"
          disabled={disabled || isDownloading || segments.length === 0}
        >
          <Download className="h-3 w-3" />
          <span>Download</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          <div className="flex items-center gap-2">
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </div>
          <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadText}>
          <Download className="h-4 w-4 mr-2" />
          Download as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCSV}>
          <Download className="h-4 w-4 mr-2" />
          Download as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
