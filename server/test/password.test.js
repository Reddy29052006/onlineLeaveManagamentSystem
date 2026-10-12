import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword } from '../src/utils/password.js';

test('hashPassword produces a bcrypt hash that verifyPassword accepts', async () => {
  const hash = await hashPassword('Demo@12345');
  assert.notEqual(hash, 'Demo@12345');
  assert.equal(await verifyPassword('Demo@12345', hash), true);
});

test('verifyPassword rejects the wrong password', async () => {
  const hash = await hashPassword('Demo@12345');
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('verifyPassword safely handles missing inputs', async () => {
  const hash = await hashPassword('Demo@12345');
  assert.equal(await verifyPassword('', hash), false);
  assert.equal(await verifyPassword('Demo@12345', ''), false);
  assert.equal(await verifyPassword(null, null), false);
});

test('hashPassword salts each hash differently', async () => {
  const [first, second] = await Promise.all([
    hashPassword('same-password'),
    hashPassword('same-password'),
  ]);
  assert.notEqual(first, second);
});
