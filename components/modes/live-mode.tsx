import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import RealtimeTranscriptionProcessor from "../transcription/realtime-transcription-processor"

interface LiveModeProps {
    meetingId: string
    onStop: () => void
}

export function LiveMode({ meetingId, onStop }: LiveModeProps) {
    return (
        <div className="flex-1 flex flex-col h-full">
            <TranscriptionDisplay
                meetingId={meetingId}
                onStop={onStop}
                isLive={true}
            />

        </div>
    )
} 