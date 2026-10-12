import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidDateOnly,
  addDays,
  compareDateOnly,
  isOnOrAfter,
  daysBetweenInclusive,
  enumerateDateOnly,
  isWeekend,
  getTodayInTimeZone,
  formatDateOnlyForDisplay,
} from '../src/utils/dateOnly.js';

test('isValidDateOnly accepts real calendar dates only', () => {
  assert.equal(isValidDateOnly('2026-10-12'), true);
  assert.equal(isValidDateOnly('2026-02-30'), false);
  assert.equal(isValidDateOnly('2026-13-01'), false);
  assert.equal(isValidDateOnly('2026-2-03'), false);
  assert.equal(isValidDateOnly('not-a-date'), false);
  assert.equal(isValidDateOnly(20261012), false);
  assert.equal(isValidDateOnly(null), false);
});

test('addDays handles month and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
});

test('compareDateOnly and isOnOrAfter compare lexicographically', () => {
  assert.equal(compareDateOnly('2026-10-01', '2026-10-12'), -1);
  assert.equal(compareDateOnly('2026-10-12', '2026-10-01'), 1);
  assert.equal(compareDateOnly('2026-10-12', '2026-10-12'), 0);
  assert.equal(isOnOrAfter('2026-10-12', '2026-10-12'), true);
  assert.equal(isOnOrAfter('2026-10-01', '2026-10-12'), false);
});

test('daysBetweenInclusive counts calendar days inclusively', () => {
  assert.equal(daysBetweenInclusive('2026-10-01', '2026-10-01'), 1);
  assert.equal(daysBetweenInclusive('2026-10-01', '2026-10-05'), 5);
  assert.equal(daysBetweenInclusive('2026-12-30', '2027-01-02'), 4);
});

test('enumerateDateOnly returns every day from start through end', () => {
  const dates = enumerateDateOnly('2026-10-01', '2026-10-03');
  assert.deepEqual(dates, ['2026-10-01', '2026-10-02', '2026-10-03']);
  assert.deepEqual(enumerateDateOnly('2026-10-01', '2026-10-01'), ['2026-10-01']);
});

test('isWeekend detects Saturday and Sunday', () => {
  // 2026-01-01 is a Thursday, so 03/04 are the weekend.
  assert.equal(isWeekend('2026-01-03'), true);
  assert.equal(isWeekend('2026-01-04'), true);
  assert.equal(isWeekend('2026-01-05'), false);
  assert.equal(isWeekend('2026-01-01'), false);
});

test('formatDateOnlyForDisplay renders a stable, timezone-safe label', () => {
  assert.equal(formatDateOnlyForDisplay('2026-10-12'), '12 Oct 2026');
  assert.equal(formatDateOnlyForDisplay('2026-01-05'), '05 Jan 2026');
  assert.equal(formatDateOnlyForDisplay('invalid'), '');
});

test('getTodayInTimeZone returns a valid YYYY-MM-DD string', () => {
  const today = getTodayInTimeZone('Asia/Kolkata');
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(isValidDateOnly(today), true);
});
