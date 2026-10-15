import { useEffect, useState } from 'react';
import { CategoryRepo } from '../db/repositories/categories';
import { Category } from '../db/types';

export function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    CategoryRepo.list().then(setCategories);
  }, []);
  return categories;
}
