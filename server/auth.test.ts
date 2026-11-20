import assert from 'node:assert/strict';
import test from 'node:test';
import { createPortalToken, hashPortalToken } from './auth';

test('portal tokens are URL-safe and hashed without retaining the raw token', () => {
  const token = createPortalToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(hashPortalToken(token), /^[\da-f]{64}$/);
  assert.notEqual(hashPortalToken(token), token);
  assert.notEqual(hashPortalToken(createPortalToken()), hashPortalToken(token));
});
