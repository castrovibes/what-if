import { getDb } from '../index';
import { SyncService } from '../../sync/syncService';

export type Module = {
  id: string;
  title: string;
  description: string | null;
  ageGroup: string | null;
  categoryId: string | null;
  durationDays: number;
  tier: string;
  coverColor: string | null;
  isPlaceholder: boolean;
};

export type ModuleStep = {
  moduleId: string;
  stepNumber: number;
  promptId: string;
  introText: string | null;
  outroText: string | null;
};

type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  age_group: string | null;
  category_id: string | null;
  duration_days: number;
  tier: string;
  cover_color: string | null;
  display_order: number;
  is_placeholder: number;
};

type StepRow = {
  module_id: string;
  step_number: number;
  prompt_id: string;
  intro_text: string | null;
  outro_text: string | null;
};

const fromModuleRow = (r: ModuleRow): Module => ({
  id: r.id,
  title: r.title,
  description: r.description,
  ageGroup: r.age_group,
  categoryId: r.category_id,
  durationDays: r.duration_days,
  tier: r.tier,
  coverColor: r.cover_color,
  isPlaceholder: r.is_placeholder === 1,
});

const fromStepRow = (r: StepRow): ModuleStep => ({
  moduleId: r.module_id,
  stepNumber: r.step_number,
  promptId: r.prompt_id,
  introText: r.intro_text,
  outroText: r.outro_text,
});

export const ModuleRepo = {
  async list(): Promise<Module[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ModuleRow>(
      'SELECT * FROM modules ORDER BY display_order'
    );
    return rows.map(fromModuleRow);
  },

  async findById(id: string): Promise<Module | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ModuleRow>('SELECT * FROM modules WHERE id = ?', id);
    return row ? fromModuleRow(row) : null;
  },

  async stepsForModule(moduleId: string): Promise<ModuleStep[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<StepRow>(
      'SELECT * FROM module_steps WHERE module_id = ? ORDER BY step_number',
      moduleId
    );
    return rows.map(fromStepRow);
  },

  async completedSteps(contextId: string, moduleId: string): Promise<Set<string>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ prompt_id: string }>(
      'SELECT prompt_id FROM module_progress WHERE context_id = ? AND module_id = ? AND completed_at IS NOT NULL',
      contextId,
      moduleId
    );
    return new Set(rows.map(r => r.prompt_id));
  },

  async markComplete(contextId: string, moduleId: string, promptId: string): Promise<void> {
    const db = await getDb();
    const completedAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO module_progress (context_id, module_id, prompt_id, completed_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(context_id, module_id, prompt_id) DO UPDATE SET completed_at = excluded.completed_at`,
      contextId,
      moduleId,
      promptId,
      completedAt
    );
    await SyncService.recordSet('moduleProgress', { contextId, moduleId, promptId, completedAt });
  },
};
