import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parsePagination, buildPaginationMeta } from '../src/utils/pagination.js';

test('parsePagination applies defaults when no query is provided', () => {
  assert.deepEqual(parsePagination(), { page: 1, limit: 20, skip: 0 });
});

test('parsePagination reads page and limit from the query string', () => {
  assert.deepEqual(parsePagination({ page: '3', limit: '10' }), {
    page: 3,
    limit: 10,
    skip: 20,
  });
});

test('parsePagination clamps invalid and out-of-range values', () => {
  assert.equal(parsePagination({ page: '0' }).page, 1);
  assert.equal(parsePagination({ page: '-4' }).page, 1);
  assert.equal(parsePagination({ page: 'abc' }).page, 1);
  assert.equal(parsePagination({ limit: '0' }).limit, 1);
  assert.equal(parsePagination({ limit: '999' }).limit, 100);
  assert.equal(parsePagination({ limit: 'abc' }).limit, 20);
});

test('parsePagination supports custom default and max limits', () => {
  const parsed = parsePagination({}, { defaultLimit: 5, maxLimit: 50 });
  assert.equal(parsed.limit, 5);
  assert.equal(parsePagination({ limit: '80' }, { maxLimit: 50 }).limit, 50);
});

test('buildPaginationMeta computes total pages', () => {
  assert.deepEqual(buildPaginationMeta({ page: 1, limit: 20, total: 45 }), {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3,
  });
  assert.equal(buildPaginationMeta({ page: 1, limit: 20, total: 0 }).totalPages, 0);
});
