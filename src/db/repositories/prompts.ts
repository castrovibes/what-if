import { getDb } from '../index';
import { Prompt } from '../types';
import { AgeGroupId } from '../../data/ageGroups';

type PromptRow = {
  id: string;
  age_group: string;
  category_id: string | null;
  text: string;
  full_question: string;
  tier: string;
  source: string;
  liminal_space: string | null;
  parent_askable: number;
  is_active: number;
  is_placeholder: number;
  created_at: string;
  updated_at: string;
};

const fromRow = (r: PromptRow): Prompt => ({
  id: r.id,
  ageGroup: r.age_group as AgeGroupId,
  categoryId: r.category_id,
  text: r.text,
  fullQuestion: r.full_question,
  tier: r.tier as Prompt['tier'],
  source: r.source as Prompt['source'],
  liminalSpace: r.liminal_space,
  parentAskable: r.parent_askable === 1,
  isActive: r.is_active === 1,
  isPlaceholder: r.is_placeholder === 1,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export type PromptFilter = {
  ageGroup?: AgeGroupId;
  liminalSpace?: string | null;
  parentAskable?: boolean;
};

export const PromptRepo = {
  async findFiltered(filter: PromptFilter): Promise<Prompt[]> {
    const db = await getDb();
    const where: string[] = ['is_active = 1'];
    const params: (string | number)[] = [];
    if (filter.ageGroup) {
      where.push('age_group = ?');
      params.push(filter.ageGroup);
    }
    if (filter.liminalSpace) {
      where.push('liminal_space = ?');
      params.push(filter.liminalSpace);
    }
    if (filter.parentAskable) {
      where.push('parent_askable = 1');
    }
    const rows = await db.getAllAsync<PromptRow>(
      `SELECT * FROM prompts WHERE ${where.join(' AND ')} ORDER BY id`,
      ...params
    );
    return rows.map(fromRow);
  },
};
