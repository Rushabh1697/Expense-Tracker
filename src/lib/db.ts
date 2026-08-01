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
      transactions: '++id, date, categoryId, type, isSynced, isDeleted',
      categories: '++id, type, isSynced, isDeleted',
      savingsGoals: '++id, isSynced, isDeleted',
      bankAccounts: '++id, isSynced, isDeleted'
    }).upgrade(async trans => {
      // Migrate old numeric IDs to UUIDs
      const categoryIdMap = new Map();

      // Categories
      const categories = await trans.table('categories').toArray();
      for (const cat of categories) {
        if (typeof cat.id === 'number') {
          const newId = uuidv4();
          categoryIdMap.set(cat.id.toString(), newId);
          await trans.table('categories').delete(cat.id);
          cat.id = newId;
          cat.isDeleted = false;
          cat.isSynced = false;
          await trans.table('categories').add(cat);
        }
      }

      // Transactions
      const transactions = await trans.table('transactions').toArray();
      for (const t of transactions) {
        if (typeof t.id === 'number' || typeof t.categoryId === 'number') {
          const newId = typeof t.id === 'number' ? uuidv4() : t.id;
          const mappedCatId = categoryIdMap.get(t.categoryId?.toString()) || t.categoryId?.toString();
          
          if (typeof t.id === 'number') {
            await trans.table('transactions').delete(t.id);
          } else {
            await trans.table('transactions').delete(t.id); // delete string id to re-add just in case
          }
          
          t.id = newId;
          t.categoryId = mappedCatId;
          t.isDeleted = false;
          t.isSynced = false;
          await trans.table('transactions').add(t);
        }
      }

      // Savings Goals
      const goals = await trans.table('savingsGoals').toArray();
      for (const g of goals) {
        if (typeof g.id === 'number') {
          await trans.table('savingsGoals').delete(g.id);
          g.id = uuidv4();
          g.isDeleted = false;
          g.isSynced = false;
          await trans.table('savingsGoals').add(g);
        }
      }

      // Bank Accounts
      const accounts = await trans.table('bankAccounts').toArray();
      for (const a of accounts) {
        if (typeof a.id === 'number') {
          await trans.table('bankAccounts').delete(a.id);
          a.id = uuidv4();
          a.isDeleted = false;
          a.isSynced = false;
          await trans.table('bankAccounts').add(a);
        }
      }
    });
  }
}

export const db = new ExpenseTrackerDB();
