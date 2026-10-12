import Counter from '../models/Counter.js';
import { getTodayInTimeZone } from './dateOnly.js';

const DEFAULT_PREFIX = 'LV';
const SEQUENCE_PADDING = 6;

/**
 * Generate a collision-free, human-readable application ID.
 *
 * Uses an atomic counter increment so concurrent submissions cannot receive
 * the same sequence number. Format: `<PREFIX>-<YYYY>-<NNNNNN>`, e.g.
 * `LV-2026-000123`.
 */
export async function generateApplicationId({
  prefix = DEFAULT_PREFIX,
  timeZone = 'Asia/Kolkata',
} = {}) {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'leaveApplication' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const year = getTodayInTimeZone(timeZone).slice(0, 4);
  const sequence = String(counter.seq).padStart(SEQUENCE_PADDING, '0');
  return `${prefix}-${year}-${sequence}`;
}
