import db from './db';

export interface Category {
  id: number;
  name: string;
  icon: string;
  is_default: number;
}

export interface NewCategory {
  name: string;
  icon: string;
}

// Get all categories
export function getAllCategories(): Category[] {
  return db.getAllSync<Category>(
    'SELECT * FROM categories ORDER BY is_default DESC, name ASC'
  );
}

// Get a single category by id
export function getCategoryById(id: number): Category | null {
  return db.getFirstSync<Category>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  ) ?? null;
}

// Add a new custom category
export function addCategory(cat: NewCategory): number {
  const result = db.runSync(
    'INSERT INTO categories (name, icon, is_default) VALUES (?, ?, 0)',
    [cat.name, cat.icon]
  );
  return result.lastInsertRowId;
}

// Delete a custom category (only non-default ones)
export function deleteCategory(id: number): boolean {
  const cat = getCategoryById(id);

  // Protect default categories from being deleted
  if (!cat || cat.is_default === 1) return false;

  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}