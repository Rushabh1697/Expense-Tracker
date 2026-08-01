import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import * as Icons from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db, type Category } from "@/lib/db"
import { cn } from "@/lib/utils"

const COMMON_ICONS = [
  "Home", "Car", "Coffee", "ShoppingCart", "Utensils", "Smartphone", "HeartPulse", 
  "GraduationCap", "Plane", "Gamepad2", "Briefcase", "PiggyBank", "Wallet", "CreditCard",
  "Music", "Shirt", "Film", "Monitor", "Gift", "Zap"
]

const COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
]

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.enum(["expense", "income", "savings", "bank"]),
  icon: z.string(),
  color: z.string(),
})

export function CategoryDialog({ category, mode = "create" }: { category?: Category, mode?: "create" | "edit" }) {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      type: category?.type || "expense",
      icon: category?.icon || "Home",
      color: category?.color || "#ef4444",
    },
  })

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    try {
      if (mode === "create") {
        await db.categories.add({
          name: values.name,
          type: values.type,
          icon: values.icon,
          color: values.color,
          isSynced: false,
          updatedAt: Date.now(),
        })
      } else if (category?.id) {
        await db.categories.update(category.id, {
          name: values.name,
          type: values.type,
          icon: values.icon,
          color: values.color,
          updatedAt: Date.now(),
        })
      }
      if (mode === "create") form.reset()
      setOpen(false)
    } catch (error) {
      console.error("Failed to save category", error)
    }
  }

  const selectedIconName = form.watch("icon")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SelectedIcon = (Icons as any)[selectedIconName] || Icons.Circle

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Icons.Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Icons.Edit2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Category" : "Edit Category"}</DialogTitle>
          <DialogDescription>
            Custom categories help you organize your finances effectively.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Icon <SelectedIcon className="h-4 w-4 text-muted-foreground" />
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto p-1">
                      {COMMON_ICONS.map((iconName) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const Icon = (Icons as any)[iconName] || Icons.Circle
                        const isSelected = field.value === iconName
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => field.onChange(iconName)}
                            className={cn(
                              "flex items-center justify-center p-2 rounded-md border hover:bg-muted transition-colors",
                              isSelected ? "border-primary bg-primary/10 text-primary" : "border-transparent"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </button>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => field.onChange(c.value)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                            field.value === c.value ? "border-primary" : "border-transparent"
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full sm:w-auto">Save Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
