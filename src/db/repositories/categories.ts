import { getDb } from '../index';
import { Category } from '../types';

type Row = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  icon: string | null;
  is_placeholder: number;
};

const fromRow = (r: Row): Category => ({
  id: r.id,
  name: r.name,
  description: r.description,
  displayOrder: r.display_order,
  icon: r.icon,
  isPlaceholder: r.is_placeholder === 1,
});

export const CategoryRepo = {
  async list(): Promise<Category[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>('SELECT * FROM categories ORDER BY display_order');
    return rows.map(fromRow);
  },
};
