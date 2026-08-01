import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Interfaces for our database models
export interface Transaction {
  id?: string;
  amount: number;
  date: string;
  categoryId: string; // Foreign key is now a string
  type: 'expense' | 'income' | 'savings' | 'bank';
  note?: string;
  isSynced: boolean;
  isDeleted: boolean; // For tracking soft-deletes in the cloud
  updatedAt: number;
}

export interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'savings' | 'bank';
  isSynced: boolean;
  isDeleted: boolean;
  updatedAt: number;
}

export interface SavingsGoal {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isSynced: boolean;
  isDeleted: boolean;
  updatedAt: number;
}

export interface BankAccount {
  id?: string;
  name: string;
  accountNumber?: string;
  balance: number;
  accountType: 'checking' | 'savings' | 'credit' | 'other';
  isSynced: boolean;
  isDeleted: boolean;
  updatedAt: number;
}

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  bankAccounts!: Table<BankAccount, string>;

  constructor() {
    super('ExpenseTrackerDB');
    
    // Define tables and indexes. 
    // We use id instead of ++id since we will manually assign UUIDs.
    this.version(3).stores({
      transactions: 'id, date, categoryId, type, isSynced, isDeleted',
      categories: 'id, type, isSynced, isDeleted',
      savingsGoals: 'id, isSynced, isDeleted',
      bankAccounts: 'id, isSynced, isDeleted'
    }).upgrade(async trans => {
      // Migrate old numeric IDs to UUIDs
      const categoryIdMap = new Map();

      // Categories
      const categories = await trans.table('categories').toArray();
      for (const cat of categories) {
        if (typeof cat.id === 'number') {
          const newId = uuidv4();
          categoryIdMap.set(cat.id.toString(), newId);
          await trans.table('categories').update(cat.id, { id: newId, isDeleted: false, isSynced: false });
        }
      }

      // Transactions
      const transactions = await trans.table('transactions').toArray();
      for (const t of transactions) {
        if (typeof t.id === 'number' || typeof t.categoryId === 'number') {
          const newId = typeof t.id === 'number' ? uuidv4() : t.id;
          const mappedCatId = categoryIdMap.get(t.categoryId?.toString()) || t.categoryId?.toString();
          await trans.table('transactions').update(t.id, { 
            id: newId, 
            categoryId: mappedCatId, 
            isDeleted: false, 
            isSynced: false 
          });
        }
      }

      // Savings Goals
      const goals = await trans.table('savingsGoals').toArray();
      for (const g of goals) {
        if (typeof g.id === 'number') {
          await trans.table('savingsGoals').update(g.id, { id: uuidv4(), isDeleted: false, isSynced: false });
        }
      }

      // Bank Accounts
      const accounts = await trans.table('bankAccounts').toArray();
      for (const a of accounts) {
        if (typeof a.id === 'number') {
          await trans.table('bankAccounts').update(a.id, { id: uuidv4(), isDeleted: false, isSynced: false });
        }
      }
    });
  }
}

export const db = new ExpenseTrackerDB();
