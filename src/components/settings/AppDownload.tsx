import { useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function AppDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      // Get a signed URL valid for 60 seconds
      const { data, error } = await supabase.storage
        .from('app-releases')
        .createSignedUrl('expenzo-app.apk', 60)

      if (error || !data) {
        alert("Failed to generate download link. Ensure the app is uploaded to Supabase.")
        console.error(error)
        return
      }

      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = 'expenzo-app.apk'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Only show this on the web version, as native users already have the app installed
  if (isNative) return null

  return (
    <div className="bg-card/50 backdrop-blur-xl border rounded-xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Download Mobile App</h3>
          <p className="text-sm text-muted-foreground">
            Get the native Android app for a better experience.
          </p>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <p className="text-sm">
          Since you are logged in, you can securely download the latest version of the Expenzo Android application.
        </p>
      </div>
      <Button 
        onClick={handleDownload} 
        disabled={isDownloading}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        {isDownloading ? "Generating Link..." : "Download APK"}
      </Button>
    </div>
  )
}
