import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { signatureMatches } from './webhooks';

test('Paystack webhook signatures require the exact raw-body HMAC', () => {
  const body = Buffer.from('{"event":"charge.success"}');
  const secret = 'test-secret';
  const signature = createHmac('sha512', secret).update(body).digest('hex');
  assert.equal(signatureMatches(body, signature, secret, 'sha512'), true);
  assert.equal(signatureMatches(Buffer.from('{"event":"charge.failed"}'), signature, secret, 'sha512'), false);
  assert.equal(signatureMatches(body, signature, 'wrong-secret', 'sha512'), false);
});

test('WhatsApp signatures accept the Meta sha256 prefix and reject malformed values', () => {
  const body = Buffer.from('{"object":"whatsapp_business_account"}');
  const secret = 'meta-test-secret';
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(signatureMatches(body, `sha256=${signature}`, secret, 'sha256', 'sha256='), true);
  assert.equal(signatureMatches(body, 'sha256=not-hex', secret, 'sha256', 'sha256='), false);
});
