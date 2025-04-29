import { TranscriptionApp } from "@/components/transcription/transcription-app"
import { MOCK_USER } from "@/lib/config"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <TranscriptionApp user={MOCK_USER as any} />
    </main>
  )
}
