import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTranscriptForDownload } from "@/utils/download-utils";
import { TranscriptionSegment } from "@/lib/transcription-service";

interface Screen {
    name: string;
    html: string;
    css: string;
}

interface PreviewResponse {
    ui: string;
    executiveSummary: string;
    screens: Screen[];
    error?: string;
}

export default function PreviewGenerator({ segments }: { segments: TranscriptionSegment[] }) {
    const [preview, setPreview] = useState<React.ReactNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [executiveSummary, setExecutiveSummary] = useState<string>("");
    const [screens, setScreens] = useState<Screen[]>([]);

    useEffect(() => {
        if (segments) {
            const text = formatTranscriptForDownload(segments, true, true)
            setTranscription(text)
        }
    }, [segments]);

    const generarPreview = async () => {
        setLoading(true);
        setPreview(null);
        try {
            /* const response = await fetch("/api/generate-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcription, cliente: "Adrian" }),
            }); */
            const response = await fetch("/api/generate-preview");

            const data: PreviewResponse = await response.json();
            console.log(data);
            console.log(response);

            if (response.ok) {
                console.log("Response ok");
                setExecutiveSummary(data.executiveSummary);
                setScreens(data.screens);
                localStorage.setItem('previewScreens', JSON.stringify(data.screens));
                setPreview(
                    <div className="space-y-6">
                        <div className="prose max-w-none">
                            <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
                            <div dangerouslySetInnerHTML={{ __html: data.executiveSummary }} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Screens</h2>
                            {data.screens.map((screen, index) => (
                                <div key={index} className="border p-4 rounded">
                                    <h3 className="font-semibold mb-2">{screen.name}</h3>
                                    <a
                                        href={`/preview/${index}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        View Preview
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            } else {
                console.error(data.error);
                setPreview(<p className="text-red-600">Error: {data.error}</p>);
            }
        } catch (err) {
            console.error(err);
            setPreview(<p className="text-red-600">Error al generar preview</p>);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <button
                onClick={generarPreview}
                className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                disabled={loading || !transcription}
            >
                Generar Preview
            </button>

            <div className="mt-6">
                {loading && (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                )}
                {!loading && executiveSummary && (
                    <div className="border mt-4 p-4 rounded shadow">{executiveSummary}</div>
                )}
            </div>
        </div>
    );
}
