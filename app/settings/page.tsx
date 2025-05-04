import { ApiKeySettings } from "@/components/transcription/api-key-settings"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "API Settings - Vexa",
  description: "Configure your Vexa API settings",
}

export default function SettingsPage() {
  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">API Settings</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <p className="text-muted-foreground mb-6">
          Configure your Vexa API settings. Your API key will be stored securely in your browser's cookies.
        </p>
        
        <ApiKeySettings />
      </div>
    </div>
  )
} 