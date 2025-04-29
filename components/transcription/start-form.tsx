"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { startTranscription, stopTranscription } from "@/lib/transcription-service"
import { useState } from "react"
import { parseMeetingUrl } from "@/lib/utils"

interface StartFormProps {
  onStart: (meetingId: string) => void
  isCollapsed: boolean
}

export function StartForm({ onStart, isCollapsed }: StartFormProps) {
  const [meetingUrl, setMeetingUrl] = useState("")
  const [language, setLanguage] = useState("auto")
  const [botName, setBotName] = useState("Vexa")
  const [isLoading, setIsLoading] = useState(false)
  const [isStoppingBot, setIsStoppingBot] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingBotInfo, setExistingBotInfo] = useState<{ platform: string; nativeMeetingId: string } | null>(null)

  if (isCollapsed) {
    return null
  }

  const handleStopExistingBot = async () => {
    if (!existingBotInfo) return;
    
    try {
      setIsStoppingBot(true);
      const meetingId = `${existingBotInfo.platform}/${existingBotInfo.nativeMeetingId}`;
      await stopTranscription(meetingId);
      setExistingBotInfo(null);
      setError(null);
    } catch (err: any) {
      setError(`Failed to stop existing bot: ${err.message}`);
    } finally {
      setIsStoppingBot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!meetingUrl) {
      setError("Please enter a meeting URL")
      return
    }

    // Basic URL validation for Google Meet
    try {
      const url = new URL(meetingUrl)
      if (url.hostname !== "meet.google.com") {
        setError("Please enter a valid Google Meet URL. Currently, only Google Meet is supported.")
        return
      }
    } catch (e) {
      setError("Please enter a valid URL (e.g., https://meet.google.com/xxx-xxxx-xxx)")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setExistingBotInfo(null)

      console.log("Starting transcription for meeting URL:", meetingUrl);
      const result = await startTranscription(meetingUrl, language, botName)
      console.log("Transcription started successfully, meetingId:", result.meetingId);

      if (result.success) {
        onStart(result.meetingId)
      } else {
        setError("Failed to start transcription bot")
      }
    } catch (err: any) {
      console.error("Start error:", err);
      
      // Check if this is the existing bot error
      if (err.name === "ExistingBotError") {
        try {
          // Try to parse the meeting URL to extract platform and ID
          const parsed = parseMeetingUrl(meetingUrl);
          setExistingBotInfo(parsed);
          setError("There is already a bot running for this meeting.");
        } catch (parseError) {
          setError(err.message || "An error occurred while starting the transcription bot");
        }
      } else {
        setError(err.message || "An error occurred while starting the transcription bot");
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full bg-white shadow-sm border border-slate-200 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Start Transcription Bot</CardTitle>
        <CardDescription>Enter a Google Meet URL to add a transcription bot to your meeting</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="meeting-url" className="font-medium">Google Meet URL</Label>
            <Input
              id="meeting-url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Currently, only Google Meet is supported. Support for other platforms is coming soon.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="font-medium">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">None (Auto-detect)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="nl">Dutch</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              If set to "None", language will be automatically detected at the beginning of the meeting.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-name" className="font-medium">Bot Name (Optional)</Label>
            <Input
              id="bot-name"
              placeholder="Vexa"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the name the bot will use when appearing in the meeting.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {existingBotInfo && (
            <div className="flex gap-3 items-center">
              <Button 
                type="button" 
                onClick={handleStopExistingBot} 
                variant="destructive"
                disabled={isStoppingBot}
              >
                {isStoppingBot ? "Stopping..." : "Stop Existing Bot"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Stop the existing bot before adding a new one
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
            disabled={isLoading || isStoppingBot}
          >
            {isLoading ? "Starting Bot..." : "Add Bot to Meeting"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
