import { StartForm } from "@/components/transcription/start-form"

interface SetupModeProps {
    onStart: (meetingId: string) => void
}

export function SetupMode({ onStart }: SetupModeProps) {
    return (
        <StartForm
            onStart={onStart}
            isCollapsed={false}
        />
    )
} 