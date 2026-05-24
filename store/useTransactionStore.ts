import { create } from 'zustand';
import {
  getAllTransactions,
  getTransactionsByDay,
  getTransactionsByDateRange,
  getSpendingByCategory,
  getSummary,
  addTransaction,
  deleteTransaction,
  Transaction,
  NewTransaction,
} from '../database/transactions';

interface Summary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

interface CategorySpending {
  category_id: number;
  category_name: string;
  category_icon: string;
  total: number;
}

interface TransactionStore {
  // State
  transactions: Transaction[];
  summary: Summary;
  categorySpending: CategorySpending[];
  isLoading: boolean;

  // Actions
  loadAll: () => void;
  loadByDay: (date: string) => void;
  loadByDateRange: (startDate: string, endDate: string) => void;
  add: (tx: NewTransaction) => void;
  remove: (id: number) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  summary: { totalIncome: 0, totalExpense: 0, net: 0 },
  categorySpending: [],
  isLoading: false,

  // Load all transactions
  loadAll: () => {
    set({ isLoading: true });
    const transactions = getAllTransactions();
    set({ transactions, isLoading: false });
  },

  // Load transactions for a specific day
  loadByDay: (date: string) => {
    set({ isLoading: true });
    const transactions = getTransactionsByDay(date);
    const summary = getSummary(date, date);
    const categorySpending = getSpendingByCategory(date, date);
    set({ transactions, summary, categorySpending, isLoading: false });
  },

  // Load transactions for a date range (weekly, monthly, yearly)
  loadByDateRange: (startDate: string, endDate: string) => {
    set({ isLoading: true });
    const transactions = getTransactionsByDateRange(startDate, endDate);
    const summary = getSummary(startDate, endDate);
    const categorySpending = getSpendingByCategory(startDate, endDate);
    set({ transactions, summary, categorySpending, isLoading: false });
  },

  // Add a new transaction and refresh
  add: (tx: NewTransaction) => {
    addTransaction(tx);
    const transactions = getAllTransactions();
    set({ transactions });
  },

  // Delete a transaction and refresh
  remove: (id: number) => {
    deleteTransaction(id);
    const transactions = getAllTransactions();
    set({ transactions });
  },
}));