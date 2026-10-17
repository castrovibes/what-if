import { getDb } from '../index';
import { Prompt, PromptSource } from '../types';
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
  /** 'official' for the What If Originals library, 'user' for My Prompts. */
  source?: PromptSource;
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
      // A prompt can suit several situations (prompt_liminal_spaces, migration 0012).
      where.push(
        'EXISTS (SELECT 1 FROM prompt_liminal_spaces pls WHERE pls.prompt_id = prompts.id AND pls.liminal_space_id = ?)'
      );
      params.push(filter.liminalSpace);
    }
    if (filter.source) {
      where.push('source = ?');
      params.push(filter.source);
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
