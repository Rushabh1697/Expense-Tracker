import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { CreateAccountDialog } from "@/components/bank/CreateAccountDialog"
import { BankAccountCard } from "@/components/bank/BankAccountCard"
import { Landmark } from "lucide-react"

export function Bank() {
  const accounts = useLiveQuery(() => db.bankAccounts.toArray())

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
    </div>
  )
}
