"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { StartForm } from "@/components/transcription/start-form"
import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import { ApiStatus } from "@/components/transcription/api-status"
import { Meeting } from "@/lib/transcription-service"

interface AppLayoutProps {
  user: {
    email: string;
  }
}

export function AppLayout({ user }: AppLayoutProps) {
  // App state
  const [mode, setMode] = useState<"setup" | "live" | "history">("setup")
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  const [selectedHistoricalMeeting, setSelectedHistoricalMeeting] = useState<Meeting | null>(null)

  const handleStartMeeting = (meetingId: string) => {
    setActiveMeetingId(meetingId)
    setMode("live")
    console.log("Starting live transcription with meetingId:", meetingId);
  }

  const handleStopMeeting = () => {
    setActiveMeetingId(null)
    setMode("setup")
  }

  const handleSelectHistoricalMeeting = (meeting: Meeting) => {
    // If the meeting is active, treat it as a live meeting
    if (meeting.status === "active") {
      console.log(`Meeting ${meeting.id} is active, switching to live mode`);
      setActiveMeetingId(meeting.id)
      setMode("live")
    } else {
      console.log(`Selected historical meeting: ${meeting.id}, status: ${meeting.status}`);
      setSelectedHistoricalMeeting(meeting)
      setMode("history")
    }
  }

  const handleNewMeeting = () => {
    setActiveMeetingId(null)
    setSelectedHistoricalMeeting(null)
    setMode("setup")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar 
        onNewMeeting={handleNewMeeting}
        onSelectMeeting={handleSelectHistoricalMeeting}
        selectedMeetingId={mode === "history" ? selectedHistoricalMeeting?.id || null : 
                           mode === "live" ? activeMeetingId : null}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Signed in as</div>
            <div className="font-medium">{user.email}</div>
          </div>

          <ApiStatus />

          {mode === "setup" && (
            <StartForm 
              onStart={handleStartMeeting} 
              isCollapsed={false} 
            />
          )}

          {mode === "live" && activeMeetingId && (
            <>
              <div className="text-sm font-medium text-blue-600 mb-2">
                Live Transcription Session
              </div>
              <TranscriptionDisplay 
                meetingId={activeMeetingId} 
                onStop={handleStopMeeting}
                isLive={true}
              />
            </>
          )}

          {mode === "history" && selectedHistoricalMeeting && (
            <>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Historical Meeting View
              </div>
              <TranscriptionDisplay 
                meetingId={selectedHistoricalMeeting.id}
                isLive={false}
                title={selectedHistoricalMeeting.title || `Meeting ${selectedHistoricalMeeting.nativeMeetingId}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
} 