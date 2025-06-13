import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import { Meeting } from "@/lib/transcription-service"

interface HistoryModeProps {
    meeting: Meeting
}

export function HistoryMode({ meeting }: HistoryModeProps) {
    return (
        <div className="flex-1 flex flex-col h-full">
            <TranscriptionDisplay
                meetingId={meeting.id}
                isLive={false}
                title={meeting.title || `Meeting ${meeting.nativeMeetingId}`}
            />
        </div>
    )
} 