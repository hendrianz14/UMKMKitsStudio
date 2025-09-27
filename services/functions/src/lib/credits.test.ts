import { describe, expect, it, beforeEach, vi } from 'vitest';
import { spendCreditsAtomic } from './credits.js';
import * as firebaseAdmin from './firebase-admin.js';

interface UserState {
  credits: number;
}

interface FirestoreState {
  users: Record<string, UserState>;
  logs: Set<string>;
}

class MockDocRef {
  constructor(public type: 'user' | 'log', public id: string, public parent?: MockDocRef) {}

  collection(name: string) {
    if (name !== 'credit_logs') {
      throw new Error('Only credit_logs supported in mock');
    }
    return {
      doc: (id: string) => new MockDocRef('log', id, this)
    };
  }
}

function createFirestore(state: FirestoreState) {
  return {
    collection: (name: string) => ({
      doc: (id: string) => new MockDocRef(name === 'users' ? 'user' : 'log', id)
    }),
    runTransaction: async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        async get(ref: MockDocRef) {
          if (ref.type === 'user') {
            const data = state.users[ref.id];
            return {
              exists: Boolean(data),
              data: () => data,
              get: (field: string) => (data as any)?.[field]
            };
          }
          const key = `${ref.parent?.id ?? ''}-${ref.id}`;
          return {
            exists: state.logs.has(key),
            data: () => ({ id: ref.id })
          };
        },
        update(ref: MockDocRef, payload: Record<string, unknown>) {
          if (ref.type !== 'user') return;
          Object.assign(state.users[ref.id], payload);
        },
        set(ref: MockDocRef, payload: Record<string, unknown>) {
          if (ref.type === 'log') {
            const key = `${ref.parent?.id ?? ''}-${ref.id}`;
            state.logs.add(key);
          }
        }
      };
      return fn(tx);
    }
  };
}

vi.mock('./firebase-admin.js');

describe('spendCreditsAtomic', () => {
  const state: FirestoreState = {
    users: { alice: { credits: 10 } },
    logs: new Set()
  };

  beforeEach(() => {
    state.users.alice.credits = 10;
    state.logs.clear();
    vi.mocked(firebaseAdmin.getFirestore).mockReturnValue(createFirestore(state) as any);
  });

  it('deducts credits and records log', async () => {
    const result = await spendCreditsAtomic({
      uid: 'alice',
      amount: 3,
      reason: 'ai:caption',
      idempotencyKey: 'run-1'
    });
    expect(result.success).toBe(true);
    expect(state.users.alice.credits).toBe(7);
  });

  it('is idempotent for same key', async () => {
    await spendCreditsAtomic({ uid: 'alice', amount: 3, reason: 'ai', idempotencyKey: 'dup' });
    const result = await spendCreditsAtomic({ uid: 'alice', amount: 3, reason: 'ai', idempotencyKey: 'dup' });
    expect(result.remainingCredits).toBe(7);
  });

  it('throws when credits insufficient', async () => {
    await expect(
      spendCreditsAtomic({ uid: 'alice', amount: 20, reason: 'ai', idempotencyKey: 'fail' })
    ).rejects.toThrow('INSUFFICIENT_CREDITS');
  });
});
