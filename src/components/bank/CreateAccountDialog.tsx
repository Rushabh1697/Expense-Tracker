import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { Plus } from 'lucide-react'

import type { BankAccount } from '@/lib/db'

import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accountNumber: z.string().optional(),
  balance: z.coerce.number().min(0, 'Balance must be positive'),
  accountType: z.enum(['checking', 'savings', 'credit', 'other']),
})

interface CreateAccountDialogProps {
  account?: BankAccount;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
}

export function CreateAccountDialog({ account, mode = "create", trigger }: CreateAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || '',
      accountNumber: account?.accountNumber || '',
      balance: account?.balance || 0,
      accountType: account?.accountType || 'checking',
    },
  })

  async function onSubmit(values: z.infer<typeof accountSchema>) {
    try {
      if (mode === "edit" && account?.id) {
        await db.bankAccounts.update(account.id, {
          ...values,
          isSynced: false,
          updatedAt: Date.now(),
        })
      } else {
        await db.bankAccounts.add({
          id: uuidv4(),
          ...values,
          isSynced: false,
          isDeleted: false,
          updatedAt: Date.now(),
        })
      }
      setOpen(false)
      if (mode === "create") form.reset()
    } catch (error) {
      console.error(`Failed to ${mode} account:`, error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Bank Account" : "Edit Bank Account"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new bank account to keep track of its balance." : "Update your bank account details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Chase Checking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Balance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                      <Input type="number" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "create" ? "Create Account" : "Save Changes"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
