import * as SQLite from 'expo-sqlite';
import { migration_0001_init } from './0001_init';
import { migration_0002_global_tips } from './0002_global_tips';
import { migration_0003_parent_askable_seed } from './0003_parent_askable_seed';
import { migration_0004_personalization_tokens } from './0004_personalization_tokens';
import { migration_0005_seed_modules } from './0005_seed_modules';
import { migration_0006_madlibs } from './0006_madlibs';
import { migration_0007_faq_and_resources } from './0007_faq_and_resources';
import { migration_0008_trim_placeholder_question } from './0008_trim_placeholder_question';
import { migration_0009_trim_madlibs_question } from './0009_trim_madlibs_question';
import { migration_0010_sync } from './0010_sync';
import { migration_0011_strip_placeholder_markers } from './0011_strip_placeholder_markers';
import { migration_0012_twists_and_situations } from './0012_twists_and_situations';

export type Migration = {
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

export const migrations: Migration[] = [
  migration_0001_init,
  migration_0002_global_tips,
  migration_0003_parent_askable_seed,
  migration_0004_personalization_tokens,
  migration_0005_seed_modules,
  migration_0006_madlibs,
  migration_0007_faq_and_resources,
  migration_0008_trim_placeholder_question,
  migration_0009_trim_madlibs_question,
  migration_0010_sync,
  migration_0011_strip_placeholder_markers,
  migration_0012_twists_and_situations,
];
