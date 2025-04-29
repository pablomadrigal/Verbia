"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PlusCircle, Clock, CheckCircle, AlertCircle, History, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Meeting, getMeetingHistory } from "@/lib/transcription-service"
import { formatDistanceToNow } from "date-fns"

interface SidebarProps {
  onNewMeeting: () => void
  onSelectMeeting: (meeting: Meeting) => void
  selectedMeetingId: string | null
}

export function Sidebar({ 
  onNewMeeting, 
  onSelectMeeting, 
  selectedMeetingId 
}: SidebarProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasActiveMeetings, setHasActiveMeetings] = useState(false)

  const fetchMeetings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Fetching meeting history");
      const meetingData = await getMeetingHistory()
      
      // Sort by start time, most recent first
      const sorted = [...meetingData].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      
      // Check if there are any active meetings
      const active = sorted.some(meeting => meeting.status === "active")
      setHasActiveMeetings(active)
      
      if (active) {
        console.log("Active meetings found, will refresh more frequently");
      }
      
      setMeetings(sorted)
    } catch (err) {
      console.error("Error fetching meetings:", err)
      setError("Failed to load meeting history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
    
    // Set up polling - more frequent if there are active meetings
    const interval = setInterval(
      fetchMeetings, 
      hasActiveMeetings ? 10000 : 30000 // Refresh every 10s if active, 30s otherwise
    )
    
    return () => clearInterval(interval)
  }, [hasActiveMeetings])
  
  // Initial fetch
  useEffect(() => {
    fetchMeetings()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "stopped":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "Unknown date"
    }
  }

  return (
    <div className="w-64 border-r border-gray-200 h-screen overflow-hidden flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <History className="h-5 w-5" />
          Meetings
        </h2>
      </div>
      
      <div className="p-4">
        <Button 
          onClick={onNewMeeting}
          className="w-full"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" /> New Meeting
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && meetings.length === 0 ? (
          <div className="text-sm text-center text-gray-500 mt-4">Loading meetings...</div>
        ) : error ? (
          <div className="text-sm text-center text-red-500 mt-4">{error}</div>
        ) : meetings.length === 0 ? (
          <div className="text-sm text-center text-gray-500 mt-4">No meetings found</div>
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <Card
                key={meeting.id}
                className={cn(
                  "p-3 hover:bg-gray-100 cursor-pointer transition-colors border",
                  selectedMeetingId === meeting.id ? "bg-gray-100 border-gray-300" : "bg-white",
                  meeting.status === "active" ? "border-blue-300" : ""
                )}
                onClick={() => onSelectMeeting(meeting)}
              >
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    {getStatusIcon(meeting.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {meeting.title || `Meeting ${meeting.nativeMeetingId}`}
                    </div>
                    <div className="text-xs text-gray-500 truncate flex items-center">
                      {meeting.status === "active" && (
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1 animate-pulse"></span>
                      )}
                      {formatDate(meeting.startTime)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 