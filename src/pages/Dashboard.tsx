import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"
import { TransactionDialog } from "@/components/transactions/TransactionDialog"

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your advanced analytics and expense overview.</p>
        </div>
        <TransactionDialog />
      </div>
      
      <AnalyticsCharts />
    </div>
  )
}
