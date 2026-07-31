import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CircularProgress } from "@/components/ui/circular-progress"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Trash2 } from "lucide-react"
import { type SavingsGoal, db } from "@/lib/db"

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
  const isCompleted = goal.currentAmount >= goal.targetAmount

  async function addFunds(amount: number) {
    await db.savingsGoals.update(goal.id!, {
      currentAmount: goal.currentAmount + amount,
      updatedAt: Date.now()
    })
  }

  async function deleteGoal() {
    if (confirm("Are you sure you want to delete this goal?")) {
      await db.savingsGoals.delete(goal.id!)
    }
  }

  return (
    <Card className="flex flex-col relative overflow-hidden group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={deleteGoal}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle>{goal.name}</CardTitle>
        <CardDescription>
          {goal.deadline ? `Target by ${new Date(goal.deadline).toLocaleDateString()}` : "No specific deadline"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center py-6">
        <CircularProgress 
          value={goal.currentAmount} 
          max={goal.targetAmount} 
          size={140} 
          strokeWidth={12}
          colorClass={isCompleted ? "text-emerald-500" : "text-primary"}
        />
        
        <div className="mt-6 text-center w-full space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="font-medium">₹{goal.currentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target</span>
            <span className="font-medium">₹{goal.targetAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t mt-2">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-semibold text-primary">₹{remaining.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => addFunds(-50)} disabled={goal.currentAmount <= 0}>
          <Minus className="h-4 w-4 mr-1" /> ₹50
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => addFunds(50)}>
          <Plus className="h-4 w-4 mr-1" /> ₹50
        </Button>
      </CardFooter>
    </Card>
  )
}
