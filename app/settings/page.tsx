import { ApiKeySettings } from "@/components/transcription/api-key-settings"

export const metadata = {
  title: "API Settings - Vexa",
  description: "Configure your Vexa API settings",
}

export default function SettingsPage() {
  return (
    <div className="container py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Settings</h1>
      
      <div className="max-w-2xl mx-auto">
        <p className="text-muted-foreground mb-6">
          Configure your Vexa API settings. Your API key will be stored securely in your browser's cookies.
        </p>
        
        <ApiKeySettings />
      </div>
    </div>
  )
} 