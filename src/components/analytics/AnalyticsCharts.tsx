import { useLiveQuery } from "dexie-react-hooks"
import { useMemo, useState } from "react"
import { format, subDays, subMonths, subYears, isAfter, isBefore } from "date-fns"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from "recharts"
import { ArrowDownIcon, ArrowUpIcon, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"

type Period = "week" | "month" | "year"

export function AnalyticsCharts() {
  const [period, setPeriod] = useState<Period>("month")
  
  const transactions = useLiveQuery(() => db.transactions.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())

  const analyticsData = useMemo(() => {
    if (!transactions || !categories) return null

    const now = new Date()
    let startDate = new Date()
    let prevStartDate = new Date()
    let prevEndDate = new Date()

    if (period === "week") {
      startDate = subDays(now, 7)
      prevStartDate = subDays(startDate, 7)
      prevEndDate = startDate
    } else if (period === "month") {
      startDate = subMonths(now, 1)
      prevStartDate = subMonths(startDate, 1)
      prevEndDate = startDate
    } else if (period === "year") {
      startDate = subYears(now, 1)
      prevStartDate = subYears(startDate, 1)
      prevEndDate = startDate
    }

    const currentPeriodTxs = transactions.filter(t => isAfter(new Date(t.date), startDate) && isBefore(new Date(t.date), now) || t.date === format(now, 'yyyy-MM-dd'))
    const previousPeriodTxs = transactions.filter(t => isAfter(new Date(t.date), prevStartDate) && isBefore(new Date(t.date), prevEndDate))

    const currentExpenses = currentPeriodTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const currentIncome = currentPeriodTxs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    
    const previousExpenses = previousPeriodTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    
    const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0
    
    // Category Breakdown (Pie Chart)
    const expensesByCategory = currentPeriodTxs
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const pieData = Object.entries(expensesByCategory).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === parseInt(catId))
      return {
        name: cat?.name || "Unknown",
        value: amount,
        color: cat?.color || "#ccc"
      }
    }).sort((a, b) => b.value - a.value)

    const topCategory = pieData[0]?.name || "N/A"

    // Time Series Data (Bar/Line Chart)
    const timeSeriesDataMap = currentPeriodTxs.reduce((acc, t) => {
      const dateKey = period === "year" ? format(new Date(t.date), "MMM yyyy") : format(new Date(t.date), "MMM dd")
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, income: 0, expense: 0, savings: 0 }
      acc[dateKey][t.type] += t.amount
      return acc
    }, {} as Record<string, any>)

    const timeSeriesData = Object.values(timeSeriesDataMap)

    return {
      currentExpenses,
      currentIncome,
      expenseChange,
      pieData,
      timeSeriesData,
      topCategory,
    }
  }, [transactions, categories, period])

  if (!analyticsData) return <div className="h-[400px] rounded-xl border bg-card/50 animate-pulse" />

  const { currentExpenses, currentIncome, expenseChange, pieData, timeSeriesData, topCategory } = analyticsData
  const netSavings = currentIncome - currentExpenses

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Overview</h3>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">+${currentIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-${currentExpenses.toFixed(2)}</div>
            <div className="flex items-center mt-1">
              {expenseChange > 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-destructive mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-emerald-500 mr-1" />
              )}
              <p className="text-xs text-muted-foreground">
                {Math.abs(expenseChange).toFixed(1)}% from previous {period}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {netSavings >= 0 ? "+" : "-"}${Math.abs(netSavings).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Spending Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCategory}</div>
            <p className="text-xs text-muted-foreground">Highest expense area</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Income & Expenses Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data for this period</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => `$${Number(val).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Savings Trend</CardTitle>
          <CardDescription>Your savings growth trajectory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
             {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} dot={false} name="Savings Transfers" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data for this period</div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
