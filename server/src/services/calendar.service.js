import mongoose from 'mongoose';
import AcademicCalendarEvent, { CALENDAR_EVENT_TYPES } from '../models/AcademicCalendarEvent.js';
import InstitutionSettings from '../models/InstitutionSettings.js';
import {
  compareDateOnly,
  enumerateDateOnly,
  isWeekend,
  isValidDateOnly,
} from '../utils/dateOnly.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './audit.service.js';

const HOLIDAY_TYPES = new Set(['public_holiday', 'institution_holiday']);
const ALLOWED_TYPES = new Set(CALENDAR_EVENT_TYPES);

function ensureObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid calendar event identifier', 400, 'VALIDATION_ERROR', [
      { field: 'id', message: 'Identifier is not valid' },
    ]);
  }
}

export function validateEventInput({ name, startDate, endDate, type, description }, isUpdate = false) {
  const details = [];

  if (!isUpdate || name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      details.push({ field: 'name', message: 'Event name is required' });
    } else if (name.trim().length > 150) {
      details.push({ field: 'name', message: 'Event name must be at most 150 characters' });
    }
  }

  if (!isUpdate || type !== undefined) {
    if (!type || !ALLOWED_TYPES.has(type)) {
      details.push({
        field: 'type',
        message: `Event type must be one of: ${CALENDAR_EVENT_TYPES.join(', ')}`,
      });
    }
  }

  if (!isUpdate || startDate !== undefined) {
    if (!isValidDateOnly(startDate)) {
      details.push({ field: 'startDate', message: 'Start date must be a valid YYYY-MM-DD date' });
    }
  }

  const effectiveEnd = endDate !== undefined && endDate !== '' ? endDate : startDate;
  if (!isUpdate || endDate !== undefined) {
    if (effectiveEnd && !isValidDateOnly(effectiveEnd)) {
      details.push({ field: 'endDate', message: 'End date must be a valid YYYY-MM-DD date' });
    }
  }

  if (description !== undefined && description !== null && typeof description === 'string' && description.length > 500) {
    details.push({ field: 'description', message: 'Description must be at most 500 characters' });
  }

  if (details.length > 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  if (startDate && effectiveEnd && compareDateOnly(effectiveEnd, startDate) < 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'endDate', message: 'End date cannot be before the start date' },
    ]);
  }
}

/**
 * Calendar events that overlap an inclusive date range.
 */
export async function getEventsInRange({ startDate, endDate, activeOnly = true }) {
  const filter = { startDate: { $lte: endDate }, endDate: { $gte: startDate } };
  if (activeOnly) filter.isActive = true;
  return AcademicCalendarEvent.find(filter).sort({ startDate: 1, name: 1 });
}

export async function listEvents({ startDate, endDate, type, includeInactive = false } = {}) {
  const filter = {};
  if (!includeInactive) {
    filter.isActive = true;
  }
  if (type && ALLOWED_TYPES.has(type)) {
    filter.type = type;
  }

  if (isValidDateOnly(startDate) && isValidDateOnly(endDate)) {
    filter.startDate = { $lte: endDate };
    filter.endDate = { $gte: startDate };
  } else if (isValidDateOnly(startDate)) {
    filter.endDate = { $gte: startDate };
  } else if (isValidDateOnly(endDate)) {
    filter.startDate = { $lte: endDate };
  }

  return AcademicCalendarEvent.find(filter)
    .sort({ startDate: 1, name: 1 })
    .limit(500);
}

export async function getEventById({ id }) {
  ensureObjectId(id);
  const event = await AcademicCalendarEvent.findById(id);
  if (!event) {
    throw new AppError('Calendar event not found', 404, 'NOT_FOUND');
  }
  return event;
}

export async function createEvent({ data = {}, user }) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const type = data.type;
  const startDate = typeof data.startDate === 'string' ? data.startDate.trim() : '';
  const endDate =
    typeof data.endDate === 'string' && data.endDate.trim() !== ''
      ? data.endDate.trim()
      : startDate;
  const description =
    typeof data.description === 'string' ? data.description.trim() : '';
  const isActive = data.isActive !== false;

  validateEventInput({ name, startDate, endDate, type, description }, false);

  // Check for overlapping events (permitted, informational)
  const overlapping = await getEventsInRange({ startDate, endDate, activeOnly: true });

  const event = new AcademicCalendarEvent({
    name,
    type,
    startDate,
    endDate,
    description,
    isActive,
    createdBy: user?._id || null,
  });

  const saved = await event.save();

  await recordAudit({
    actor: user,
    action: 'calendar_event_created',
    targetType: 'academic_calendar_event',
    targetId: saved._id,
    summary: `Created calendar event "${saved.name}" (${saved.type}: ${saved.startDate} -> ${saved.endDate})`,
  });

  return {
    event: saved,
    overlappingCount: overlapping.length,
    overlappingEvents: overlapping.map((ev) => ev.name),
  };
}

export async function updateEvent({ id, data = {}, user }) {
  ensureObjectId(id);
  const event = await AcademicCalendarEvent.findById(id);
  if (!event) {
    throw new AppError('Calendar event not found', 404, 'NOT_FOUND');
  }

  const name = data.name !== undefined ? (typeof data.name === 'string' ? data.name.trim() : '') : event.name;
  const type = data.type !== undefined ? data.type : event.type;
  const startDate = data.startDate !== undefined ? (typeof data.startDate === 'string' ? data.startDate.trim() : '') : event.startDate;
  const endDate = data.endDate !== undefined ? (typeof data.endDate === 'string' ? data.endDate.trim() : '') : event.endDate;
  const description = data.description !== undefined ? (typeof data.description === 'string' ? data.description.trim() : '') : event.description;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : event.isActive;

  validateEventInput({ name, startDate, endDate, type, description }, true);

  event.name = name;
  event.type = type;
  event.startDate = startDate;
  event.endDate = endDate;
  event.description = description;
  event.isActive = isActive;
  event.updatedBy = user?._id || null;

  const saved = await event.save();

  await recordAudit({
    actor: user,
    action: 'calendar_event_updated',
    targetType: 'academic_calendar_event',
    targetId: saved._id,
    summary: `Updated calendar event "${saved.name}" (${saved.type}: ${saved.startDate} -> ${saved.endDate})`,
  });

  return saved;
}

export async function deleteEvent({ id, user }) {
  ensureObjectId(id);
  const event = await AcademicCalendarEvent.findById(id);
  if (!event) {
    throw new AppError('Calendar event not found', 404, 'NOT_FOUND');
  }

  await AcademicCalendarEvent.findByIdAndDelete(id);

  await recordAudit({
    actor: user,
    action: 'calendar_event_deleted',
    targetType: 'academic_calendar_event',
    targetId: id,
    summary: `Deleted calendar event "${event.name}" (${event.type}: ${event.startDate} -> ${event.endDate})`,
  });

  return { deleted: true, id, name: event.name };
}

export function validateRangeInput({ startDate, endDate }) {
  const details = [];
  if (!isValidDateOnly(startDate)) {
    details.push({ field: 'startDate', message: 'Enter a valid start date' });
  }
  if (!isValidDateOnly(endDate)) {
    details.push({ field: 'endDate', message: 'Enter a valid end date' });
  }
  if (details.length > 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }
  if (compareDateOnly(endDate, startDate) < 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'endDate', message: 'End date cannot be before the start date' },
    ]);
  }
}

function eventsToDateMap(events) {
  const map = new Map();
  for (const event of events) {
    if (!isValidDateOnly(event.startDate) || !isValidDateOnly(event.endDate)) continue;
    for (const date of enumerateDateOnly(event.startDate, event.endDate)) {
      if (!map.has(date)) map.set(date, []);
      map.get(date).push({ name: event.name, type: event.type });
    }
  }
  return map;
}

/**
 * Inspect a candidate leave range against weekends and calendar events.
 *
 * The result is purely informational: submission validation always runs again
 * on the server, and a warning is never treated as a rejection.
 */
export async function checkDateRange({ startDate, endDate, settings }) {
  validateRangeInput({ startDate, endDate });

  const resolvedSettings = settings || (await InstitutionSettings.getSettings());
  const policy = resolvedSettings.leavePolicy || {};
  const weekendCounts = policy.weekendCountsTowardLeave !== false;
  const holidayCounts = policy.holidayCountsTowardLeave !== false;
  const allowOnHolidays = policy.allowLeaveOnHolidays !== false;

  const events = await getEventsInRange({ startDate, endDate });
  const eventMap = eventsToDateMap(events);

  const dates = enumerateDateOnly(startDate, endDate).map((date) => {
    const weekend = isWeekend(date);
    const dayEvents = eventMap.get(date) || [];
    const holidayEvents = dayEvents.filter((event) => HOLIDAY_TYPES.has(event.type));
    const holiday = holidayEvents.length > 0;
    const holidayName = holidayEvents.map((event) => event.name).join(', ');
    const countsTowardLeave =
      (weekendCounts || !weekend) && (holidayCounts || !holiday);
    return { date, weekend, holiday, holidayName, countsTowardLeave, events: dayEvents };
  });

  const calendarDays = dates.length;
  const policyDays = dates.filter((day) => day.countsTowardLeave).length;
  const weekendDays = dates.filter((day) => day.weekend).length;
  const holidayDays = dates.filter((day) => day.holiday).length;

  const warnings = [];

  if (weekendDays > 0) {
    warnings.push(
      weekendCounts
        ? `${weekendDays} weekend day(s) fall in this range and count toward your leave.`
        : `${weekendDays} weekend day(s) fall in this range and are excluded from your leave.`
    );
  }

  if (holidayDays > 0) {
    const names = [
      ...new Set(
        events.filter((event) => HOLIDAY_TYPES.has(event.type)).map((event) => event.name)
      ),
    ];
    warnings.push(
      holidayCounts
        ? `${holidayDays} holiday day(s) (${names.join(', ')}) fall in this range and count toward your leave.`
        : `${holidayDays} holiday day(s) (${names.join(', ')}) fall in this range and are excluded from your leave.`
    );
    if (!allowOnHolidays) {
      warnings.push('Leave is not normally allowed on holidays under the current policy.');
    }
  }

  const academicEvents = events.filter((event) => event.type === 'academic_event');
  if (academicEvents.length > 0) {
    warnings.push(
      `${academicEvents.length} academic event(s) overlap this range: ${academicEvents
        .map((event) => event.name)
        .join(', ')}.`
    );
  }

  return {
    startDate,
    endDate,
    calendarDays,
    policyDays,
    weekendDays,
    holidayDays,
    dates,
    events: events.map((event) => event.toJSON()),
    warnings,
    policy: {
      weekendCountsTowardLeave: weekendCounts,
      holidayCountsTowardLeave: holidayCounts,
      allowLeaveOnHolidays: allowOnHolidays,
    },
  };
}
