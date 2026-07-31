import { useState } from "react"
import { Download, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import * as z from "zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { db } from "@/lib/db"

const backupSchema = z.object({
  version: z.number(),
  timestamp: z.number(),
  data: z.object({
    transactions: z.array(z.any()),
    categories: z.array(z.any()),
    savingsGoals: z.array(z.any()),
  })
})

export function BackupRestore() {
  const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" })

  const handleExport = async () => {
    try {
      const transactions = await db.transactions.toArray()
      const categories = await db.categories.toArray()
      const savingsGoals = await db.savingsGoals.toArray()

      const backupData = {
        version: 1,
        timestamp: Date.now(),
        data: {
          transactions,
          categories,
          savingsGoals
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus({ type: "success", message: "Backup successfully exported." })
    } catch (error) {
      console.error(error)
      setStatus({ type: "error", message: "Failed to create backup." })
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content)
        
        // Validate with zod
        const validated = backupSchema.parse(parsed)

        // Clear existing and restore
        await db.transaction('rw', db.transactions, db.categories, db.savingsGoals, async () => {
          await db.transactions.clear()
          await db.categories.clear()
          await db.savingsGoals.clear()

          if (validated.data.transactions.length > 0) await db.transactions.bulkAdd(validated.data.transactions)
          if (validated.data.categories.length > 0) await db.categories.bulkAdd(validated.data.categories)
          if (validated.data.savingsGoals.length > 0) await db.savingsGoals.bulkAdd(validated.data.savingsGoals)
        })

        setStatus({ type: "success", message: "Data successfully restored from backup." })
      } catch (error) {
        console.error(error)
        setStatus({ type: "error", message: "Invalid backup file. Ensure it is a valid JSON export." })
      }
    }
    reader.readAsText(file)
    // reset input
    e.target.value = ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Safeguard your data by exporting a local JSON snapshot. You can restore your data from a previous backup file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.type === "success" && (
          <Alert className="border-emerald-500 text-emerald-600 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 stroke-emerald-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
        {status.type === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleExport} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export Backup
        </Button>
        <div className="relative w-full sm:w-auto">
          <Input 
            type="file" 
            accept=".json" 
            onChange={handleImport} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Restore from JSON
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
