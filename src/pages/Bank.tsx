import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { CreateAccountDialog } from "@/components/bank/CreateAccountDialog"
import { BankAccountCard } from "@/components/bank/BankAccountCard"
import { Landmark, Trash2 } from "lucide-react"
import { TransactionDialog } from "@/components/transactions/TransactionDialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export function Bank() {
  const accounts = useLiveQuery(() => db.bankAccounts.toArray())
  const transactions = useLiveQuery(() => db.transactions.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())

  const bankTransactions = transactions?.filter(t => t.type === 'bank').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []

  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
          <p className="text-muted-foreground">Manage your accounts and track their balances.</p>
        </div>
        <CreateAccountDialog />
      </div>

      {accounts && accounts.length > 0 && (
        <div className="bg-card/50 backdrop-blur-xl border rounded-xl p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Net Balance</p>
            <h3 className="text-4xl font-bold text-primary">
              ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center hidden sm:flex">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
        </div>
      )}

      {!accounts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[200px] rounded-xl border bg-card/50 animate-pulse" />
          ))}
        </div>
      )}

      {accounts?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card border-dashed text-center">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Landmark className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No bank accounts yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Add your checking, savings, or credit card accounts to start tracking your total net worth.
          </p>
          <CreateAccountDialog />
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accounts.map(account => (
            <BankAccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {bankTransactions.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Recent Bank Transactions</h3>
          <div className="space-y-4">
            {bankTransactions.map(t => {
              const cat = categories?.find(c => c.id === parseInt(t.categoryId.toString()))
              return (
                <div key={t.id} className="flex justify-between items-center p-4 rounded-xl border bg-card/50">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat?.color || "#ccc" }} 
                      />
                      <span className="font-medium">{cat?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground ml-2">{format(new Date(t.date), "MMM d, yyyy")}</span>
                    </div>
                    {t.note && <span className="text-sm text-muted-foreground mt-1">{t.note}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-emerald-500">
                      +₹{t.amount.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <TransactionDialog transaction={t} mode="edit" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        onClick={async () => {
                          if (confirm("Delete this bank transaction?")) {
                            await db.transactions.delete(t.id!)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
