import { BackupRestore } from "@/components/settings/BackupRestore"

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage app settings, offline sync, and backup/restore.</p>
      </div>
      
      <div className="grid gap-6">
        <BackupRestore />
      </div>
    </div>
  )
}
