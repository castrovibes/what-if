// Security rule tests. Run with `npm run test:rules` (starts the Firestore emulator).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-what-if',
    firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

after(async () => {
  await env.cleanup();
});

const db = (uid, email = `${uid}@example.com`) =>
  env.authenticatedContext(uid, { email }).firestore();

const newUser = (uid, overrides = {}) => ({
  schemaVersion: 1,
  displayName: null,
  ageConfirmedAt: null,
  username: null,
  usernameLower: null,
  email: `${uid}@example.com`,
  authProvider: 'email',
  birthdate: null,
  photoUrl: null,
  plan: 'free',
  preferences: { darkMode: null, activeContextId: null },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

/** Creates the user doc and claims a username in one batch, like the app does. */
const createWithUsername = (firestore, uid, username) => {
  const batch = writeBatch(firestore);
  batch.set(
    doc(firestore, `users/${uid}`),
    newUser(uid, { username, usernameLower: username.toLowerCase(), birthdate: '1990-03-14' }),
  );
  batch.set(doc(firestore, `usernames/${username.toLowerCase()}`), {
    uid,
    createdAt: serverTimestamp(),
  });
  return batch.commit();
};

describe('users/{uid}', () => {
  test('a user can create and read their own account', async () => {
    const alice = db('alice');
    await assertSucceeds(setDoc(doc(alice, 'users/alice'), newUser('alice')));
    await assertSucceeds(getDoc(doc(alice, 'users/alice')));
  });

  test("a user cannot read or write someone else's account", async () => {
    await env.withSecurityRulesDisabled(c =>
      setDoc(doc(c.firestore(), 'users/bob'), { plan: 'free' }),
    );
    const alice = db('alice');
    await assertFails(getDoc(doc(alice, 'users/bob')));
    await assertFails(setDoc(doc(alice, 'users/mallory'), newUser('mallory')));
  });

  test('signed-out users cannot read accounts', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'users/alice')));
  });

  test('a new account must start on the free plan', async () => {
    const alice = db('alice');
    await assertFails(setDoc(doc(alice, 'users/alice'), newUser('alice', { plan: 'premium' })));
  });

  test('a user cannot upgrade their own plan', async () => {
    const alice = db('alice');
    await setDoc(doc(alice, 'users/alice'), newUser('alice'));
    await assertFails(
      updateDoc(doc(alice, 'users/alice'), { plan: 'premium', updatedAt: serverTimestamp() }),
    );
  });

  test('the account email must match the signed-in email', async () => {
    const alice = db('alice');
    await assertFails(
      setDoc(doc(alice, 'users/alice'), newUser('alice', { email: 'someone@else.com' })),
    );
  });

  test('accounts must be 18 or older', async () => {
    const alice = db('alice');
    await setDoc(doc(alice, 'users/alice'), newUser('alice'));
    const thisYear = new Date().getFullYear();
    await assertFails(
      updateDoc(doc(alice, 'users/alice'), {
        birthdate: `${thisYear - 10}-01-01`,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(alice, 'users/alice'), {
        birthdate: '1990-03-14',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  test('the profile step sets a display name and the adult confirmation', async () => {
    const alice = db('alice');
    await setDoc(doc(alice, 'users/alice'), newUser('alice'));
    await assertSucceeds(
      updateDoc(doc(alice, 'users/alice'), {
        displayName: 'Alice W.',
        ageConfirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    // Blank, over-long, or non-string names are rejected; so is a non-timestamp confirmation.
    await assertFails(
      updateDoc(doc(alice, 'users/alice'), { displayName: '   ', updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(alice, 'users/alice'), {
        displayName: 'x'.repeat(41),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(alice, 'users/alice'), { ageConfirmedAt: true, updatedAt: serverTimestamp() }),
    );
  });

  test('preferences can be updated; unknown fields cannot be added', async () => {
    const alice = db('alice');
    await setDoc(doc(alice, 'users/alice'), newUser('alice'));
    await assertSucceeds(
      updateDoc(doc(alice, 'users/alice'), {
        preferences: { darkMode: true, activeContextId: 'ctx-quick-start' },
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(alice, 'users/alice'), { isAdmin: true, updatedAt: serverTimestamp() }),
    );
  });
});

describe('usernames', () => {
  test('a user can claim a free username together with their account', async () => {
    await assertSucceeds(createWithUsername(db('alice'), 'alice', 'RiverWalker32'));
  });

  test('a taken username cannot be claimed by someone else', async () => {
    await createWithUsername(db('alice'), 'alice', 'riverwalker32');
    await assertFails(createWithUsername(db('bob'), 'bob', 'riverwalker32'));
  });

  test('a username must be claimed to be set on the account', async () => {
    const alice = db('alice');
    await assertFails(
      setDoc(
        doc(alice, 'users/alice'),
        newUser('alice', { username: 'ghost', usernameLower: 'ghost' }),
      ),
    );
  });

  test('invalid usernames are rejected', async () => {
    await assertFails(createWithUsername(db('alice'), 'alice', 'no spaces!'));
  });

  test('signed-in users can check one username but not list them all', async () => {
    await createWithUsername(db('alice'), 'alice', 'riverwalker32');
    const bob = db('bob');
    await assertSucceeds(getDoc(doc(bob, 'usernames/riverwalker32')));
    await assertFails(getDocs(collection(bob, 'usernames')));
  });
});

describe('user data subcollections', () => {
  test('a user can sync their own favorites, reflections and contexts', async () => {
    const alice = db('alice');
    await assertSucceeds(
      setDoc(doc(alice, 'users/alice/favorites/ctx-1__ph-3-5-001'), {
        contextId: 'ctx-1',
        promptId: 'ph-3-5-001',
        favoritedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(alice, 'users/alice/reflections/r1'), {
        contextId: 'ctx-1',
        promptId: 'ph-3-5-001',
        note: 'They suggested taking turns.',
        rating: 4,
        createdAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(alice, 'users/alice/contexts/ctx-1'), {
        label: 'Group A',
        ageGroupDefault: '6-8',
        isAnonymous: true,
        colorToken: null,
        createdAt: serverTimestamp(),
        archivedAt: null,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  test("a user cannot touch another user's data", async () => {
    const alice = db('alice');
    await assertFails(getDocs(collection(alice, 'users/bob/reflections')));
    await assertFails(
      setDoc(doc(alice, 'users/bob/favorites/ctx-1__p1'), {
        contextId: 'ctx-1',
        promptId: 'p1',
        favoritedAt: serverTimestamp(),
      }),
    );
  });

  test('favorite ids must match their context and prompt', async () => {
    await assertFails(
      setDoc(doc(db('alice'), 'users/alice/favorites/wrong-id'), {
        contextId: 'ctx-1',
        promptId: 'p1',
        favoritedAt: serverTimestamp(),
      }),
    );
  });

  test('reflection notes are capped and ratings are 1–5', async () => {
    const alice = db('alice');
    await assertFails(
      setDoc(doc(alice, 'users/alice/reflections/r1'), {
        contextId: 'ctx-1',
        promptId: 'p1',
        note: 'x'.repeat(5001),
        rating: 3,
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(alice, 'users/alice/reflections/r2'), {
        contextId: 'ctx-1',
        promptId: 'p1',
        note: null,
        rating: 9,
        createdAt: serverTimestamp(),
      }),
    );
  });

  test('a user can sync their own prompts, including deleting one', async () => {
    const alice = db('alice');
    const ref = doc(alice, 'users/alice/myPrompts/user-1760000000000-ab12');
    const prompt = {
      text: 'What if your dog learned to talk?',
      ageGroup: '6-8',
      situations: ['ls-bedtime'],
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await assertSucceeds(setDoc(ref, prompt));
    await assertSucceeds(setDoc(ref, { ...prompt, deleted: true, updatedAt: new Date() }));
    await assertSucceeds(getDoc(ref));
    await assertFails(getDoc(doc(db('bob'), 'users/alice/myPrompts/user-1760000000000-ab12')));
    await assertFails(
      setDoc(doc(db('bob'), 'users/alice/myPrompts/user-1760000000000-cd34'), prompt),
    );
  });

  test('own prompts must be well formed', async () => {
    const ref = (id = 'user-1760000000000-ab12') => doc(db('alice'), `users/alice/myPrompts/${id}`);
    const ok = {
      text: 'What if?',
      ageGroup: '9-12',
      situations: [],
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await assertFails(setDoc(ref('ph-3-5-001'), ok)); // not a user prompt id
    await assertFails(setDoc(ref(), { ...ok, text: '' }));
    await assertFails(setDoc(ref(), { ...ok, text: 'x'.repeat(501) }));
    await assertFails(setDoc(ref(), { ...ok, ageGroup: 'adults' }));
    await assertFails(setDoc(ref(), { ...ok, situations: 'ls-bedtime' }));
    await assertFails(setDoc(ref(), { ...ok, tier: 'premium' })); // no extra fields
    const { deleted, ...missingDeleted } = ok;
    await assertFails(setDoc(ref(), missingDeleted));
    await assertSucceeds(setDoc(ref(), ok));
  });

  test('personalization is not a synced collection', async () => {
    await assertFails(
      setDoc(doc(db('alice'), 'users/alice/personalization/name'), { value: 'Maya' }),
    );
  });
});

describe('reports', () => {
  const report = (overrides = {}) => ({
    promptId: 'p-12',
    reason: 'confusing',
    appVersion: '1.0.0',
    platform: 'ios',
    uid: null,
    createdAt: serverTimestamp(),
    ...overrides,
  });

  test('anyone can file a report, signed in or not', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(addDoc(collection(anon, 'reports'), report()));
    const alice = db('alice');
    await assertSucceeds(addDoc(collection(alice, 'reports'), report({ uid: 'alice' })));
  });

  test("reports can't be read, listed, changed or deleted from the app", async () => {
    await env.withSecurityRulesDisabled(c =>
      setDoc(doc(c.firestore(), 'reports/r1'), { promptId: 'p-1' }),
    );
    const alice = db('alice');
    await assertFails(getDoc(doc(alice, 'reports/r1')));
    await assertFails(getDocs(collection(alice, 'reports')));
    await assertFails(updateDoc(doc(alice, 'reports/r1'), { reason: 'other' }));
  });

  test('reports must use a known reason and carry no extra data', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(anon, 'reports'), report({ reason: 'spam!!' })));
    await assertFails(
      addDoc(collection(anon, 'reports'), report({ email: 'someone@example.com' })),
    );
  });

  test("a report can't claim to be from someone else", async () => {
    await assertFails(addDoc(collection(db('alice'), 'reports'), report({ uid: 'bob' })));
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(anon, 'reports'), report({ uid: 'bob' })));
  });
});

describe('account deletion', () => {
  test('a user can delete their account and release their username together', async () => {
    const alice = db('alice');
    await createWithUsername(alice, 'alice', 'riverwalker32');
    const batch = writeBatch(alice);
    batch.delete(doc(alice, 'usernames/riverwalker32'));
    batch.delete(doc(alice, 'users/alice'));
    await assertSucceeds(batch.commit());
    // The name is free again.
    await assertSucceeds(createWithUsername(db('bob'), 'bob', 'riverwalker32'));
  });

  test("a user cannot delete someone else's account or username", async () => {
    await createWithUsername(db('alice'), 'alice', 'riverwalker32');
    const bob = db('bob');
    await assertFails(deleteDoc(doc(bob, 'users/alice')));
    await assertFails(deleteDoc(doc(bob, 'usernames/riverwalker32')));
  });

  test('a username in use cannot be released while the account still uses it', async () => {
    const alice = db('alice');
    await createWithUsername(alice, 'alice', 'riverwalker32');
    await assertFails(deleteDoc(doc(alice, 'usernames/riverwalker32')));
  });
});
