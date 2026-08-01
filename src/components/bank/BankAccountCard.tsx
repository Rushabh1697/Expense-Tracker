import { useState } from 'react'
import type { BankAccount } from '@/lib/db'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Landmark, CreditCard, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react'
import { CreateAccountDialog } from './CreateAccountDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BankAccountCardProps {
  account: BankAccount
}

export function BankAccountCard({ account }: BankAccountCardProps) {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [updateType, setUpdateType] = useState<'deposit' | 'withdraw'>('deposit')

  const getIcon = () => {
    switch (account.accountType) {
      case 'checking': return <Landmark className="h-5 w-5 text-blue-500" />
      case 'savings': return <PiggyBank className="h-5 w-5 text-emerald-500" />
      case 'credit': return <CreditCard className="h-5 w-5 text-rose-500" />
      default: return <Wallet className="h-5 w-5 text-purple-500" />
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return

    const value = Number(amount)
    const newBalance = updateType === 'deposit' 
      ? account.balance + value 
      : account.balance - value

    try {
      await db.bankAccounts.update(account.id!, {
        balance: newBalance,
        updatedAt: Date.now()
      })
      setIsUpdateOpen(false)
      setAmount('')
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this bank account? This cannot be undone.")) {
      try {
        await db.bankAccounts.update(account.id!, { isDeleted: true, isSynced: false, updatedAt: Date.now() })
      } catch (error) {
        console.error("Failed to delete account:", error)
      }
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2 min-w-0">
          <div className="shrink-0">{getIcon()}</div>
          <span className="truncate">{account.name}</span>
        </CardTitle>
        <div className="flex items-center gap-1 shrink-0">
          <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-primary/10 text-primary hidden sm:block">
            {account.accountType}
          </div>
          <CreateAccountDialog 
            account={account} 
            mode="edit" 
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Edit2 className="h-3 w-3" />
              </Button>
            } 
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {account.accountNumber && (
          <div className="text-sm text-muted-foreground mt-1">
            A/C: {account.accountNumber}
          </div>
        )}
        <div className="text-3xl font-bold mt-2">
          ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Edit2 className="h-3 w-3" />
              Update Balance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Update Balance: {account.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={updateType === 'deposit' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setUpdateType('deposit')}
                >
                  <ArrowDownRight className="h-4 w-4" /> Deposit
                </Button>
                <Button
                  type="button"
                  variant={updateType === 'withdraw' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setUpdateType('withdraw')}
                >
                  <ArrowUpRight className="h-4 w-4" /> Withdraw
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="pl-7" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Confirm {updateType}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
