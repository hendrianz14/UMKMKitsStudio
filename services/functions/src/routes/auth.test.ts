import type { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendOtpEmail = vi.fn(async () => undefined);
const rateTracker = new Map<string, number>();

vi.mock('../utils/mailer.js', () => ({
  sendOtpEmail
}));

const actualEmailModule = await vi.importActual<typeof import('../utils/email.js')>('../utils/email.js');
vi.mock('../utils/email.js', () => ({
  ...actualEmailModule,
  ensureDomainHasMx: vi.fn(async () => undefined)
}));

vi.mock('../utils/rateLimit.js', () => ({
  enforceRateLimit: vi.fn(async (key: string, windowMs: number) => {
    const now = Date.now();
    const last = rateTracker.get(key) ?? 0;
    if (now - last < windowMs) {
      return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (now - last)) / 1000) };
    }
    rateTracker.set(key, now);
    return { allowed: true };
  })
}));

class FakeDocRef {
  constructor(private collection: FakeCollection, private id: string) {}

  async get() {
    const data = this.collection.get(this.id);
    if (!data) {
      return { exists: false };
    }
    return {
      exists: true,
      data: () => data
    };
  }

  async set(data: Record<string, unknown>) {
    this.collection.set(this.id, data);
  }

  async update(data: Record<string, unknown>) {
    const current = this.collection.get(this.id) ?? {};
    this.collection.set(this.id, { ...current, ...data });
  }
}

class FakeDocumentSnapshot {
  constructor(private collection: FakeCollection, private id: string, private value: Record<string, any>) {}

  data() {
    return this.value;
  }

  get ref() {
    return new FakeDocRef(this.collection, this.id);
  }
}

class FakeQuery {
  constructor(
    private collection: FakeCollection,
    private filters: Array<{ field: string; value: unknown }>,
    private orderField?: string,
    private orderDirection: 'asc' | 'desc' = 'asc',
    private limitCount?: number
  ) {}

  where(field: string, _op: WhereFilterOp, value: unknown) {
    return new FakeQuery(this.collection, [...this.filters, { field, value }], this.orderField, this.orderDirection, this.limitCount);
  }

  orderBy(field: string, direction: OrderByDirection = 'asc') {
    return new FakeQuery(this.collection, this.filters, field, direction, this.limitCount);
  }

  limit(count: number) {
    return new FakeQuery(this.collection, this.filters, this.orderField, this.orderDirection, count);
  }

  async get() {
    let docs = this.collection.all();
    if (this.filters.length > 0) {
      docs = docs.filter(({ value }) =>
        this.filters.every((filter) => {
          const stored = value[filter.field];
          return stored === filter.value;
        })
      );
    }

    if (this.orderField) {
      const field = this.orderField;
      const direction = this.orderDirection;
      docs = docs.sort((a, b) => {
        const aValue = normalizeSortable(a.value[field]);
        const bValue = normalizeSortable(b.value[field]);
        if (aValue === bValue) return 0;
        return direction === 'desc' ? (aValue < bValue ? 1 : -1) : aValue < bValue ? -1 : 1;
      });
    }

    if (typeof this.limitCount === 'number') {
      docs = docs.slice(0, this.limitCount);
    }

    return {
      docs: docs.map(({ id, value }) => new FakeDocumentSnapshot(this.collection, id, value)),
      empty: docs.length === 0
    };
  }
}

class FakeCollection {
  private docs = new Map<string, Record<string, any>>();
  private counter = 0;

  constructor(private name: string) {}

  doc(id: string) {
    return new FakeDocRef(this, id);
  }

  add(data: Record<string, unknown>) {
    const id = `${this.name}_${this.counter++}`;
    this.docs.set(id, data);
    return Promise.resolve({ id });
  }

  where(field: string, op: WhereFilterOp, value: unknown) {
    return new FakeQuery(this, [{ field, value }], undefined, 'asc', undefined);
  }

  orderBy(field: string, direction: OrderByDirection = 'asc') {
    return new FakeQuery(this, [], field, direction, undefined);
  }

  limit(count: number) {
    return new FakeQuery(this, [], undefined, 'asc', count);
  }

  all() {
    return Array.from(this.docs.entries()).map(([id, value]) => ({ id, value }));
  }

  get(id: string) {
    return this.docs.get(id);
  }

  set(id: string, value: Record<string, unknown>) {
    this.docs.set(id, value);
  }

  reset() {
    this.docs.clear();
    this.counter = 0;
  }
}

class FakeFirestore {
  private collections = new Map<string, FakeCollection>();

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new FakeCollection(name));
    }
    return this.collections.get(name)!;
  }

  reset() {
    for (const collection of this.collections.values()) {
      collection.reset();
    }
  }
}

const fakeDb = new FakeFirestore();

vi.mock('../lib/firebase-admin.js', () => ({
  getFirestore: () => fakeDb
}));

const actualOtpModule = await vi.importActual<typeof import('../utils/otp.js')>('../utils/otp.js');
vi.mock('../utils/otp.js', () => ({
  ...actualOtpModule,
  generateOtpCode: vi.fn(() => '654321')
}));

process.env.SESSION_SECRET = 'x'.repeat(64);
process.env.SMTP_HOST = 'smtp.test';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.EMAIL_FROM = 'no-reply@test.com';
process.env.APP_URL = 'http://localhost:3000';
process.env.FIREBASE_ADMIN_PROJECT_ID = 'demo';

const { app } = await import('../index.js');

function normalizeSortable(value: any) {
  if (!value) return 0;
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return value;
}

describe('auth routes', () => {
  beforeEach(() => {
    fakeDb.reset();
    rateTracker.clear();
    sendOtpEmail.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    rateTracker.clear();
  });

  it('throttles OTP requests if called twice quickly', async () => {
    const email = 'user@example.com';

    const first = await request(app).post('/auth/request-otp').send({ email });
    expect(first.status).toBe(200);
    expect(sendOtpEmail).toHaveBeenCalledWith(email, '654321');

    const second = await request(app).post('/auth/request-otp').send({ email });
    expect(second.status).toBe(429);
    expect(second.body.error).toBe('Terlalu sering. Coba lagi 1 menit.');
  });

  it('locks verification after five wrong attempts', async () => {
    const email = 'user@example.com';
    await request(app).post('/auth/request-otp').send({ email });

    for (let i = 0; i < 4; i += 1) {
      const res = await request(app).post('/auth/verify-otp').send({ email, code: '000000' });
      expect(res.status).toBe(400);
    }

    const locked = await request(app).post('/auth/verify-otp').send({ email, code: '000000' });
    expect(locked.status).toBe(429);
  });

  it('creates session cookie on successful verification', async () => {
    const email = 'user@example.com';
    await request(app).post('/auth/request-otp').send({ email });

    const response = await request(app)
      .post('/auth/verify-otp')
      .send({ email, code: '654321' });

    expect(response.status).toBe(200);
    const cookie = response.get('set-cookie')[0];
    expect(cookie).toMatch(/umkm_session=/);
  });
});
