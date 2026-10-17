/**
 * The synced records in their on-device shape (ISO date strings), and conversion to
 * and from the Firestore documents in src/backend/model.ts (Timestamps).
 */
import { DocumentData, Timestamp, serverTimestamp } from 'firebase/firestore';
import { AgeGroupId } from '../data/ageGroups';
import { UserCollection, docIds } from '../backend/model';

export type ContextRecord = {
  id: string;
  label: string;
  ageGroupDefault: AgeGroupId | null;
  isAnonymous: boolean;
  colorToken: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type FavoriteRecord = { contextId: string; promptId: string; favoritedAt: string };

export type ReflectionRecord = {
  id: string;
  contextId: string;
  promptId: string;
  note: string | null;
  rating: number | null;
  createdAt: string;
};

export type ModuleProgressRecord = {
  contextId: string;
  moduleId: string;
  promptId: string;
  completedAt: string | null;
};

export type MyPromptRecord = {
  id: string;
  text: string;
  ageGroup: AgeGroupId;
  situations: string[];
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecordFor = {
  myPrompts: MyPromptRecord;
  contexts: ContextRecord;
  favorites: FavoriteRecord;
  reflections: ReflectionRecord;
  moduleProgress: ModuleProgressRecord;
};

export type SyncRecord = RecordFor[UserCollection];

export const docIdOf = <C extends UserCollection>(collection: C, r: RecordFor[C]): string => {
  switch (collection) {
    case 'myPrompts':
      return (r as MyPromptRecord).id;
    case 'contexts':
      return (r as ContextRecord).id;
    case 'favorites': {
      const f = r as FavoriteRecord;
      return docIds.favorite(f.contextId, f.promptId);
    }
    case 'reflections':
      return (r as ReflectionRecord).id;
    default: {
      const p = r as ModuleProgressRecord;
      return docIds.moduleProgress(p.contextId, p.moduleId, p.promptId);
    }
  }
};

const ts = (iso: string) => Timestamp.fromDate(new Date(iso));
const tsOrNull = (iso: string | null) => (iso ? ts(iso) : null);
const iso = (t: unknown): string =>
  t instanceof Timestamp ? t.toDate().toISOString() : new Date().toISOString();
const isoOrNull = (t: unknown): string | null => (t instanceof Timestamp ? t.toDate().toISOString() : null);

/** On-device record -> Firestore document data. */
export const toRemote = (collection: UserCollection, r: SyncRecord): DocumentData => {
  switch (collection) {
    case 'myPrompts': {
      const p = r as MyPromptRecord;
      return {
        text: p.text,
        ageGroup: p.ageGroup,
        situations: p.situations,
        deleted: p.deleted,
        createdAt: ts(p.createdAt),
        updatedAt: ts(p.updatedAt),
      };
    }
    case 'contexts': {
      const c = r as ContextRecord;
      return {
        label: c.label,
        ageGroupDefault: c.ageGroupDefault,
        isAnonymous: c.isAnonymous,
        colorToken: c.colorToken,
        createdAt: ts(c.createdAt),
        archivedAt: tsOrNull(c.archivedAt),
        updatedAt: serverTimestamp(),
      };
    }
    case 'favorites': {
      const f = r as FavoriteRecord;
      return { contextId: f.contextId, promptId: f.promptId, favoritedAt: ts(f.favoritedAt) };
    }
    case 'reflections': {
      const x = r as ReflectionRecord;
      return {
        contextId: x.contextId,
        promptId: x.promptId,
        note: x.note,
        rating: x.rating,
        createdAt: ts(x.createdAt),
      };
    }
    default: {
      const p = r as ModuleProgressRecord;
      return {
        contextId: p.contextId,
        moduleId: p.moduleId,
        promptId: p.promptId,
        completedAt: tsOrNull(p.completedAt),
      };
    }
  }
};

/** Firestore document -> on-device record. */
export const fromRemote = (collection: UserCollection, id: string, d: DocumentData): SyncRecord => {
  switch (collection) {
    case 'myPrompts':
      return {
        id,
        text: d.text,
        ageGroup: d.ageGroup,
        situations: Array.isArray(d.situations) ? d.situations : [],
        deleted: !!d.deleted,
        createdAt: iso(d.createdAt),
        updatedAt: iso(d.updatedAt),
      };
    case 'contexts':
      return {
        id,
        label: d.label,
        ageGroupDefault: d.ageGroupDefault ?? null,
        isAnonymous: !!d.isAnonymous,
        colorToken: d.colorToken ?? null,
        createdAt: iso(d.createdAt),
        archivedAt: isoOrNull(d.archivedAt),
      };
    case 'favorites':
      return { contextId: d.contextId, promptId: d.promptId, favoritedAt: iso(d.favoritedAt) };
    case 'reflections':
      return {
        id,
        contextId: d.contextId,
        promptId: d.promptId,
        note: d.note ?? null,
        rating: d.rating ?? null,
        createdAt: iso(d.createdAt),
      };
    default:
      return {
        contextId: d.contextId,
        moduleId: d.moduleId,
        promptId: d.promptId,
        completedAt: isoOrNull(d.completedAt),
      };
  }
};
