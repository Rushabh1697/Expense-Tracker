import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { TransactionDialog } from "@/components/transactions/TransactionDialog"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const transactions = useLiveQuery(() => db.transactions.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate })
  
  const transactionsByDate = transactions?.reduce((acc, t) => {
    const dateStr = t.date
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(t)
    return acc
  }, {} as Record<string, typeof transactions>) || {}

  const getCategoryColor = (categoryId: string | number) => {
    const cat = categories?.find(c => c.id === parseInt(categoryId.toString()))
    return cat ? cat.color : "#94a3b8"
  }

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const selectedTransactions = transactionsByDate[selectedDateStr] || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">View your transactions in a monthly calendar.</p>
        </div>
        <TransactionDialog />
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
            {format(currentDate, "MMMM yyyy")}
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[120px]">
          {dateInterval.map((date, i) => {
            const dateStr = format(date, "yyyy-MM-dd")
            const dayTransactions = transactionsByDate[dateStr] || []
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isTodayDate = isToday(date)
            
            return (
              <div 
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "p-2 border-b border-r transition-colors hover:bg-muted/50 cursor-pointer flex flex-col",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                  i % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isTodayDate ? "bg-primary text-primary-foreground" : ""
                  )}>
                    {format(date, "d")}
                  </span>
                  {dayTransactions.length > 0 && (
                    <span className="text-xs text-muted-foreground">{dayTransactions.length} items</span>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayTransactions.slice(0, 4).map((t, index) => (
                    <div 
                      key={index}
                      className="text-[10px] px-1.5 py-1 rounded truncate text-white shadow-sm flex justify-between"
                      style={{ backgroundColor: getCategoryColor(t.categoryId) }}
                    >
                      <span>{t.type === 'expense' ? '-' : '+'}₹{t.amount}</span>
                    </div>
                  ))}
                  {dayTransactions.length > 4 && (
                    <div className="text-[10px] text-muted-foreground text-center pt-1">
                      +{dayTransactions.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Transactions for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions on this day.</p>
            ) : (
              selectedTransactions.map((t, index) => {
                const cat = categories?.find(c => c.id === parseInt(t.categoryId.toString()))
                return (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg border bg-card">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat?.color || "#ccc" }} 
                        />
                        <span className="font-medium">{cat?.name || "Unknown"}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted uppercase">
                          {t.type}
                        </span>
                      </div>
                      {t.note && <span className="text-sm text-muted-foreground mt-1">{t.note}</span>}
                    </div>
                    <span className={cn(
                      "font-semibold",
                      t.type === "expense" ? "text-destructive" : "text-emerald-500"
                    )}>
                      {t.type === "expense" ? "-" : "+"}₹{t.amount.toFixed(2)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
