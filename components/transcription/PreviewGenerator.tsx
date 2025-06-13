import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTranscriptForDownload } from "@/utils/download-utils";
import { TranscriptionSegment } from "@/lib/transcription-service";
import ReactMarkdown from 'react-markdown';

interface Screen {
    name: string;
    html: string;
    css: string;
}

interface PreviewResponse {
    ui: string;
    executiveSummary: string;
    error?: string;
}

interface UiData {
    "title": string,
    "description": string,
    "colorPalette": string,
    "brandIdentity": string,
    "targetAudience": string,
    "summary": string,
    "generalCss": string,
    "screens": Screen[]
}

export default function PreviewGenerator({ segments }: { segments: TranscriptionSegment[] }) {
    const [preview, setPreview] = useState<React.ReactNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [executiveSummary, setExecutiveSummary] = useState<string>("");
    const [screens, setScreens] = useState<Screen[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (segments) {
            const text = formatTranscriptForDownload(segments, true, true)
            setTranscription(text)
        }
    }, [segments]);

    const generatePreview = async () => {
        setLoading(true);
        setPreview(null);
        setError(null);
        try {
            const response = await fetch("/api/generate-preview", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcription: transcription, cliente: "Adrian" }),
            });
            const data: PreviewResponse = await response.json();

            if (response.ok) {
                try {
                    const ui = data.ui.replace(/```json\n|\n```|`/g, ''); // Remove all backticks and code block markers
                    const uiData: UiData = JSON.parse(ui);
                    setExecutiveSummary(data.executiveSummary || '');
                    setScreens(uiData.screens || []);
                    localStorage.setItem('previewScreens', JSON.stringify(uiData.screens));
                    setPreview(
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Screens</h2>
                                {uiData.screens.map((screen: Screen, index: number) => (
                                    <div key={index} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
                                        <h3 className="text-xs font-medium mb-1">{screen.name}</h3>
                                        <a
                                            href={`/preview/${index}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            View Preview
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } catch (err) {
                    console.error("Error parsing UI data:", err);
                    setError("Error parsing UI data. Please try again.");
                }
            } else {
                setError(data.error || "Failed to generate preview");
            }
        } catch (err) {
            setError("Error generating preview");
            console.error("Error generating preview", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border border-gray-200 shadow-sm flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between py-1 px-3 border-b">
                <div className="flex items-center gap-2">
                    {loading && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
                    <span className="text-xs font-medium">Preview Generator</span>
                </div>
                <Button
                    onClick={generatePreview}
                    size="sm"
                    className="h-7 text-xs py-0 px-2"
                    disabled={loading || !transcription}
                >
                    Generate Preview
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                {error && (
                    <Alert variant="destructive" className="mx-3 mt-1 py-1">
                        <AlertCircle className="h-3 w-3" />
                        <AlertTitle className="text-xs">Error</AlertTitle>
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex-1 overflow-y-auto border-t border-gray-200 bg-gray-50 p-2 mt-1">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : (
                        <>
                            {executiveSummary && (
                                <div className="prose max-w-none mb-4 bg-white p-4 rounded-lg shadow-sm">
                                    <h2 className="text-base font-semibold mb-3 text-gray-900">Executive Summary</h2>
                                    <div className="text-sm text-gray-700">
                                        <ReactMarkdown>{executiveSummary}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            {preview}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
