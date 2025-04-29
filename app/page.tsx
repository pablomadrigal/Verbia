import { MOCK_USER } from "@/lib/config"
import { AppLayout } from "@/components/layout/app-layout"

export default function Home() {
  return (
    <AppLayout user={MOCK_USER as any} />
  )
}
