import { MOCK_USER } from "@/lib/config"
import { AppLayout } from "@/components/layout/app-layout"
import { ApiKeyModal } from "@/components/transcription/api-key-modal"

export default function Home() {
  return (
    <>
      <ApiKeyModal />
      <AppLayout user={MOCK_USER as any} />
    </>
  )
}
