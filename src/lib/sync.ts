import { db } from './db'
import { supabase } from './supabase'

export async function pushToCloud() {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return

  const pushTable = async (tableName: 'transactions' | 'categories' | 'savingsGoals' | 'bankAccounts', sbTableName: string) => {
    const table = db[tableName] as any
    const unsynced = await table.filter((t: any) => !t.isSynced).toArray()
    
    if (unsynced.length === 0) return

    const payload = unsynced.map((t: any) => {
      const mapped = { 
        id: t.id,
        is_synced: true, 
        is_deleted: t.isDeleted, 
        updated_at: t.updatedAt,
        user_id: user.id
      } as any;

      if (t.amount !== undefined) mapped.amount = t.amount;
      if (t.date !== undefined) mapped.date = t.date;
      if (t.type !== undefined) mapped.type = t.type;
      if (t.note !== undefined) mapped.note = t.note;
      if (t.categoryId !== undefined) mapped.category_id = t.categoryId;
      
      if (t.name !== undefined) mapped.name = t.name;
      if (t.icon !== undefined) mapped.icon = t.icon;
      if (t.color !== undefined) mapped.color = t.color;
      
      if (t.targetAmount !== undefined) mapped.target_amount = t.targetAmount;
      if (t.currentAmount !== undefined) mapped.current_amount = t.currentAmount;
      if (t.deadline !== undefined) mapped.deadline = t.deadline;
      
      if (t.accountNumber !== undefined) mapped.account_number = t.accountNumber;
      if (t.balance !== undefined) mapped.balance = t.balance;
      if (t.accountType !== undefined) mapped.account_type = t.accountType;

      return mapped;
    })

    const { error } = await supabase.from(sbTableName).upsert(payload)
    
    if (!error) {
      await Promise.all(unsynced.map((t: any) => table.update(t.id, { isSynced: true })))
    } else {
      console.error(`Error syncing ${tableName}:`, error)
    }
  }

  await pushTable('categories', 'categories')
  await pushTable('transactions', 'transactions')
  await pushTable('savingsGoals', 'savings_goals')
  await pushTable('bankAccounts', 'bank_accounts')
}

export async function pullFromCloud() {
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user
  if (!user) return

  const lastSyncStr = localStorage.getItem('lastSyncTime')
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0
  let newLastSync = lastSync

  const pullTable = async (tableName: 'transactions' | 'categories' | 'savingsGoals' | 'bankAccounts', sbTableName: string) => {
    const table = db[tableName] as any
    
    const { data, error } = await supabase
      .from(sbTableName)
      .select('*')
      .gt('updated_at', lastSync)
      .order('updated_at', { ascending: true })

    if (error) {
      console.error(`Error pulling ${tableName}:`, error)
      return
    }

    if (data && data.length > 0) {
      for (const row of data) {
        const localObj: any = {
          id: row.id,
          isSynced: true,
          isDeleted: row.is_deleted,
          updatedAt: row.updated_at
        }

        if (row.amount !== undefined) localObj.amount = row.amount;
        if (row.date !== undefined) localObj.date = row.date;
        if (row.type !== undefined) localObj.type = row.type;
        if (row.note !== undefined) localObj.note = row.note;
        if (row.category_id !== undefined) localObj.categoryId = row.category_id;
        
        if (row.name !== undefined) localObj.name = row.name;
        if (row.icon !== undefined) localObj.icon = row.icon;
        if (row.color !== undefined) localObj.color = row.color;
        
        if (row.target_amount !== undefined) localObj.targetAmount = row.target_amount;
        if (row.current_amount !== undefined) localObj.currentAmount = row.current_amount;
        if (row.deadline !== undefined) localObj.deadline = row.deadline;
        
        if (row.account_number !== undefined) localObj.accountNumber = row.account_number;
        if (row.balance !== undefined) localObj.balance = row.balance;
        if (row.account_type !== undefined) localObj.accountType = row.account_type;

        // Remove undefined/null
        Object.keys(localObj).forEach(key => localObj[key] === null && delete localObj[key]);

        const existing = await table.get(row.id)
        if (!existing || existing.updatedAt < row.updated_at) {
          await table.put(localObj)
        }
        
        if (row.updated_at > newLastSync) {
          newLastSync = row.updated_at
        }
      }
    }
  }

  // Categories must be pulled before transactions
  await pullTable('categories', 'categories')
  await pullTable('transactions', 'transactions')
  await pullTable('savingsGoals', 'savings_goals')
  await pullTable('bankAccounts', 'bank_accounts')

  if (newLastSync > lastSync) {
    localStorage.setItem('lastSyncTime', newLastSync.toString())
  }
}

export async function syncAll() {
  try {
    await pushToCloud()
    await pullFromCloud()
  } catch (error) {
    console.error("Sync failed:", error)
  }
}
