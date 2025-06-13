import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import { Meeting, getMeetingTranscript, type TranscriptionData, type TranscriptionSegment } from "@/lib/transcription-service"
import PreviewGenerator from "../transcription/PreviewGenerator"
import { useEffect, useState } from "react"

interface HistoryModeProps {
    meeting: Meeting
}

export function HistoryMode({ meeting }: HistoryModeProps) {
    const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
    const [segments, setSegments] = useState<TranscriptionSegment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchHistoricalTranscript = async () => {
            if (!meeting.id) return

            setIsLoading(true)
            setError(null)

            try {
                const data = await getMeetingTranscript(meeting.id)
                setSegments(data.segments)
                setTranscription(data)
            } catch (err) {
                console.error("Error fetching historical transcript:", err)
                setError("Failed to load transcript")
            } finally {
                setIsLoading(false)
            }
        }

        fetchHistoricalTranscript()
    }, [meeting.id])

    return (
        <div className="flex-1 flex h-full gap-4">
            <div className="w-1/2">
                <TranscriptionDisplay
                    meetingId={meeting.id}
                    isLive={false}
                    title={meeting.title || `Meeting ${meeting.nativeMeetingId}`}
                    transcription={transcription}
                    segments={segments}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
            <div className="w-1/2">
                <PreviewGenerator segments={segments} meetingId={meeting.id} />
            </div>
        </div>
    )
} 