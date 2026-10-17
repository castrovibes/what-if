import { Timestamp } from 'firebase/firestore';
import { docIdOf, fromRemote, toRemote, MyPromptRecord, ContextRecord } from '../records';

const prompt: MyPromptRecord = {
  id: 'p1',
  text: 'What if…',
  ageGroup: '6-8',
  situations: ['car'],
  deleted: false,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
};

describe('docIdOf', () => {
  it('uses the record id for id-keyed collections', () => {
    expect(docIdOf('myPrompts', prompt)).toBe('p1');
  });

  it('derives a composite id for favorites and module progress', () => {
    const fav = docIdOf('favorites', { contextId: 'c1', promptId: 'p1', favoritedAt: prompt.createdAt });
    const progress = docIdOf('moduleProgress', {
      contextId: 'c1',
      moduleId: 'm1',
      promptId: 'p1',
      completedAt: null,
    });
    expect(fav).toContain('c1');
    expect(fav).toContain('p1');
    expect(progress).toContain('m1');
  });
});

describe('toRemote / fromRemote', () => {
  it('round-trips a prompt through Firestore timestamps', () => {
    const remote = toRemote('myPrompts', prompt);
    expect(remote.createdAt).toBeInstanceOf(Timestamp);
    expect(remote.text).toBe(prompt.text);
    expect(fromRemote('myPrompts', prompt.id, remote)).toEqual(prompt);
  });

  it('round-trips a context, keeping null archivedAt', () => {
    const context: ContextRecord = {
      id: 'c1',
      label: 'Group A',
      ageGroupDefault: null,
      isAnonymous: true,
      colorToken: null,
      createdAt: '2026-10-01T10:00:00.000Z',
      archivedAt: null,
    };
    const remote = toRemote('contexts', context);
    expect(remote.archivedAt).toBeNull();
    // updatedAt is a server timestamp sentinel, which the device record doesn't keep.
    expect(fromRemote('contexts', context.id, remote)).toEqual(context);
  });

  it('is defensive about malformed remote documents', () => {
    const record = fromRemote('myPrompts', 'x', { text: 't', ageGroup: '3-5' });
    expect(record).toMatchObject({ id: 'x', situations: [], deleted: false });
    expect(typeof (record as MyPromptRecord).createdAt).toBe('string');
  });
});
