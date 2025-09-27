import { describe, expect, it, beforeAll } from 'vitest';
import { verifySignature } from './midtrans.js';

describe('midtrans helpers', () => {
  beforeAll(() => {
    process.env.MIDTRANS_SERVER_KEY = 'server-key';
    process.env.MIDTRANS_CLIENT_KEY = 'client-key';
  });

  it('validates signature_key correctly', () => {
    const payload = {
      order_id: 'order-1',
      status_code: '200',
      gross_amount: '10000',
      signature_key: '06a7b3d3f0cdd6535e32d2b352ff71739708b2ca264c5569a562044fe4ca2ff2d0e6bf92e34c7a796924312178c4ba75fca476439e1a245c380818338c5bd7f6'
    };
    const valid = verifySignature(payload);
    expect(valid).toBe(true);
  });
});
