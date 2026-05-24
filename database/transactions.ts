import db from './db';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  note: string | null;
  date: string;
  created_at: string;
}

export interface NewTransaction {
  amount: number;
  type: TransactionType;
  category_id: number;
  note?: string;
  date: string;
}

// Add a new transaction
export function addTransaction(tx: NewTransaction): number {
  const result = db.runSync(
    `INSERT INTO transactions (amount, type, category_id, note, date)
     VALUES (?, ?, ?, ?, ?)`,
    [tx.amount, tx.type, tx.category_id, tx.note ?? null, tx.date]
  );
  return result.lastInsertRowId;
}

// Get all transactions (joined with category info)
export function getAllTransactions(): Transaction[] {
  return db.getAllSync<Transaction>(`
    SELECT 
      t.id, t.amount, t.type, t.category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      t.note, t.date, t.created_at
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC, t.created_at DESC
  `);
}

// Get transactions filtered by date range
export function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Transaction[] {
  return db.getAllSync<Transaction>(`
    SELECT 
      t.id, t.amount, t.type, t.category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      t.note, t.date, t.created_at
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY t.date DESC, t.created_at DESC
  `, [startDate, endDate]);
}

// Get transactions for a specific day
export function getTransactionsByDay(date: string): Transaction[] {
  return db.getAllSync<Transaction>(`
    SELECT 
      t.id, t.amount, t.type, t.category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      t.note, t.date, t.created_at
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.date = ?
    ORDER BY t.created_at DESC
  `, [date]);
}

// Get total income and expenses for a date range
export function getSummary(startDate: string, endDate: string): {
  totalIncome: number;
  totalExpense: number;
  net: number;
} {
  const result = db.getFirstSync<{ totalIncome: number; totalExpense: number }>(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpense
    FROM transactions
    WHERE date BETWEEN ? AND ?
  `, [startDate, endDate]);

  const totalIncome = result?.totalIncome ?? 0;
  const totalExpense = result?.totalExpense ?? 0;

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
  };
}

// Get spending grouped by category for a date range
export function getSpendingByCategory(
  startDate: string,
  endDate: string
): { category_id: number; category_name: string; category_icon: string; total: number }[] {
  return db.getAllSync(`
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      SUM(t.amount) AS total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense' AND t.date BETWEEN ? AND ?
    GROUP BY t.category_id
    ORDER BY total DESC
  `, [startDate, endDate]);
}

// Delete a transaction by id
export function deleteTransaction(id: number): void {
  db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
}