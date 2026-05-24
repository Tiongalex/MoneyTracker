import { create } from 'zustand';
import {
  getAllCategories,
  addCategory,
  deleteCategory,
  Category,
  NewCategory,
} from '../database/categories';

interface CategoryStore {
  // State
  categories: Category[];

  // Actions
  load: () => void;
  add: (cat: NewCategory) => void;
  remove: (id: number) => boolean;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],

  // Load all categories from DB
  load: () => {
    const categories = getAllCategories();
    set({ categories });
  },

  // Add a new custom category and refresh
  add: (cat: NewCategory) => {
    addCategory(cat);
    const categories = getAllCategories();
    set({ categories });
  },

  // Delete a custom category and refresh
  // Returns false if category is a default (protected)
  remove: (id: number) => {
    const success = deleteCategory(id);
    if (success) {
      const categories = getAllCategories();
      set({ categories });
    }
    return success;
  },
}));