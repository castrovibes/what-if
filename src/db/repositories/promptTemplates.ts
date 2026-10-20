import { getDb } from '../index';

export type PromptTemplateSlot = {
  label: string;
  type: string;
  suggestions: string[];
};

export type PromptTemplate = {
  id: string;
  ageGroup: string;
  templateText: string;
  slots: PromptTemplateSlot[];
  tier: string;
  isPlaceholder: boolean;
};

type Row = {
  id: string;
  age_group: string;
  template_text: string;
  slots_json: string;
  tier: string;
  display_order: number;
  is_placeholder: number;
};

const fromRow = (r: Row): PromptTemplate => ({
  id: r.id,
  ageGroup: r.age_group,
  templateText: r.template_text,
  slots: JSON.parse(r.slots_json) as PromptTemplateSlot[],
  tier: r.tier,
  isPlaceholder: r.is_placeholder === 1,
});

export const PromptTemplatesRepo = {
  async list(): Promise<PromptTemplate[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      // The table keeps the name it was created with (migration 0006).
      'SELECT * FROM mad_libs_templates ORDER BY display_order'
    );
    return rows.map(fromRow);
  },
};

export function applyTemplate(template: string, fills: string[]): string {
  return template.replace(/\{(\d+)\}/g, (_, i) => fills[Number(i)] ?? '___');
}
