import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTranscriptForDownload } from "@/utils/download-utils";
import { TranscriptionSegment } from "@/lib/transcription-service";
import ReactMarkdown from 'react-markdown';
import { StructureResponse } from "@/app/api/generate-structure/route";
import { HtmlResponse, HtmlScreen } from "@/app/api/generate-html/route";
import DesignPreviewCard from "./DesignPreviewCard";

export default function PreviewGenerator({ segments }: { segments: TranscriptionSegment[] }) {
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [executiveSummary, setExecutiveSummary] = useState<string>("");
    const [screens, setScreens] = useState<HtmlScreen[]>([]);
    const [structure, setStructure] = useState<StructureResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [useMock, setUseMock] = useState(false);

    useEffect(() => {
        if (segments) {
            const text = formatTranscriptForDownload(segments, true, true)
            setTranscription(text)
        }
    }, [segments]);

    useEffect(() => {
        const generateHtml = async () => {
            if (structure) {
                setLoadingPreview(true);
                try {
                    const response = await fetch("/api/generate-html", {
                        method: useMock ? "GET" : "POST",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: useMock ? undefined : JSON.stringify(structure),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        const html = data.replace(/```json\n|\n```|`/g, ''); // Remove all backticks and code block markers
                        const htmlData: HtmlResponse = JSON.parse(html);
                        console.log(htmlData);
                        setScreens(htmlData.screens || []);
                        setLoadingPreview(false);
                    }
                    else {
                        setError("Error creating the HTML pages. Please try again.");
                        setLoadingPreview(false);
                    }
                } catch (err) {
                    console.error("Error generating preview", err);
                    setError("Error creating the HTML pages. Please try again.");
                    setLoadingPreview(false);
                }
            }
        };
        generateHtml();
    }, [structure]);

    const generatePreview = async (useMockAI: boolean) => {
        setLoading(true);
        setError(null);
        setUseMock(useMockAI);
        const mock = await fetch("/mocks/conversation.txt");
        const text = await mock.text();
        setTranscription(text)
        try {
            const response = await fetch("/api/generate-structure", {
                method: useMockAI ? "GET" : "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: useMockAI ? undefined : JSON.stringify({ transcript: text }),
            });
            const data = await response.json();
            if (response.ok) {
                const gptResponse = data.replace(/```json\n|\n```|`/g, ''); // Remove all backticks and code block markers
                const structureData: StructureResponse = JSON.parse(gptResponse);
                console.log(structureData);
                setExecutiveSummary(structureData.summary || '');
                setStructure(structureData);
            }
            else {
                console.error("Error generating preview", data);
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
                    onClick={() => generatePreview(false)}
                    size="sm"
                    className="h-7 text-xs py-0 px-2"
                    disabled={loading || !transcription}
                >
                    Generate preview with AI
                </Button>
                <Button
                    onClick={() => generatePreview(true)}
                    size="sm"
                    className="h-7 text-xs py-0 px-2"
                    disabled={loading || !transcription}
                >
                    Generate with Mock
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
                        <div className="flex flex-col h-full">
                            <div className="h-1/2 overflow-y-auto">
                                {executiveSummary && (
                                    <div className="prose max-w-none mb-4 bg-white p-4 rounded-lg shadow-sm">
                                        <h2 className="text-base font-semibold mb-3 text-gray-900">Executive Summary</h2>
                                        <div className="text-sm text-gray-700">
                                            <ReactMarkdown components={{
                                                h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mb-2" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />
                                            }}>
                                                {executiveSummary}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="h-1/2 overflow-y-auto border-t border-gray-200 pt-2">
                                {loadingPreview ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <h2 className="text-sm font-medium">Screens</h2>
                                        <div className="flex-1 overflow-auto">
                                            <div className="flex flex-row gap-4 -mt-2 pt-2">
                                                {screens.map((screen, index) => (
                                                    <div key={index} className="flex-shrink-0 border border-gray-200 rounded-lg p-4 bg-white">
                                                        <DesignPreviewCard {...screen} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
