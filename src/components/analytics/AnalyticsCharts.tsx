import { useLiveQuery } from "dexie-react-hooks"
import { useMemo, useState } from "react"
import { format, subDays, subMonths, subYears, isAfter, isBefore } from "date-fns"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from "recharts"
import { ArrowDownIcon, ArrowUpIcon, TrendingUp } from "lucide-react"
import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

function AnimatedNumber({ value, prefix = "", decimals = 0 }: { value: number, prefix?: string, decimals?: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 })
  const display = useTransform(spring, (current) => {
    return prefix + current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

type Period = "week" | "month" | "year"
const periodLabels = ["Weekly", "Monthly", "Yearly"] as const
type PeriodLabel = typeof periodLabels[number]

export function AnalyticsCharts() {
  const [activeTab, setActiveTab] = useState<PeriodLabel>("Monthly")
  const period: Period = activeTab === "Weekly" ? "week" : activeTab === "Monthly" ? "month" : "year"

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
      .filter(t => t.type === "expense" || t.type === "income" || t.type === "bank")
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
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, income: 0, expense: 0, savings: 0, bank: 0 }
      acc[dateKey][t.type] += t.amount
      return acc
    }, {} as Record<string, any>)

    const timeSeriesData = Object.values(timeSeriesDataMap)

    // Cumulative Savings logic for Line Chart
    let cumulative = 0
    const sortedTimeSeriesData = timeSeriesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const cumulativeData = sortedTimeSeriesData.map(d => {
      cumulative += d.savings
      return { ...d, cumulativeSavings: cumulative }
    })

    return {
      currentExpenses,
      currentIncome,
      expenseChange,
      pieData,
      timeSeriesData: cumulativeData,
      topCategory,
    }
  }, [transactions, categories, period])

  if (!analyticsData) return <div className="h-[400px] rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-[16px] animate-pulse" />

  const { currentExpenses, currentIncome, expenseChange, pieData, timeSeriesData, topCategory } = analyticsData
  const netSavings = currentIncome - currentExpenses

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">Overview</h3>

        {/* Sliding Pill Navigation */}
        <div className="flex bg-[rgba(255,255,255,0.03)] backdrop-blur-[16px] border border-white/10 p-1 rounded-full relative overflow-hidden">
          {periodLabels.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-1.5 text-sm font-medium transition-colors z-10 ${activeTab === tab ? "text-white" : "text-muted-foreground hover:text-white"
                }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500 [text-shadow:0_0_10px_rgba(16,185,129,0.3)]">
              +<AnimatedNumber value={currentIncome} prefix="₹" decimals={2} />
            </div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive [text-shadow:0_0_10px_rgba(244,63,94,0.3)]">
              -<AnimatedNumber value={currentExpenses} prefix="₹" decimals={2} />
            </div>
            <div className="flex items-center mt-1">
              {expenseChange > 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-destructive mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-emerald-500 mr-1" />
              )}
              <p className="text-xs text-muted-foreground">
                <AnimatedNumber value={Math.abs(expenseChange)} decimals={1} />% from previous {period}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? "text-emerald-500 [text-shadow:0_0_10px_rgba(16,185,129,0.3)]" : "text-destructive [text-shadow:0_0_10px_rgba(244,63,94,0.3)]"}`}>
              {netSavings >= 0 ? "+" : "-"}<AnimatedNumber value={Math.abs(netSavings)} prefix="₹" decimals={2} />
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
            <div className="text-2xl font-bold truncate">{topCategory}</div>
            <p className="text-xs text-muted-foreground">Highest allocation area</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Income, Expenses, Bank & Savings Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(9, 13, 22, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      name="Income"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="expense"
                      fill="#F43F5E"
                      radius={[4, 4, 0, 0]}
                      name="Expense"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="savings"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      name="Savings"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="bank"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                      name="Bank"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
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
            <CardTitle>Income, Expenses & Bank by Category</CardTitle>
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
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => `₹${Number(val).toFixed(2)}`} contentStyle={{ backgroundColor: 'rgba(9, 13, 22, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(9, 13, 22, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="cumulativeSavings"
                    stroke="#6366F1"
                    strokeWidth={4}
                    dot={{ r: 4, fill: "#6366F1", strokeWidth: 2, stroke: "#090D16" }}
                    activeDot={{ r: 6, fill: "#6366F1", strokeWidth: 0 }}
                    name="Cumulative Savings"
                    isAnimationActive={true}
                    animationDuration={2500}
                    animationEasing="ease-in-out"
                  />
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
