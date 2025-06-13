import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import { getTranscription, stopTranscription, updateTranscriptionLanguage, type TranscriptionData, type TranscriptionSegment } from "@/lib/transcription-service"
import { useEffect, useRef, useState } from "react"
import PreviewGenerator from "../transcription/PreviewGenerator"

interface LiveModeProps {
    meetingId: string
    onStop: () => void
}

export function LiveMode({ meetingId, onStop }: LiveModeProps) {
    const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
    const [segments, setSegments] = useState<TranscriptionSegment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedLanguage, setSelectedLanguage] = useState<string>("auto")
    const [isChangingLanguage, setIsChangingLanguage] = useState(false)
    const pollingInterval = useRef<NodeJS.Timeout | null>(null)
    const retryCount = useRef(0)
    const MAX_RETRIES = 3

    const pollForUpdates = async () => {
        if (!meetingId) return

        setIsLoading(true)
        try {
            const data = await getTranscription(meetingId)
            retryCount.current = 0

            const changedSegmentIds = new Set<string>();
            setSegments((prevSegments) => {
                const prevSegmentsMap = new Map(prevSegments.map(s => [s.id, s]));

                data.segments.forEach(segment => {
                    const prevSegment = prevSegmentsMap.get(segment.id);
                    if (!prevSegment || prevSegment.text !== segment.text) {
                        changedSegmentIds.add(segment.id);
                    }
                });

                return [...data.segments].sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
            });

            if (data.language && data.language !== selectedLanguage && data.language !== "auto-detected") {
                setSelectedLanguage(data.language);
            }

            setTranscription(data)

            if (data.status !== "active") {
                if (pollingInterval.current) {
                    clearInterval(pollingInterval.current)
                    pollingInterval.current = null
                }

                if (data.status === "error") {
                    setError("Transcription service reported an error. Please try again.")
                }
            }
        } catch (err) {
            console.error("Error polling for transcription:", err)
            retryCount.current += 1
            if (retryCount.current >= MAX_RETRIES) {
                setError("Failed to update transcription after multiple attempts")
                if (pollingInterval.current) {
                    clearInterval(pollingInterval.current)
                    pollingInterval.current = null
                }
            } else {
                setError(`Failed to update transcription. Retrying... (${retryCount.current}/${MAX_RETRIES})`)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleStop = async () => {
        if (!meetingId) return
        try {
            setIsLoading(true)
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

    const handleLanguageChange = async (language: string) => {
        if (!meetingId) return;

        try {
            setIsChangingLanguage(true);
            setError(null);

            await updateTranscriptionLanguage(meetingId, language);
            setSelectedLanguage(language);
            setSegments([]);

        } catch (err) {
            console.error("Error updating language:", err);
            setError("Failed to update language. Please try again.");
        } finally {
            setIsChangingLanguage(false);
        }
    }

    useEffect(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current)
            pollingInterval.current = null
        }

        setSegments([])
        setTranscription(null)
        setError(null)

        if (meetingId) {
            pollForUpdates()
            pollingInterval.current = setInterval(pollForUpdates, 800)
        }

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current)
            }
        }
    }, [meetingId])

    return (
        <div className="flex-1 flex h-full gap-4">
            <div className="w-1/2">
                <TranscriptionDisplay
                    meetingId={meetingId}
                    onStop={handleStop}
                    isLive={true}
                    transcription={transcription}
                    segments={segments}
                    isLoading={isLoading}
                    error={error}
                    onLanguageChange={handleLanguageChange}
                    selectedLanguage={selectedLanguage}
                    isChangingLanguage={isChangingLanguage}
                />
            </div>
            <div className="w-1/2">
                <PreviewGenerator segments={segments} />
            </div>
        </div>
    )
} 