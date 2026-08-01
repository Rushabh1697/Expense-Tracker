import { Button } from "@/components/ui/button"
import { AlertCircle, Download } from "lucide-react"

export function ForceUpdateDialog({ updateUrl }: { updateUrl: string }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border shadow-2xl rounded-2xl max-w-md w-full p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Update Required</h2>
        <p className="text-muted-foreground">
          You are using an outdated version of the app. Please update to the latest version to continue securely.
        </p>
        
        <div className="pt-4 space-y-3">
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={() => {
              // On native Android, this will open the browser to the URL
              window.open(updateUrl, '_system')
            }}
          >
            <Download className="w-5 h-5" />
            Download Latest Version
          </Button>
          <p className="text-xs text-muted-foreground">
            Make sure to log in on the website to access the download.
          </p>
        </div>
      </div>
    </div>
  )
}
