import Dexie, { type Table } from 'dexie';

// Interfaces for our database models
export interface Transaction {
  id?: number;
  amount: number;
  date: string;
  categoryId: number | string;
  type: 'expense' | 'income' | 'savings';
  note?: string;
  isSynced: boolean; // For offline sync support
  updatedAt: number;
}

export interface Category {
  id?: number;
  name: string;
  icon: string; // Lucide icon name
  color: string;
  type: 'expense' | 'income' | 'savings';
  isSynced: boolean;
  updatedAt: number;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isSynced: boolean;
  updatedAt: number;
}

export interface BankAccount {
  id?: number;
  name: string;
  balance: number;
  accountType: 'checking' | 'savings' | 'credit' | 'other';
  isSynced: boolean;
  updatedAt: number;
}

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  savingsGoals!: Table<SavingsGoal, number>;
  bankAccounts!: Table<BankAccount, number>;

  constructor() {
    super('ExpenseTrackerDB');
    
    // Define tables and indexes
    this.version(2).stores({
      transactions: '++id, date, categoryId, type, isSynced',
      categories: '++id, type, isSynced',
      savingsGoals: '++id, isSynced',
      bankAccounts: '++id, isSynced'
    });
  }
}

export const db = new ExpenseTrackerDB();
