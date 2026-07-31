import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { CreateGoalDialog } from "@/components/savings/CreateGoalDialog"
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard"
import { PiggyBank } from "lucide-react"

export function Savings() {
  const goals = useLiveQuery(() => db.savingsGoals.toArray())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monthly Savings Goals</h2>
          <p className="text-muted-foreground">Track your progress towards your financial goals.</p>
        </div>
        <CreateGoalDialog />
      </div>

      {!goals && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[400px] rounded-xl border bg-card/50 animate-pulse" />
          ))}
        </div>
      )}

      {goals?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card border-dashed text-center">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <PiggyBank className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No savings goals yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Create your first savings goal to start tracking your progress towards a new car, vacation, or emergency fund.
          </p>
          <CreateGoalDialog />
        </div>
      )}

      {goals && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map(goal => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  )
}
