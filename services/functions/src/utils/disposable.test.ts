import { describe, expect, it } from 'vitest';
import { DISPOSABLE, isDisposableDomain } from './disposable.js';

describe('disposable email set', () => {
  it('contains known disposable domains', () => {
    expect(DISPOSABLE.has('mailinator.com')).toBe(true);
    expect(isDisposableDomain('yopmail.com')).toBe(true);
    expect(isDisposableDomain('example.com')).toBe(false);
  });
});
