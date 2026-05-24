import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('moneytracker.db');

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      category_id INTEGER NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // Seed default categories if table is empty
  const existing = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (existing?.count === 0) {
    const defaults = [
      { name: 'Food & Drinks', icon: '🍔' },
      { name: 'Games',         icon: '🎮' },
      { name: 'Transport',     icon: '🚗' },
      { name: 'Groceries',     icon: '🛒' },
      { name: 'Utilities',     icon: '💡' },
      { name: 'Health',        icon: '🏥' },
      { name: 'Shopping',      icon: '👗' },
      { name: 'Education',     icon: '🎓' },
    ];

    for (const cat of defaults) {
      db.runSync(
        'INSERT INTO categories (name, icon, is_default) VALUES (?, ?, 1)',
        [cat.name, cat.icon]
      );
    }
  }
}

export default db;