import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LoginButton } from "@/components/auth/login-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCK_MODE } from "@/lib/config"

export default async function LoginPage() {
  // If mock mode is enabled, redirect to home page
  if (MOCK_MODE) {
    redirect("/")
  }

  const supabase = createServerClient()

  // Check if user is already authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If authenticated, redirect to home page
  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Meeting Transcription App</CardTitle>
          <CardDescription>Sign in to start transcribing your meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  )
}
