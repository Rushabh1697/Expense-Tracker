import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { CategoryDialog } from "@/components/categories/CategoryDialog"
import { Tags, Trash2 } from "lucide-react"
import * as Icons from "lucide-react"
import { Button } from "@/components/ui/button"

export function Categories() {
  const categories = useLiveQuery(() => db.categories.toArray())

  async function deleteCategory(id: number) {
    if (confirm("Are you sure you want to delete this category?")) {
      await db.categories.delete(id)
    }
  }

  const renderCategoryList = (type: "expense" | "income" | "savings" | "bank", title: string) => {
    const list = categories?.filter(c => c.type === type) || []
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2">{title}</h3>
        {list.length === 0 ? (
          <p className="text-muted-foreground text-sm">No {type} categories yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(category => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const Icon = (Icons as any)[category.icon] || Icons.Circle
              return (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-4 rounded-xl border bg-card transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-full flex items-center justify-center text-white" 
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-lg">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CategoryDialog category={category} mode="edit" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(category.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Custom Categories</h2>
          <p className="text-muted-foreground">Manage your custom expense and income categories.</p>
        </div>
        <CategoryDialog />
      </div>

      {!categories && (
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl border bg-card/50 animate-pulse" />)}
          </div>
        </div>
      )}

      {categories?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card border-dashed text-center">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Tags className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Create custom categories to organize and track your finances your way.
          </p>
          <CategoryDialog />
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="space-y-8">
          {renderCategoryList("expense", "Expense Categories")}
          {renderCategoryList("income", "Income Categories")}
          {renderCategoryList("savings", "Savings Categories")}
          {renderCategoryList("bank", "Bank Categories")}
        </div>
      )}
    </div>
  )
}
